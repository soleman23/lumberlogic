import type { PriceBookEntry } from '../types'
import type { PriceBookStore } from '../../types'
import { SPECIES_CATALOG, priceKey } from '../../lib/priceData'

export type ImportColumn = keyof Pick<
  PriceBookEntry,
  'species' | 'grade' | 'dimensionOrThickness' | 'marketPrice' | 'acquisitionCost' | 'sellingPrice' | 'effectiveDate' | 'supplier' | 'notes'
>

export type ColumnMapping = Partial<Record<ImportColumn, number>>

export type ParsedImportRow = Record<string, string>

export type ImportRowResult = {
  rowIndex: number
  accepted: boolean
  entry?: PriceBookEntry
  errors: string[]
}

export type ImportPreview = {
  rows: ImportRowResult[]
  accepted: PriceBookEntry[]
  rejected: ImportRowResult[]
}

const SUPPORTED_COLUMNS: ImportColumn[] = [
  'species',
  'grade',
  'dimensionOrThickness',
  'marketPrice',
  'acquisitionCost',
  'sellingPrice',
  'effectiveDate',
  'supplier',
  'notes',
]

export function parseCsv(text: string): ParsedImportRow[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((c) => c.trim())
    const row: ParsedImportRow = {}
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? ''
    })
    return row
  })
}

export function autoMapColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {}
  const aliases: Record<ImportColumn, string[]> = {
    species: ['species', 'name'],
    grade: ['grade'],
    dimensionOrThickness: ['dimension', 'thickness', 'dim'],
    sellingPrice: ['selling', 'sellingprice', 'selling price', 'sell'],
    marketPrice: ['market', 'marketprice', 'market price', 'reference'],
    acquisitionCost: ['acquisition', 'acquisitioncost', 'acquisition cost', 'cost'],
    effectiveDate: ['date', 'effectivedate', 'effective'],
    supplier: ['supplier', 'vendor'],
    notes: ['notes', 'comment'],
  }
  headers.forEach((h, i) => {
    const norm = h.trim().toLowerCase()
    for (const col of SUPPORTED_COLUMNS) {
      if (aliases[col].includes(norm)) mapping[col] = i
    }
  })
  return mapping
}

function parseNum(val: string | undefined): number | null {
  if (!val?.trim()) return null
  const n = Number(val.replace(/[$,]/g, ''))
  return Number.isFinite(n) && n >= 0 ? n : null
}

function findSpeciesKey(name: string): string | null {
  const sp = SPECIES_CATALOG.find(
    (s) => s.name.toLowerCase() === name.toLowerCase() || name.toLowerCase().startsWith(s.name.toLowerCase()),
  )
  return sp?.key ?? null
}

export function validateAndMapRows(
  rows: ParsedImportRow[],
  mapping: ColumnMapping,
  source: PriceBookEntry['source'] = 'import',
): ImportPreview {
  const results: ImportRowResult[] = []
  const accepted: PriceBookEntry[] = []

  rows.forEach((row, rowIndex) => {
    const errors: string[] = []
    const get = (col: ImportColumn) => {
      const idx = mapping[col]
      if (idx == null) return ''
      return Object.values(row)[idx] ?? row[col] ?? ''
    }

    const species = get('species')
    const grade = get('grade') || '#2 & Btr'
    const dim = get('dimensionOrThickness')
    const speciesKey = findSpeciesKey(species)

    if (!species) errors.push('Species is required')
    if (!dim) errors.push('Dimension or thickness is required')
    if (!speciesKey) errors.push(`Unknown species: ${species}`)

    const marketPrice = parseNum(get('marketPrice'))
    const acquisitionCost = parseNum(get('acquisitionCost'))
    const sellingPrice = parseNum(get('sellingPrice'))

    if (marketPrice == null && acquisitionCost == null && sellingPrice == null) {
      errors.push('At least one price column is required')
    }

    const entry: PriceBookEntry = {
      id: crypto.randomUUID(),
      speciesKey: speciesKey ?? 'unknown',
      species,
      grade,
      dimensionOrThickness: dim,
      marketPrice,
      acquisitionCost,
      sellingPrice,
      effectiveDate: get('effectiveDate') || new Date().toISOString().slice(0, 10),
      supplier: get('supplier') || undefined,
      source,
      notes: get('notes') || undefined,
    }

    const result: ImportRowResult = { rowIndex, accepted: errors.length === 0, entry, errors }
    results.push(result)
    if (result.accepted && speciesKey) accepted.push(entry)
  })

  return { rows: results, accepted, rejected: results.filter((r) => !r.accepted) }
}

export function applyImportToPriceBook(
  current: PriceBookStore,
  entries: PriceBookEntry[],
): PriceBookStore {
  const next = { ...current }
  for (const entry of entries) {
    const key = priceKey(entry.speciesKey, entry.dimensionOrThickness)
    next[key] = {
      marketPrice: entry.marketPrice,
      acquisitionCost: entry.acquisitionCost,
      sellingPrice: entry.sellingPrice,
    }
  }
  return next
}

export const IMPORT_TEMPLATE_CSV = [
  'species,grade,dimension,market price,acquisition cost,selling price,effective date,supplier,notes',
  'Doug Fir,#2 & Btr,2×4,478,450,540,2026-07-01,Supplier A,',
  'White Oak,FAS,4/4,2650,2400,3100,2026-07-01,Supplier B,Random width',
].join('\n')
