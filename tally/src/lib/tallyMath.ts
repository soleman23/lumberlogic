import type {
  DimId,
  DimensionDef,
  DimTotals,
  GrandTotals,
  TallyState,
  TruckGroup,
  TruckProgress,
} from '../types'
import { DIMENSION_DEFS, LENGTHS, cellKey } from './constants'

export function bfPerFt(d: Pick<DimensionDef, 't' | 'w'>): number {
  return (d.t * d.w) / 12
}

export function cellBF(
  d: DimensionDef,
  length: number,
  units: number,
  piecesPerUnit: number,
): number {
  return units * length * piecesPerUnit * bfPerFt(d)
}

export function effectivePrice(
  state: Pick<TallyState, 'base' | 'override'>,
  name: DimId,
  length: number,
): number {
  const key = cellKey(name, length)
  const override = state.override[key]
  if (override != null) return override
  return state.base[name] || 0
}

export function dimTotals(
  d: DimensionDef,
  state: Pick<TallyState, 'pieces' | 'base' | 'units' | 'override'>,
): DimTotals {
  let bf = 0
  let lf = 0
  let pcs = 0
  let cost = 0
  const piecesPerUnit = state.pieces[d.name] || 0

  LENGTHS.forEach((L) => {
    const u = state.units[cellKey(d.name, L)] || 0
    const cbf = cellBF(d, L, u, piecesPerUnit)
    bf += cbf
    lf += u * L
    pcs += u * piecesPerUnit
    cost += (cbf * effectivePrice(state, d.name, L)) / 1000
  })

  return {
    bf,
    lf,
    pcs,
    cost,
    avg: bf > 0 ? (cost / bf) * 1000 : 0,
  }
}

export function grandTotals(state: Pick<TallyState, 'pieces' | 'base' | 'units' | 'override'>): GrandTotals {
  return DIMENSION_DEFS.reduce(
    (acc, d) => {
      const t = dimTotals(d, state)
      acc.bf += t.bf
      acc.pcs += t.pcs
      acc.cost += t.cost
      return acc
    },
    { bf: 0, pcs: 0, cost: 0 },
  )
}

export function truckProgress(
  truck: TruckGroup,
  state: Pick<TallyState, 'pieces' | 'base' | 'units' | 'override'>,
): TruckProgress {
  let bf = 0
  let lf = 0
  let pcs = 0

  truck.members.forEach((name) => {
    const d = DIMENSION_DEFS.find((x) => x.name === name)
    if (!d) return
    const t = dimTotals(d, state)
    bf += t.bf
    lf += t.lf
    pcs += t.pcs
  })

  const target = truck.target || 0
  const pct = target > 0 ? (bf / target) * 100 : 0
  const over = pct > 100
  const barColor = pct >= 92 && pct <= 105 ? '#2F6342' : over ? '#B5482F' : '#BC7A2C'
  const remain = target - bf
  const remainLabel = over ? `+${Math.round(-remain).toLocaleString('en-US')} over` : `${Math.round(remain).toLocaleString('en-US')} bf left`

  return { bf, lf, pcs, pct, over, barColor, remainLabel }
}

export function clearTally(state: TallyState): TallyState {
  const units: Record<string, number> = {}
  const override: Record<string, number | null> = {}
  Object.keys(state.units).forEach((k) => {
    units[k] = 0
  })
  Object.keys(state.override).forEach((k) => {
    override[k] = null
  })
  return { ...state, units, override }
}

export function addTruck(state: TallyState, name = 'New truck', target = 12000): TallyState {
  const id = state.nextTruckId
  return {
    ...state,
    nextTruckId: id + 1,
    trucks: [...state.trucks, { id, name, target, members: [] }],
  }
}

export function removeTruck(state: TallyState, id: number): TallyState {
  return { ...state, trucks: state.trucks.filter((t) => t.id !== id) }
}

export function updateTruck(state: TallyState, id: number, patch: Partial<TruckGroup>): TallyState {
  return {
    ...state,
    trucks: state.trucks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  }
}

export function toggleTruckMember(state: TallyState, truckId: number, dimId: DimId): TallyState {
  return {
    ...state,
    trucks: state.trucks.map((t) => {
      if (t.id !== truckId) return t
      const has = t.members.includes(dimId)
      return {
        ...t,
        members: has ? t.members.filter((m) => m !== dimId) : [...t.members, dimId],
      }
    }),
  }
}
