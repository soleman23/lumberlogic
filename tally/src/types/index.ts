export type DimId = '2x4' | '2x6' | '2x8' | '2x10' | '2x12'

/** Hardwood thickness in quarters: 4/4 = 1″ … 8/4 = 2″. */
export type HwId = '4/4' | '5/4' | '6/4' | '8/4'

/** Random-width hardwood stock is tallied directly in board feet. */
export type HardwoodEntry = { bf: number; price: number }

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
  hardwood: Record<HwId, HardwoodEntry>
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
  /** Freight charged on the quote; defaults to app standard when omitted. */
  freight?: number
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
  /** Direct board feet for lines the t×w×len math can't derive (random-width hardwood). */
  bf?: number
  /** Display label overriding the computed t″×w″×len′ dims. */
  dims?: string
}
