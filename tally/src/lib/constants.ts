import type { DimId, DimensionDef, HardwoodEntry, HwId, TallyState } from '../types'

export const LENGTHS = [8, 10, 12, 14, 16, 18, 20] as const

export const DIMENSION_DEFS: DimensionDef[] = [
  { name: '2x4', label: '2×4', t: 2, w: 4, pieces: 208, accent: '#7BA23F' },
  { name: '2x6', label: '2×6', t: 2, w: 6, pieces: 128, accent: '#7BA23F' },
  { name: '2x8', label: '2×8', t: 2, w: 8, pieces: 147, accent: '#E2A615' },
  { name: '2x10', label: '2×10', t: 2, w: 10, pieces: 105, accent: '#E2A615' },
  { name: '2x12', label: '2×12', t: 2, w: 12, pieces: 84, accent: '#C77A2B' },
]

export type HardwoodDef = { id: HwId; label: string; inches: string; accent: string }

export const HARDWOOD_DEFS: HardwoodDef[] = [
  { id: '4/4', label: '4/4', inches: '1″', accent: '#8A6D3B' },
  { id: '5/4', label: '5/4', inches: '1¼″', accent: '#B79A5B' },
  { id: '6/4', label: '6/4', inches: '1½″', accent: '#6E4A2A' },
  { id: '8/4', label: '8/4', inches: '2″', accent: '#5A4326' },
]

export const SEED_UNITS: Record<string, number> = {
  '2x4|8': 1,
  '2x4|12': 1,
  '2x6|10': 1,
  '2x6|16': 1,
  '2x8|10': 1,
  '2x8|14': 1,
}

export const SEED_BASE: Record<DimId, number> = {
  '2x4': 485,
  '2x6': 467,
  '2x8': 545,
  '2x10': 500,
  '2x12': 520,
}

export function cellKey(name: DimId, length: number): string {
  return `${name}|${length}`
}

export function createInitialHardwoodState(): Record<HwId, HardwoodEntry> {
  const hardwood = {} as Record<HwId, HardwoodEntry>
  HARDWOOD_DEFS.forEach((h) => {
    hardwood[h.id] = { bf: 0, price: 0 }
  })
  return hardwood
}

export function createInitialTallyState(): TallyState {
  const pieces = {} as Record<DimId, number>
  const base = {} as Record<DimId, number>
  const units: Record<string, number> = {}
  const override: Record<string, number | null> = {}

  DIMENSION_DEFS.forEach((d) => {
    pieces[d.name] = d.pieces
    base[d.name] = SEED_BASE[d.name] || 0
    LENGTHS.forEach((L) => {
      const k = cellKey(d.name, L)
      units[k] = SEED_UNITS[k] || 0
      override[k] = null
    })
  })

  return {
    pieces,
    base,
    units,
    override,
    hardwood: createInitialHardwoodState(),
    nextTruckId: 4,
    trucks: [
      { id: 1, name: '4" & 6"', target: 8000, members: ['2x4', '2x6'], memberQty: {} },
      { id: 2, name: '4" – 10"', target: 12000, members: ['2x4', '2x6', '2x8', '2x10'], memberQty: {} },
      { id: 3, name: '8" – 12"', target: 8000, members: ['2x8', '2x10', '2x12'], memberQty: {} },
    ],
  }
}

/**
 * Fill fields added after a state was persisted (memberQty, hardwood).
 * Single migration point for anything loaded from localStorage.
 */
export function normalizeTallyState(loaded: TallyState): TallyState {
  return {
    ...loaded,
    hardwood: loaded.hardwood ?? createInitialHardwoodState(),
    trucks: loaded.trucks.map((t) => ({ ...t, memberQty: t.memberQty ?? {} })),
  }
}
