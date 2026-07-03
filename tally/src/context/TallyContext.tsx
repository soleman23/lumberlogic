import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createInitialTallyState, normalizeTallyState } from '../lib/constants'
import {
  addTruck,
  clearTally,
  grandTotals,
  removeTruck,
  setTruckMemberQty,
  toggleTruckMember,
  updateTruck,
} from '../lib/tallyMath'
import { tallyRepository } from '../repositories/localStorage'
import type { DimId, HwId, TallyState } from '../types'

type TallyContextValue = {
  state: TallyState
  totals: ReturnType<typeof grandTotals>
  setPieces: (name: DimId, value: number) => void
  setBase: (name: DimId, value: number) => void
  setUnits: (name: DimId, length: number, value: number) => void
  setOverride: (name: DimId, length: number, value: number | null) => void
  setHardwoodBf: (id: HwId, bf: number) => void
  setHardwoodPrice: (id: HwId, price: number) => void
  resetAll: () => void
  addTruckGroup: () => void
  removeTruckGroup: (id: number) => void
  patchTruck: (id: number, patch: Partial<TallyState['trucks'][0]>) => void
  toggleMember: (truckId: number, dimId: DimId) => void
  setMemberQty: (truckId: number, dimId: DimId, qty: number) => void
  replaceState: (state: TallyState) => void
}

const TallyContext = createContext<TallyContextValue | null>(null)

export function TallyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TallyState>(() => {
    const loaded = tallyRepository.load()
    return loaded ? normalizeTallyState(loaded) : createInitialTallyState()
  })

  useEffect(() => {
    tallyRepository.save(state)
  }, [state])

  const totals = useMemo(() => grandTotals(state), [state])

  const setPieces = useCallback((name: DimId, value: number) => {
    setState((s) => ({ ...s, pieces: { ...s.pieces, [name]: value } }))
  }, [])

  const setBase = useCallback((name: DimId, value: number) => {
    setState((s) => ({ ...s, base: { ...s.base, [name]: value } }))
  }, [])

  const setUnits = useCallback((name: DimId, length: number, value: number) => {
    setState((s) => ({ ...s, units: { ...s.units, [`${name}|${length}`]: value } }))
  }, [])

  const setOverride = useCallback((name: DimId, length: number, value: number | null) => {
    setState((s) => ({ ...s, override: { ...s.override, [`${name}|${length}`]: value } }))
  }, [])

  const setHardwoodBf = useCallback((id: HwId, bf: number) => {
    setState((s) => ({
      ...s,
      hardwood: { ...s.hardwood, [id]: { ...s.hardwood[id], bf: Math.max(0, bf) } },
    }))
  }, [])

  const setHardwoodPrice = useCallback((id: HwId, price: number) => {
    setState((s) => ({
      ...s,
      hardwood: { ...s.hardwood, [id]: { ...s.hardwood[id], price: Math.max(0, price) } },
    }))
  }, [])

  const resetAll = useCallback(() => setState((s) => clearTally(s)), [])
  const addTruckGroup = useCallback(() => setState((s) => addTruck(s)), [])
  const removeTruckGroup = useCallback((id: number) => setState((s) => removeTruck(s, id)), [])
  const patchTruck = useCallback((id: number, patch: Partial<TallyState['trucks'][0]>) => {
    setState((s) => updateTruck(s, id, patch))
  }, [])
  const toggleMember = useCallback((truckId: number, dimId: DimId) => {
    setState((s) => toggleTruckMember(s, truckId, dimId))
  }, [])
  const setMemberQty = useCallback((truckId: number, dimId: DimId, qty: number) => {
    setState((s) => setTruckMemberQty(s, truckId, dimId, qty))
  }, [])
  const replaceState = useCallback((next: TallyState) => setState(next), [])

  const value = useMemo(
    () => ({
      state,
      totals,
      setPieces,
      setBase,
      setUnits,
      setOverride,
      setHardwoodBf,
      setHardwoodPrice,
      resetAll,
      addTruckGroup,
      removeTruckGroup,
      patchTruck,
      toggleMember,
      setMemberQty,
      replaceState,
    }),
    [
      state,
      totals,
      setPieces,
      setBase,
      setUnits,
      setOverride,
      setHardwoodBf,
      setHardwoodPrice,
      resetAll,
      addTruckGroup,
      removeTruckGroup,
      patchTruck,
      toggleMember,
      setMemberQty,
      replaceState,
    ],
  )

  return <TallyContext.Provider value={value}>{children}</TallyContext.Provider>
}

export function useTally() {
  const ctx = useContext(TallyContext)
  if (!ctx) throw new Error('useTally must be used within TallyProvider')
  return ctx
}
