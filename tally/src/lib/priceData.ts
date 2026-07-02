import type { SpeciesDef } from '../types'

const D5 = ['2×4', '2×6', '2×8', '2×10', '2×12']
const D4 = ['4/4', '5/4', '6/4', '8/4']

export const SPECIES_CATALOG: SpeciesDef[] = [
  { key: 'df', name: 'Doug Fir', grade: '#2 & Btr', group: 'Softwood', accent: '#7BA23F', updated: '2026-06-28', dims: D5, market: [478, 495, 528, 552, 580], chg: [5, -3, 2, 0, 4], factor: 1.12 },
  { key: 'spf', name: 'SPF #2', grade: 'Kiln-dried', group: 'Softwood', accent: '#7BA23F', updated: '2026-06-29', dims: D5, market: [452, 468, 502, 528, 556], chg: [-4, -2, 3, 0, -5], factor: 1.13 },
  { key: 'hf', name: 'Hem-Fir', grade: '#2 & Btr', group: 'Softwood', accent: '#7BA23F', updated: '2026-06-27', dims: D5, market: [470, 486, 515, 540, 566], chg: [2, 0, -3, 4, 1], factor: 1.14 },
  { key: 'pp', name: 'Ponderosa Pine', grade: '#3 Com', group: 'Softwood', accent: '#E2A615', updated: '2026-06-26', dims: D5, market: [498, 512, 545, 570, 598], chg: [8, 6, -2, 3, 7], factor: 1.16 },
  { key: 'wrc', name: 'W. Red Cedar', grade: 'Clear', group: 'Softwood', accent: '#C77A2B', updated: '2026-06-25', dims: D5, market: [1180, 1240, 1360, 1480, 1620], chg: [-15, 10, 22, -8, 14], factor: 1.12 },
  { key: 'wo', name: 'White Oak', grade: 'FAS', group: 'Hardwood', accent: '#8A6D3B', updated: '2026-06-28', dims: D4, market: [2650, 2820, 3050, 3380], chg: [35, -20, 40, 55], factor: 1.18 },
  { key: 'hm', name: 'Hard Maple', grade: 'Sel & Btr', group: 'Hardwood', accent: '#B79A5B', updated: '2026-06-27', dims: D4, market: [2380, 2520, 2740, 3010], chg: [-30, 15, 0, 25], factor: 1.15 },
  { key: 'wal', name: 'Black Walnut', grade: 'FAS', group: 'Hardwood', accent: '#5A4326', updated: '2026-06-29', dims: D4, market: [5800, 6200, 6850, 7600], chg: [120, -60, 90, 140], factor: 1.17 },
  { key: 'ipe', name: 'Ipe', grade: 'Clear FEQ', group: 'Hardwood', accent: '#6E4A2A', updated: '2026-06-30', dims: D4, market: [3900, 4150, 4480, 4920], chg: [-45, 30, 60, -25], factor: 1.14 },
]

export function buildInitialPrices(): Record<string, number> {
  const prices: Record<string, number> = {}
  SPECIES_CATALOG.forEach((sp) => {
    sp.dims.forEach((d, i) => {
      const k = `${sp.key}|${d}`
      prices[k] = Math.round((sp.market[i] * sp.factor) / 5) * 5
    })
  })
  return prices
}

export function priceKey(speciesKey: string, dim: string): string {
  return `${speciesKey}|${dim}`
}

export function getMarketPrice(speciesKey: string, dim: string): number {
  const sp = SPECIES_CATALOG.find((s) => s.key === speciesKey)
  if (!sp) return 0
  const i = sp.dims.indexOf(dim)
  return i >= 0 ? sp.market[i] : 0
}

export function getWeeklyChange(speciesKey: string, dim: string): number {
  const sp = SPECIES_CATALOG.find((s) => s.key === speciesKey)
  if (!sp) return 0
  const i = sp.dims.indexOf(dim)
  return i >= 0 ? sp.chg[i] : 0
}

export function dimToBaseMbf(dimLabel: string): number | null {
  const map: Record<string, number> = {
    '2×4': 485,
    '2×6': 467,
    '2×8': 545,
    '2×10': 500,
    '2×12': 520,
  }
  return map[dimLabel] ?? null
}

export const SEED_LOADS = [
  { name: 'Hardwood Co.', sub: 'Lot 84', species: 'White Oak', status: 'Quoted' as const, bf: 1284, value: 2616, pieces: 642, date: '2026-06-24' },
  { name: 'Cascade Millworks', sub: 'PO 2231', species: 'Doug Fir #1', status: 'Draft' as const, bf: 8420, value: 4092, pieces: 388, date: '2026-06-28' },
  { name: 'Riverside Pallet', sub: 'Truck A', species: 'SPF #2', status: 'Quoted' as const, bf: 12680, value: 5704, pieces: 1040, date: '2026-06-22' },
  { name: 'Tahoe Custom Homes', sub: 'Job 31', species: 'W. Red Cedar', status: 'Draft' as const, bf: 3260, value: 5870, pieces: 210, date: '2026-06-27' },
  { name: 'Apex Framing LLC', sub: 'Job 19', species: 'SPF #2', status: 'Quoted' as const, bf: 9840, value: 4625, pieces: 812, date: '2026-06-19' },
  { name: 'Northgate Lumber', sub: 'Restock', species: 'Hem-Fir', status: 'Quoted' as const, bf: 15240, value: 6553, pieces: 1188, date: '2026-06-15' },
  { name: 'Meadow Fence Supply', sub: 'Std run', species: 'PT Pine', status: 'Draft' as const, bf: 2180, value: 1635, pieces: 540, date: '2026-06-29' },
  { name: 'Sierra Pacific', sub: 'Lot 12', species: 'Ponderosa Pine', status: 'Quoted' as const, bf: 6720, value: 3091, pieces: 446, date: '2026-06-11' },
  { name: 'Bayview Decking', sub: 'PO 88', species: 'Ipe', status: 'Draft' as const, bf: 980, value: 4312, pieces: 84, date: '2026-06-30' },
  { name: 'Granite Builders', sub: 'PO 4407', species: 'Doug Fir #2', status: 'Quoted' as const, bf: 11050, value: 5083, pieces: 690, date: '2026-06-17' },
]

export const DEFAULT_QUOTE_LINES = [
  { species: 'Doug Fir', grade: '#1 & Btr S4S', t: 2, w: 6, lenFt: 16, pcs: 264, mbf: 685 },
  { species: 'Doug Fir', grade: '#2 KD S4S', t: 2, w: 4, lenFt: 12, pcs: 320, mbf: 560 },
  { species: 'SPF', grade: '#2 & Btr', t: 2, w: 10, lenFt: 16, pcs: 120, mbf: 640 },
  { species: 'W. Red Cedar', grade: 'Clear decking S1S2E', t: 1, w: 6, lenFt: 8, pcs: 400, mbf: 1180 },
  { species: 'Hem-Fir', grade: '#1 posts S4S', t: 4, w: 4, lenFt: 10, pcs: 90, mbf: 720 },
]
