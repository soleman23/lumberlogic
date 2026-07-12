import { DIMENSION_DEFS, HARDWOOD_DEFS, LENGTHS, cellKey, createEmptyTallyState } from '../../lib/constants'
import type { DimId, HwId, SavedLoad, TallyState } from '../../types'
import {
  dimensionalBoardFeet,
  dimensionalLinealFeet,
  dimensionalTotalPieces,
  lineBoardFeet,
  lineSellingValue,
} from '../pricing'
import type {
  DimensionalLineItem,
  HardwoodLineItem,
  LineItem,
  Load,
  Truck,
  TruckAllocation,
} from '../types'
import { SCHEMA_VERSION } from '../types'

function newLineId(): string {
  return crypto.randomUUID()
}

export function dimensionalCellToLine(
  state: TallyState,
  dimId: DimId,
  lengthFt: number,
  species: string,
  grade: string,
  existingId?: string,
): DimensionalLineItem | null {
  const def = DIMENSION_DEFS.find((d) => d.name === dimId)
  if (!def) return null
  const units = state.units[cellKey(dimId, lengthFt)] || 0
  if (units <= 0) return null
  const overrideKey = cellKey(dimId, lengthFt)
  const override = state.override[overrideKey]
  const sellingPrice = override != null ? override : state.base[dimId] || 0
  return {
    id: existingId ?? newLineId(),
    materialType: 'dimensional',
    species,
    grade,
    dimension: dimId,
    thickness: def.t,
    width: def.w,
    lengthFt,
    units,
    piecesPerUnit: state.pieces[dimId] || 0,
    marketPrice: null,
    acquisitionCost: null,
    sellingPrice: sellingPrice > 0 ? sellingPrice : null,
  }
}

export function hardwoodEntryToLine(
  hwId: HwId,
  entry: { bf: number; price: number; acquisitionCost?: number | null; marketPrice?: number | null },
  species: string,
  grade: string,
  existingId?: string,
): HardwoodLineItem | null {
  if (entry.bf <= 0) return null
  return {
    id: existingId ?? newLineId(),
    materialType: 'hardwood',
    species,
    grade,
    thickness: hwId,
    directBf: entry.bf,
    marketPrice: entry.marketPrice ?? null,
    acquisitionCost: entry.acquisitionCost ?? null,
    sellingPrice: entry.price > 0 ? entry.price : null,
  }
}

/** Convert legacy TallyState grid into unified line items. */
export function tallyToLines(state: TallyState, species: string, grade: string): LineItem[] {
  const lines: LineItem[] = []
  DIMENSION_DEFS.forEach((d) => {
    LENGTHS.forEach((L) => {
      const line = dimensionalCellToLine(state, d.name, L, species, grade)
      if (line) lines.push(line)
    })
  })
  HARDWOOD_DEFS.forEach((h) => {
    const entry = state.hardwood[h.id]
    if (!entry) return
    const line = hardwoodEntryToLine(h.id, entry, species, grade)
    if (line) lines.push(line)
  })
  return lines
}

/** Rebuild TallyState from unified lines (for UI compatibility during transition). */
export function linesToTally(lines: LineItem[], existing?: TallyState): TallyState {
  const state = existing ? structuredClone(existing) : createEmptyTallyState()
  // Zero all units and hardwood bf first
  Object.keys(state.units).forEach((k) => { state.units[k] = 0 })
  Object.keys(state.override).forEach((k) => { state.override[k] = null })
  HARDWOOD_DEFS.forEach((h) => {
    state.hardwood[h.id] = { ...state.hardwood[h.id], bf: 0 }
  })

  for (const line of lines) {
    if (line.materialType === 'dimensional') {
      const key = cellKey(line.dimension, line.lengthFt)
      state.units[key] = line.units
      state.pieces[line.dimension] = line.piecesPerUnit
      if (line.sellingPrice != null) {
        state.override[key] = line.sellingPrice
      }
      if (line.acquisitionCost != null) {
        state.base[line.dimension] = line.acquisitionCost
      }
    } else {
      state.hardwood[line.thickness] = {
        bf: line.directBf,
        price: line.sellingPrice ?? 0,
        acquisitionCost: line.acquisitionCost ?? undefined,
        marketPrice: line.marketPrice ?? undefined,
      } as TallyState['hardwood'][HwId] & { acquisitionCost?: number; marketPrice?: number }
    }
  }
  return state
}

export function tallyToLoad(
  tally: TallyState,
  meta: Pick<
    Load,
    'id' | 'name' | 'sub' | 'species' | 'status' | 'contact' | 'role' | 'email' | 'freight' | 'isDemo' | 'createdAt' | 'updatedAt'
  > & { grade?: string },
): Load {
  const grade = meta.grade ?? '#2 & Btr'
  const lines = tallyToLines(tally, meta.species, grade)
  const trucks: Truck[] = tally.trucks.map((t) => ({
    id: t.id,
    name: t.name,
    targetBf: t.target,
    allocations: migrateTruckAllocations(t, lines, tally),
  }))
  return {
    schemaVersion: SCHEMA_VERSION,
    id: meta.id,
    name: meta.name,
    sub: meta.sub,
    species: meta.species,
    status: meta.status,
    contact: meta.contact,
    role: meta.role,
    email: meta.email,
    freight: meta.freight,
    lines,
    trucks,
    nextTruckId: tally.nextTruckId,
    isDemo: meta.isDemo,
    createdAt: meta.createdAt,
    updatedAt: meta.updatedAt,
    tally,
  }
}

/** Migrate dimension-level truck members to line-level allocations. */
function migrateTruckAllocations(
  truck: TallyState['trucks'][0],
  lines: LineItem[],
  _state: TallyState,
): TruckAllocation[] {
  const allocations: TruckAllocation[] = []
  for (const dimId of truck.members) {
    const qty = truck.memberQty?.[dimId] ?? 0
    if (qty <= 0) continue
    const dimLines = lines.filter(
      (l): l is DimensionalLineItem => l.materialType === 'dimensional' && l.dimension === dimId,
    )
    if (dimLines.length === 0) continue
    // Distribute units proportionally across lengths for migration
    const totalUnits = dimLines.reduce((s, l) => s + l.units, 0)
    let remaining = qty
    dimLines.forEach((line, i) => {
      const share = i === dimLines.length - 1
        ? remaining
        : totalUnits > 0
          ? Math.round((line.units / totalUnits) * qty)
          : 0
      remaining -= share
      if (share > 0) {
        allocations.push({ sourceLineId: line.id, allocatedUnits: share })
      }
    })
  }
  return allocations
}

export function loadToTally(load: Load): TallyState {
  if (load.tally) return load.tally as TallyState
  return linesToTally(load.lines)
}

export function savedLoadToDomain(saved: SavedLoad): Load {
  const tally = saved.tally
  if (!tally) {
    return {
      schemaVersion: SCHEMA_VERSION,
      id: saved.id,
      name: saved.name,
      sub: saved.sub,
      species: saved.species,
      status: saved.status,
      contact: saved.contact,
      role: saved.role,
      email: saved.email,
      freight: saved.freight ?? 0,
      lines: [],
      trucks: [],
      nextTruckId: 1,
      isDemo: saved.isDemo,
      createdAt: saved.createdAt ?? saved.date,
      updatedAt: saved.updatedAt ?? saved.date,
      lastSavedAt: saved.lastSavedAt,
    }
  }
  return tallyToLoad(tally, {
    id: saved.id,
    name: saved.name,
    sub: saved.sub,
    species: saved.species,
    status: saved.status,
    contact: saved.contact,
    role: saved.role,
    email: saved.email,
    freight: saved.freight ?? 0,
    isDemo: saved.isDemo,
    createdAt: saved.createdAt ?? saved.date,
    updatedAt: saved.updatedAt ?? saved.date,
  })
}

export function domainToSavedLoad(load: Load): SavedLoad {
  const tally = loadToTally(load)
  const totals = load.lines.reduce(
    (acc, line) => {
      acc.bf += lineBoardFeet(line)
      acc.value += lineSellingValue(line)
      if (line.materialType === 'dimensional') {
        acc.pcs += dimensionalTotalPieces(line)
      }
      return acc
    },
    { bf: 0, value: 0, pcs: 0 },
  )
  return {
    id: load.id,
    name: load.name,
    sub: load.sub,
    species: load.species,
    status: load.status,
    bf: Math.round(totals.bf),
    value: Math.round(totals.value),
    pieces: Math.round(totals.pcs),
    date: load.updatedAt.slice(0, 10),
    contact: load.contact,
    role: load.role,
    email: load.email,
    freight: load.freight,
    tally,
    isDemo: load.isDemo,
    createdAt: load.createdAt,
    updatedAt: load.updatedAt,
    lastSavedAt: load.lastSavedAt,
    schemaVersion: SCHEMA_VERSION,
    activeLoadId: load.id,
  }
}

export { dimensionalBoardFeet, dimensionalLinealFeet, dimensionalTotalPieces, lineBoardFeet }
