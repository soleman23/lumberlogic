import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { findSpecies } from '../lib/applyPrices'
import { createEmptyTallyState, normalizeTallyState } from '../lib/constants'
import { createDemoLoads, isDemoDataEnabled } from '../domain/demoData'
import { runStorageMigration } from '../domain/migrations/storage'
import { loadRepository } from '../repositories/localStorage'
import type { SavedLoad } from '../types'
import { useTally } from './TallyContext'
import { useToast } from './ToastContext'

const APPLY_SPECIES_KEY = 'lumber-logic-apply-species'

type LoadsContextValue = {
  loads: SavedLoad[]
  activeLoadId: string | null
  isDirty: boolean
  applySpeciesKey: string
  setApplySpeciesKey: (key: string) => void
  saveCurrentLoad: (
    meta: Pick<SavedLoad, 'name' | 'sub' | 'species' | 'status' | 'contact' | 'role' | 'email' | 'freight'>,
    options?: { asCopy?: boolean },
  ) => SavedLoad
  updateActiveLoad: () => SavedLoad | null
  updateLoad: (load: SavedLoad) => void
  deleteLoad: (id: string) => void
  duplicateLoad: (id: string) => SavedLoad | null
  openLoad: (id: string) => boolean
  newLoad: () => void
  loadDemoData: () => void
}

const LoadsContext = createContext<LoadsContextValue | null>(null)

function withTallyFallback(load: SavedLoad): SavedLoad {
  if (!load.tally) return { ...load, tally: createEmptyTallyState() }
  return { ...load, tally: normalizeTallyState(load.tally) }
}

function initLoads(): SavedLoad[] {
  runStorageMigration()
  const existing = loadRepository.list().map(withTallyFallback)
  if (existing.length > 0) return existing
  if (isDemoDataEnabled()) return createDemoLoads()
  return []
}

export function LoadsProvider({ children }: { children: ReactNode }) {
  const [loads, setLoads] = useState<SavedLoad[]>(() => initLoads())
  const [activeLoadId, setActiveLoadId] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const baselineRef = useRef<string>('')
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

  useEffect(() => {
    const snap = JSON.stringify(state)
    if (!baselineRef.current) {
      baselineRef.current = snap
      return
    }
    setIsDirty(snap !== baselineRef.current)
  }, [state])

  const persist = useCallback((next: SavedLoad[]) => setLoads(next), [])

  const buildLoadFromWorksheet = useCallback(
    (
      meta: Pick<SavedLoad, 'name' | 'sub' | 'species' | 'status' | 'contact' | 'role' | 'email' | 'freight'>,
      id: string,
    ): SavedLoad => {
      const now = new Date().toISOString()
      return {
        id,
        ...meta,
        bf: Math.round(totals.bf),
        value: Math.round(totals.sellingValue ?? totals.cost),
        pieces: Math.round(totals.pcs),
        date: now.slice(0, 10),
        tally: structuredClone(state),
        freight: meta.freight ?? 0,
        createdAt: now,
        updatedAt: now,
        lastSavedAt: now,
        schemaVersion: 2,
      }
    },
    [state, totals],
  )

  const saveCurrentLoad = useCallback(
    (
      meta: Pick<SavedLoad, 'name' | 'sub' | 'species' | 'status' | 'contact' | 'role' | 'email' | 'freight'>,
      options?: { asCopy?: boolean },
    ) => {
      const id = options?.asCopy || !activeLoadId ? crypto.randomUUID() : activeLoadId
      const load = buildLoadFromWorksheet(meta, id)
      if (activeLoadId && !options?.asCopy) {
        const existing = loads.find((l) => l.id === activeLoadId)
        if (existing) {
          load.createdAt = existing.createdAt ?? load.createdAt
        }
        persist(loads.map((l) => (l.id === activeLoadId ? load : l)))
      } else {
        persist([load, ...loads])
      }
      setActiveLoadId(load.id)
      baselineRef.current = JSON.stringify(state)
      setIsDirty(false)
      return load
    },
    [activeLoadId, buildLoadFromWorksheet, loads, persist, state],
  )

  const updateActiveLoad = useCallback(() => {
    if (!activeLoadId) return null
    const existing = loads.find((l) => l.id === activeLoadId)
    if (!existing) return null
    const now = new Date().toISOString()
    const updated: SavedLoad = {
      ...existing,
      bf: Math.round(totals.bf),
      value: Math.round(totals.sellingValue ?? totals.cost),
      pieces: Math.round(totals.pcs),
      tally: structuredClone(state),
      updatedAt: now,
      lastSavedAt: now,
      date: now.slice(0, 10),
    }
    persist(loads.map((l) => (l.id === activeLoadId ? updated : l)))
    baselineRef.current = JSON.stringify(state)
    setIsDirty(false)
    return updated
  }, [activeLoadId, loads, persist, state, totals])

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
      if (activeLoadId === id) {
        setActiveLoadId(null)
        replaceState(createEmptyTallyState())
        baselineRef.current = JSON.stringify(createEmptyTallyState())
        setIsDirty(false)
      }
    },
    [activeLoadId, loads, persist, replaceState],
  )

  const duplicateLoad = useCallback(
    (id: string) => {
      const src = loads.find((l) => l.id === id)
      if (!src) return null
      const now = new Date().toISOString()
      const copy: SavedLoad = {
        ...structuredClone(src),
        id: crypto.randomUUID(),
        status: 'Draft',
        date: now.slice(0, 10),
        sub: src.sub + ' (copy)',
        createdAt: now,
        updatedAt: now,
        isDemo: false,
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
      if (isDirty) {
        showToast('Unsaved worksheet changes — open anyway from saved load')
      }
      replaceState(load.tally)
      setActiveLoadId(load.id)
      baselineRef.current = JSON.stringify(load.tally)
      setIsDirty(false)
      const species = findSpecies(load.species)
      if (species) setApplySpeciesKey(species.key)
      return true
    },
    [isDirty, loads, replaceState, showToast],
  )

  const newLoad = useCallback(() => {
    if (isDirty) showToast('Starting new load — save current worksheet first if needed')
    const empty = createEmptyTallyState()
    replaceState(empty)
    setActiveLoadId(null)
    baselineRef.current = JSON.stringify(empty)
    setIsDirty(false)
  }, [isDirty, replaceState, showToast])

  const loadDemoData = useCallback(() => {
    if (!isDemoDataEnabled()) {
      showToast('Demo data is only available in development')
      return
    }
    const demo = createDemoLoads()
    persist([...demo, ...loads.filter((l) => !l.isDemo)])
    showToast('Demo loads added (labeled, blocked from real send)')
  }, [loads, persist, showToast])

  const value = useMemo(
    () => ({
      loads,
      activeLoadId,
      isDirty,
      applySpeciesKey,
      setApplySpeciesKey,
      saveCurrentLoad,
      updateActiveLoad,
      updateLoad,
      deleteLoad,
      duplicateLoad,
      openLoad,
      newLoad,
      loadDemoData,
    }),
    [
      loads,
      activeLoadId,
      isDirty,
      applySpeciesKey,
      saveCurrentLoad,
      updateActiveLoad,
      updateLoad,
      deleteLoad,
      duplicateLoad,
      openLoad,
      newLoad,
      loadDemoData,
    ],
  )

  return <LoadsContext.Provider value={value}>{children}</LoadsContext.Provider>
}

export function useLoads() {
  const ctx = useContext(LoadsContext)
  if (!ctx) throw new Error('useLoads must be used within LoadsProvider')
  return ctx
}
