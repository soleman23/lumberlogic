import type {
  DimId,
  DimensionDef,
  DimTotals,
  GrandTotals,
  TallyState,
  TruckGroup,
  TruckProgress,
  TruckAllocation,
} from '../types'
import { DIMENSION_DEFS, LENGTHS, cellKey } from './constants'
import { tallyToLines } from '../domain/adapters/tallyAdapter'
import {
  lineAllocationStatuses,
  truckAllocatedBf,
} from '../domain/reconciliation'

export function dimTotalUnits(
  state: Pick<TallyState, 'units'>,
  dimId: DimId,
): number {
  return LENGTHS.reduce((sum, L) => sum + (state.units[cellKey(dimId, L)] || 0), 0)
}

/** Units assigned to one truck for a dimension (defaults to 0 — explicit allocation required). */
export function truckMemberQty(
  truck: TruckGroup,
  _state: Pick<TallyState, 'units'>,
  dimId: DimId,
): number {
  if (!truck.members.includes(dimId)) return 0
  return truck.memberQty?.[dimId] ?? 0
}

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

  if (totalUnits > 0 && clampedQty > 0) {
    let bf = 0
    let lf = 0
    let pcs = 0
    const piecesPerUnit = state.pieces[d.name] || 0
    let remaining = clampedQty

    LENGTHS.forEach((L) => {
      const u = state.units[cellKey(d.name, L)] || 0
      if (u <= 0 || remaining <= 0) return
      const take = Math.min(remaining, u)
      const linePcs = take * piecesPerUnit
      bf += cellBF(d, L, take, piecesPerUnit)
      lf += linePcs * L
      pcs += linePcs
      remaining -= take
    })
    return { bf, lf, pcs }
  }

  if (clampedQty <= 0) return { bf: 0, lf: 0, pcs: 0 }

  const piecesPerUnit = state.pieces[d.name] || 0
  const defaultLength = 12
  const totalPcs = clampedQty * piecesPerUnit
  return {
    bf: cellBF(d, defaultLength, clampedQty, piecesPerUnit),
    lf: totalPcs * defaultLength,
    pcs: totalPcs,
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
  const totalPieces = units * piecesPerUnit
  return (totalPieces * d.t * d.w * length) / 12
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
  let sellingValue = 0
  const piecesPerUnit = state.pieces[d.name] || 0

  LENGTHS.forEach((L) => {
    const u = state.units[cellKey(d.name, L)] || 0
    const cbf = cellBF(d, L, u, piecesPerUnit)
    const linePcs = u * piecesPerUnit
    bf += cbf
    lf += linePcs * L
    pcs += linePcs
    const price = effectivePrice(state, d.name, L)
    sellingValue += (cbf * price) / 1000
    cost += (cbf * (state.base[d.name] || 0)) / 1000
  })

  return {
    bf,
    lf,
    pcs,
    cost,
    sellingValue,
    avg: bf > 0 ? (sellingValue / bf) * 1000 : 0,
  }
}

export function hardwoodTotals(state: Pick<TallyState, 'hardwood'>): { bf: number; cost: number; sellingValue: number } {
  return Object.values(state.hardwood).reduce(
    (acc, entry) => {
      acc.bf += entry.bf
      const acq = entry.acquisitionCost ?? entry.price ?? 0
      const selling = entry.sellingPrice ?? entry.price
      acc.sellingValue += (entry.bf / 1000) * selling
      acc.cost += (entry.bf / 1000) * acq
      return acc
    },
    { bf: 0, cost: 0, sellingValue: 0 },
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
      acc.sellingValue += t.sellingValue
      return acc
    },
    { bf: 0, pcs: 0, cost: 0, sellingValue: 0 },
  )
  const hw = hardwoodTotals(state)
  totals.bf += hw.bf
  totals.cost += hw.cost
  totals.sellingValue += hw.sellingValue
  return totals
}

export function truckProgress(
  truck: TruckGroup,
  state: Pick<TallyState, 'pieces' | 'base' | 'units' | 'override' | 'hardwood' | 'trucks' | 'nextTruckId'>,
  species = 'Load',
): TruckProgress {
  let bf = 0
  let lf = 0
  let pcs = 0

  if (truck.allocations && truck.allocations.length > 0) {
    const lines = tallyToLines(state, species, '')
    bf = truckAllocatedBf(
      { id: truck.id, name: truck.name, targetBf: truck.target, allocations: truck.allocations },
      lines,
    )
    for (const alloc of truck.allocations) {
      const line = lines.find((l) => l.id === alloc.sourceLineId)
      if (!line || line.materialType !== 'dimensional') continue
      const units = alloc.allocatedUnits ?? 0
      const linePcs = (units / Math.max(line.units, 1)) * (line.units * line.piecesPerUnit)
      lf += linePcs * line.lengthFt
      pcs += linePcs
    }
  } else {
    truck.members.forEach((name) => {
      const d = DIMENSION_DEFS.find((x) => x.name === name)
      if (!d) return
      const qty = truckMemberQty(truck, state, name)
      const alloc = dimAllocationTotals(d, state, qty)
      bf += alloc.bf
      lf += alloc.lf
      pcs += alloc.pcs
    })
  }

  const target = truck.target || 0
  const pct = target > 0 ? (bf / target) * 100 : 0
  const over = pct > 100
  const barColor = pct >= 92 && pct <= 105 ? '#2F6342' : over ? '#B5482F' : '#BC7A2C'
  const remain = target - bf
  const remainLabel = over
    ? `+${Math.round(-remain).toLocaleString('en-US')} over`
    : `${Math.round(remain).toLocaleString('en-US')} bf left`

  return { bf, lf, pcs, pct, over, barColor, remainLabel }
}

export function lineLevelOverAllocation(
  state: TallyState,
  species: string,
): boolean {
  const lines = tallyToLines(state, species, '')
  const load = {
    schemaVersion: 2 as const,
    id: 'temp',
    name: '',
    sub: '',
    species,
    status: 'Draft' as const,
    freight: 0,
    lines,
    trucks: state.trucks.map((t) => ({
      id: t.id,
      name: t.name,
      targetBf: t.target,
      allocations: t.allocations ?? [],
    })),
    nextTruckId: state.nextTruckId,
    createdAt: '',
    updatedAt: '',
  }
  return lineAllocationStatuses(load).some((s) => s.overallocated > 0)
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
    trucks: [...state.trucks, { id, name, target, members: [], memberQty: {}, allocations: [] }],
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
      return {
        ...t,
        members: [...t.members, dimId],
        memberQty: { ...t.memberQty, [dimId]: t.memberQty?.[dimId] ?? 0 },
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

export function setTruckLineAllocation(
  state: TallyState,
  truckId: number,
  sourceLineId: string,
  qty: number,
  kind: 'units' | 'bf',
): TallyState {
  return {
    ...state,
    trucks: state.trucks.map((t) => {
      if (t.id !== truckId) return t
      const allocations = [...(t.allocations ?? [])]
      const idx = allocations.findIndex((a) => a.sourceLineId === sourceLineId)
      const patch: TruckAllocation = { sourceLineId }
      if (kind === 'bf') patch.allocatedBf = Math.max(0, qty)
      else patch.allocatedUnits = Math.max(0, qty)
      if (idx >= 0) allocations[idx] = patch
      else allocations.push(patch)
      return { ...t, allocations: allocations.filter((a) => (a.allocatedBf ?? a.allocatedUnits ?? 0) > 0) }
    }),
  }
}
