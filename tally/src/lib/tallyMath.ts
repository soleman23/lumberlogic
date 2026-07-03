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

export function dimTotalUnits(
  state: Pick<TallyState, 'units'>,
  dimId: DimId,
): number {
  return LENGTHS.reduce((sum, L) => sum + (state.units[cellKey(dimId, L)] || 0), 0)
}

/** Units assigned to one truck for a dimension (defaults to full worksheet total). */
export function truckMemberQty(
  truck: TruckGroup,
  state: Pick<TallyState, 'units'>,
  dimId: DimId,
): number {
  if (!truck.members.includes(dimId)) return 0
  const worksheetUnits = dimTotalUnits(state, dimId)
  return truck.memberQty?.[dimId] ?? worksheetUnits
}

/** Sum of member quantities for a dimension across all trucks that include it. */
export function dimAllocatedAcrossTrucks(
  state: Pick<TallyState, 'units' | 'trucks'>,
  dimId: DimId,
): number {
  return state.trucks.reduce((sum, truck) => sum + truckMemberQty(truck, state, dimId), 0)
}

export type DimAllocationStatus = {
  worksheet: number
  allocated: number
  remaining: number
  overBy: number
  isOver: boolean
  /** At least one truck includes this dimension. */
  hasAllocation: boolean
}

export function dimAllocationStatus(
  state: Pick<TallyState, 'units' | 'trucks'>,
  dimId: DimId,
): DimAllocationStatus {
  const worksheet = dimTotalUnits(state, dimId)
  const allocated = dimAllocatedAcrossTrucks(state, dimId)
  const overBy = Math.max(0, allocated - worksheet)
  const remaining = Math.max(0, worksheet - allocated)
  const hasAllocation = state.trucks.some((t) => t.members.includes(dimId))
  return {
    worksheet,
    allocated,
    remaining,
    overBy,
    isOver: overBy > 0,
    hasAllocation,
  }
}

export function dimAllocationTotals(
  d: DimensionDef,
  state: Pick<TallyState, 'pieces' | 'base' | 'units' | 'override'>,
  qty: number,
): Pick<DimTotals, 'bf' | 'lf' | 'pcs'> {
  const totalUnits = dimTotalUnits(state, d.name)
  const clampedQty = Math.max(0, qty)

  if (totalUnits > 0) {
    const tot = dimTotals(d, state)
    const scale = Math.min(clampedQty, totalUnits) / totalUnits
    return {
      bf: tot.bf * scale,
      lf: tot.lf * scale,
      pcs: tot.pcs * scale,
    }
  }

  if (clampedQty <= 0) return { bf: 0, lf: 0, pcs: 0 }

  const piecesPerUnit = state.pieces[d.name] || 0
  const defaultLength = 12
  return {
    bf: cellBF(d, defaultLength, clampedQty, piecesPerUnit),
    lf: clampedQty * defaultLength,
    pcs: clampedQty * piecesPerUnit,
  }
}

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

/** Random-width hardwood stock: bf entered directly, cost = bf/1000 × $/MBF. */
export function hardwoodTotals(state: Pick<TallyState, 'hardwood'>): { bf: number; cost: number } {
  return Object.values(state.hardwood).reduce(
    (acc, entry) => {
      acc.bf += entry.bf
      acc.cost += (entry.bf / 1000) * entry.price
      return acc
    },
    { bf: 0, cost: 0 },
  )
}

export function grandTotals(
  state: Pick<TallyState, 'pieces' | 'base' | 'units' | 'override' | 'hardwood'>,
): GrandTotals {
  const totals = DIMENSION_DEFS.reduce(
    (acc, d) => {
      const t = dimTotals(d, state)
      acc.bf += t.bf
      acc.pcs += t.pcs
      acc.cost += t.cost
      return acc
    },
    { bf: 0, pcs: 0, cost: 0 },
  )
  const hw = hardwoodTotals(state)
  totals.bf += hw.bf
  totals.cost += hw.cost
  return totals
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
    const qty = truckMemberQty(truck, state, name)
    const alloc = dimAllocationTotals(d, state, qty)
    bf += alloc.bf
    lf += alloc.lf
    pcs += alloc.pcs
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
  // Zero hardwood quantities but keep prices, mirroring how base $/MBF survives.
  const hardwood = Object.fromEntries(
    Object.entries(state.hardwood).map(([id, entry]) => [id, { ...entry, bf: 0 }]),
  ) as TallyState['hardwood']
  return { ...state, units, override, hardwood }
}

export function addTruck(state: TallyState, name = 'New truck', target = 12000): TallyState {
  const id = state.nextTruckId
  return {
    ...state,
    nextTruckId: id + 1,
    trucks: [...state.trucks, { id, name, target, members: [], memberQty: {} }],
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
      if (has) {
        const memberQty = { ...t.memberQty }
        delete memberQty[dimId]
        return {
          ...t,
          members: t.members.filter((m) => m !== dimId),
          memberQty,
        }
      }
      const defaultQty = dimTotalUnits(state, dimId) || 1
      return {
        ...t,
        members: [...t.members, dimId],
        memberQty: { ...t.memberQty, [dimId]: t.memberQty?.[dimId] ?? defaultQty },
      }
    }),
  }
}

export function setTruckMemberQty(
  state: TallyState,
  truckId: number,
  dimId: DimId,
  qty: number,
): TallyState {
  return {
    ...state,
    trucks: state.trucks.map((t) => {
      if (t.id !== truckId) return t
      return {
        ...t,
        memberQty: { ...t.memberQty, [dimId]: Math.max(0, qty) },
      }
    }),
  }
}
