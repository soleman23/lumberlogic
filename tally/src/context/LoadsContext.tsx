import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { SEED_LOADS } from '../lib/priceData'
import { createInitialTallyState } from '../lib/constants'
import { loadRepository } from '../repositories/localStorage'
import type { SavedLoad, TallyState } from '../types'
import { useTally } from './TallyContext'
import { useToast } from './ToastContext'

type LoadsContextValue = {
  loads: SavedLoad[]
  saveCurrentLoad: (meta: Pick<SavedLoad, 'name' | 'sub' | 'species' | 'status'>) => SavedLoad
  updateLoad: (load: SavedLoad) => void
  deleteLoad: (id: string) => void
  duplicateLoad: (id: string) => SavedLoad | null
  openLoad: (id: string) => void
}

const LoadsContext = createContext<LoadsContextValue | null>(null)

function withTallyFallback(load: SavedLoad): SavedLoad {
  return load.tally ? load : { ...load, tally: createInitialTallyState() }
}

function seedIfEmpty(): SavedLoad[] {
  const existing = loadRepository.list()
  const result = existing.length
    ? existing.map(withTallyFallback)
    : SEED_LOADS.map((l, i) => ({
        id: String(i + 1),
        ...l,
        tally: createInitialTallyState(),
      }))
  return result
}

export function LoadsProvider({ children }: { children: ReactNode }) {
  const [loads, setLoads] = useState<SavedLoad[]>(() => seedIfEmpty())
  const { state, totals, replaceState } = useTally()
  const { showToast } = useToast()

  useEffect(() => {
    loadRepository.saveAll(loads)
  }, [loads])

  const persist = useCallback((next: SavedLoad[]) => setLoads(next), [])

  const saveCurrentLoad = useCallback(
    (meta: Pick<SavedLoad, 'name' | 'sub' | 'species' | 'status'>) => {
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
    (id: string) => {
      const load = loads.find((l) => l.id === id)
      if (!load) {
        showToast('Load not found')
        return
      }
      if (!load.tally) {
        showToast('No worksheet saved for this load')
        return
      }
      replaceState(load.tally as TallyState)
    },
    [loads, replaceState, showToast],
  )

  const value = useMemo(
    () => ({ loads, saveCurrentLoad, updateLoad, deleteLoad, duplicateLoad, openLoad }),
    [loads, saveCurrentLoad, updateLoad, deleteLoad, duplicateLoad, openLoad],
  )

  return <LoadsContext.Provider value={value}>{children}</LoadsContext.Provider>
}

export function useLoads() {
  const ctx = useContext(LoadsContext)
  if (!ctx) throw new Error('useLoads must be used within LoadsProvider')
  return ctx
}
