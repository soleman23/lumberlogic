import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { SEED_LOADS, SPECIES_CATALOG, buildInitialPrices, priceKey } from '../lib/priceData'
import { findSpecies } from '../lib/applyPrices'
import { createInitialTallyState, normalizeTallyState } from '../lib/constants'
import { loadRepository } from '../repositories/localStorage'
import type { HwId, SavedLoad, TallyState } from '../types'
import { useTally } from './TallyContext'
import { useToast } from './ToastContext'

const APPLY_SPECIES_KEY = 'lumber-logic-apply-species'

type LoadsContextValue = {
  loads: SavedLoad[]
  applySpeciesKey: string
  setApplySpeciesKey: (key: string) => void
  saveCurrentLoad: (
    meta: Pick<SavedLoad, 'name' | 'sub' | 'species' | 'status' | 'contact' | 'role' | 'email' | 'freight'>,
  ) => SavedLoad
  updateLoad: (load: SavedLoad) => void
  deleteLoad: (id: string) => void
  duplicateLoad: (id: string) => SavedLoad | null
  openLoad: (id: string) => boolean
}

const LoadsContext = createContext<LoadsContextValue | null>(null)

function withTallyFallback(load: SavedLoad): SavedLoad {
  if (!load.tally) return { ...load, tally: createInitialTallyState() }
  return { ...load, tally: normalizeTallyState(load.tally) }
}

/** Give hardwood-species seed loads a hardwood tally so their quotes demo real lines. */
function seedTallyFor(load: (typeof SEED_LOADS)[number]): TallyState {
  const tally = createInitialTallyState()
  const species = SPECIES_CATALOG.find((s) => s.name === load.species || load.species.startsWith(s.name))
  if (species?.group !== 'Hardwood') return tally

  const prices = buildInitialPrices()
  const split: [HwId, number][] = [
    ['4/4', 0.6],
    ['5/4', 0.25],
    ['8/4', 0.15],
  ]
  split.forEach(([id, share]) => {
    tally.hardwood[id] = {
      bf: Math.round(load.bf * share),
      price: prices[priceKey(species.key, id)] || 0,
    }
  })
  return tally
}

function seedIfEmpty(): SavedLoad[] {
  const existing = loadRepository.list()
  const result = existing.length
    ? existing.map(withTallyFallback)
    : SEED_LOADS.map((l, i) => ({
        id: String(i + 1),
        ...l,
        tally: seedTallyFor(l),
      }))
  return result
}

export function LoadsProvider({ children }: { children: ReactNode }) {
  const [loads, setLoads] = useState<SavedLoad[]>(() => seedIfEmpty())
  const [applySpeciesKey, setApplySpeciesKey] = useState(
    () => localStorage.getItem(APPLY_SPECIES_KEY) ?? 'df',
  )
  const { state, totals, replaceState } = useTally()
  const { showToast } = useToast()

  useEffect(() => {
    loadRepository.saveAll(loads)
  }, [loads])

  useEffect(() => {
    localStorage.setItem(APPLY_SPECIES_KEY, applySpeciesKey)
  }, [applySpeciesKey])

  const persist = useCallback((next: SavedLoad[]) => setLoads(next), [])

  const saveCurrentLoad = useCallback(
    (meta: Pick<SavedLoad, 'name' | 'sub' | 'species' | 'status' | 'contact' | 'role' | 'email' | 'freight'>) => {
      const load: SavedLoad = {
        id: crypto.randomUUID(),
        ...meta,
        bf: Math.round(totals.bf),
        value: Math.round(totals.cost),
        pieces: Math.round(totals.pcs),
        date: new Date().toISOString().slice(0, 10),
        tally: structuredClone(state),
      }
      persist([load, ...loads])
      return load
    },
    [loads, persist, state, totals],
  )

  const updateLoad = useCallback(
    (load: SavedLoad) => {
      persist(loads.map((l) => (l.id === load.id ? load : l)))
      loadRepository.save(load)
    },
    [loads, persist],
  )

  const deleteLoad = useCallback(
    (id: string) => {
      loadRepository.delete(id)
      persist(loads.filter((l) => l.id !== id))
    },
    [loads, persist],
  )

  const duplicateLoad = useCallback(
    (id: string) => {
      const src = loads.find((l) => l.id === id)
      if (!src) return null
      const copy: SavedLoad = {
        ...structuredClone(src),
        id: crypto.randomUUID(),
        status: 'Draft',
        date: new Date().toISOString().slice(0, 10),
        sub: src.sub + ' (copy)',
      }
      persist([copy, ...loads])
      return copy
    },
    [loads, persist],
  )

  const openLoad = useCallback(
    (id: string): boolean => {
      const load = loads.find((l) => l.id === id)
      if (!load) {
        showToast('Load not found')
        return false
      }
      if (!load.tally) {
        showToast('No worksheet saved for this load')
        return false
      }
      replaceState(load.tally)
      const species = findSpecies(load.species)
      if (species) setApplySpeciesKey(species.key)
      return true
    },
    [loads, replaceState, showToast],
  )

  const value = useMemo(
    () => ({
      loads,
      applySpeciesKey,
      setApplySpeciesKey,
      saveCurrentLoad,
      updateLoad,
      deleteLoad,
      duplicateLoad,
      openLoad,
    }),
    [loads, applySpeciesKey, saveCurrentLoad, updateLoad, deleteLoad, duplicateLoad, openLoad],
  )

  return <LoadsContext.Provider value={value}>{children}</LoadsContext.Provider>
}

export function useLoads() {
  const ctx = useContext(LoadsContext)
  if (!ctx) throw new Error('useLoads must be used within LoadsProvider')
  return ctx
}
