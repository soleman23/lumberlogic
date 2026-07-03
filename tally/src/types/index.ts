export type DimId = '2x4' | '2x6' | '2x8' | '2x10' | '2x12'

export type DimensionDef = {
  name: DimId
  label: string
  t: number
  w: number
  pieces: number
  accent: string
}

export type TruckGroup = {
  id: number
  name: string
  target: number
  members: DimId[]
  /** Units allocated to this truck per dimension (defaults to full worksheet units). */
  memberQty: Partial<Record<DimId, number>>
}

export type TallyState = {
  pieces: Record<DimId, number>
  base: Record<DimId, number>
  units: Record<string, number>
  override: Record<string, number | null>
  trucks: TruckGroup[]
  nextTruckId: number
}

export type DimTotals = {
  bf: number
  lf: number
  pcs: number
  cost: number
  avg: number
}

export type GrandTotals = {
  bf: number
  pcs: number
  cost: number
}

export type TruckProgress = {
  bf: number
  lf: number
  pcs: number
  pct: number
  over: boolean
  barColor: string
  remainLabel: string
}

export type LoadStatus = 'Quoted' | 'Draft'

export type SavedLoad = {
  id: string
  name: string
  sub: string
  species: string
  status: LoadStatus
  bf: number
  value: number
  pieces: number
  date: string
  contact?: string
  role?: string
  email?: string
  tally?: TallyState
}

export type PriceGroup = 'Softwood' | 'Hardwood'

export type SpeciesDef = {
  key: string
  name: string
  grade: string
  group: PriceGroup
  accent: string
  updated: string
  dims: string[]
  market: number[]
  chg: number[]
  factor: number
}

export type QuoteLine = {
  species: string
  grade: string
  t: number
  w: number
  lenFt: number
  pcs: number
  mbf: number
}
