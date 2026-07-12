export type DimId = '2x4' | '2x6' | '2x8' | '2x10' | '2x12'

/** Hardwood thickness in quarters: 4/4 = 1″ … 8/4 = 2″. */
export type HwId = '4/4' | '5/4' | '6/4' | '8/4'

/** Random-width hardwood stock is tallied directly in board feet. */
export type HardwoodEntry = {
  bf: number
  /** Selling price $/MBF */
  price: number
  marketPrice?: number | null
  acquisitionCost?: number | null
  sellingPrice?: number | null
  lotOrBundle?: string
  species?: string
  grade?: string
}

export type DimensionDef = {
  name: DimId
  label: string
  t: number
  w: number
  pieces: number
  accent: string
}

export type TruckAllocation = {
  sourceLineId: string
  allocatedUnits?: number
  allocatedPieces?: number
  allocatedBf?: number
  needsCorrection?: boolean
}

export type TruckGroup = {
  id: number
  name: string
  target: number
  members: DimId[]
  /** @deprecated Dimension-level qty — use allocations for exact line refs. */
  memberQty: Partial<Record<DimId, number>>
  allocations: TruckAllocation[]
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
  sellingValue: number
  avg: number
}

export type GrandTotals = {
  bf: number
  pcs: number
  cost: number
  sellingValue: number
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
  freight?: number
  tally?: TallyState
  isDemo?: boolean
  schemaVersion?: number
  createdAt?: string
  updatedAt?: string
  lastSavedAt?: string
  activeLoadId?: string
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

export type PriceTriple = {
  marketPrice: number | null
  acquisitionCost: number | null
  sellingPrice: number | null
}

export type PriceBookStore = Record<string, PriceTriple>

export type QuoteLine = {
  species: string
  grade: string
  t: number
  w: number
  lenFt: number
  pcs: number
  mbf: number
  lineId?: string
  bf?: number
  dims?: string
}
