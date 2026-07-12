import type { DimId, HwId } from '../types'

export const SCHEMA_VERSION = 2 as const

export type MaterialType = 'dimensional' | 'hardwood'

export type PriceTriple = {
  marketPrice: number | null
  acquisitionCost: number | null
  sellingPrice: number | null
  useMarketAsEstimatedCost?: boolean
}

export type DimensionalLineItem = {
  id: string
  materialType: 'dimensional'
  species: string
  grade: string
  dimension: DimId
  thickness: number
  width: number
  lengthFt: number
  units: number
  piecesPerUnit: number
  notes?: string
} & PriceTriple

export type HardwoodLineItem = {
  id: string
  materialType: 'hardwood'
  species: string
  grade: string
  thickness: HwId
  lotOrBundle?: string
  directBf: number
  notes?: string
} & PriceTriple

export type LineItem = DimensionalLineItem | HardwoodLineItem

export type TruckAllocation = {
  sourceLineId: string
  allocatedUnits?: number
  allocatedPieces?: number
  allocatedBf?: number
  needsCorrection?: boolean
}

export type Truck = {
  id: number
  name: string
  targetBf: number
  allocations: TruckAllocation[]
}

export type LoadStatus = 'Draft' | 'Quoted'

export type Load = {
  id: string
  schemaVersion: typeof SCHEMA_VERSION
  name: string
  sub: string
  species: string
  status: LoadStatus
  contact?: string
  role?: string
  email?: string
  freight: number
  lines: LineItem[]
  trucks: Truck[]
  nextTruckId: number
  isDemo?: boolean
  createdAt: string
  updatedAt: string
  lastSavedAt?: string
  /** Legacy tally snapshot for migration; removed after v2 migration. */
  tally?: unknown
}

export type PriceBookEntry = {
  id: string
  speciesKey: string
  species: string
  grade: string
  dimensionOrThickness: string
  marketPrice: number | null
  acquisitionCost: number | null
  sellingPrice: number | null
  effectiveDate: string
  supplier?: string
  source: 'manual' | 'import' | 'catalog'
  notes?: string
}

export type QuoteLineSnapshot = {
  lineId: string
  species: string
  grade: string
  dims: string
  pcs: number
  bf: number
  sellingPricePerMbf: number
  extendedSelling: number
}

export type QuoteStatus = 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Declined' | 'Expired'

export type QuoteRevision = {
  id: string
  loadId: string
  revisionNumber: number
  quoteNumber: string
  status: QuoteStatus
  customerName: string
  customerEmail?: string
  contact?: string
  role?: string
  sub: string
  species: string
  lines: QuoteLineSnapshot[]
  subtotal: number
  freight: number
  tax: number
  total: number
  totalBf: number
  totalPcs: number
  message: string
  validUntil: string
  issuedAt: string
  companySnapshot: CompanySettings
  deliveryMethod?: 'email' | 'share_link' | 'pdf'
  deliveryResult?: 'success' | 'failure'
  shareLinkToken?: string
  shareLinkRevoked?: boolean
  pdfRef?: string
  createdAt: string
}

export type CompanySettings = {
  schemaVersion: typeof SCHEMA_VERSION
  appName: string
  companyLegalName: string
  displayName?: string
  address: string
  phone: string
  replyToEmail: string
  shippingOrigin: string
  salespersonName: string
  logoUrl?: string
  quotePrefix: string
  quoteNumberFormat: string
  defaultValidityDays: number
  defaultFreight: number
  defaultTaxRate: number
  defaultTaxDestination: string
  paymentTerms: string
  shippingTerms: string
  paymentInstructions?: string
  defaultCustomerMessage?: string
  quoteFooter?: string
  currency: string
  emailSignature?: string
}

export type SyncOutboxEntry = {
  id: string
  recordType: 'load' | 'priceBook' | 'settings' | 'quoteRevision'
  recordId: string
  operation: 'create' | 'update' | 'delete'
  payload: unknown
  timestamp: string
  syncStatus: 'pending' | 'synced' | 'failed'
}
