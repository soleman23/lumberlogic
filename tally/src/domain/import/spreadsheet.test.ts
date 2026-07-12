import { describe, expect, it } from 'vitest'
import { parseCsv, validateAndMapRows, autoMapColumns, applyImportToPriceBook } from './spreadsheet'
import { buildEmptyPriceBook } from '../../lib/applyPrices'

describe('spreadsheet import', () => {
  const csv = `species,grade,dimension,market price,acquisition cost,selling price,effective date
Doug Fir,#2 & Btr,2×4,478,450,540,2026-07-01
Bad Species,FAS,4/4,100,90,110,2026-07-01`

  it('parses CSV rows', () => {
    const rows = parseCsv(csv)
    expect(rows).toHaveLength(2)
  })

  it('auto-maps columns', () => {
    const rows = parseCsv(csv)
    const headers = Object.keys(rows[0])
    const mapping = autoMapColumns(headers)
    expect(mapping.species).toBeDefined()
    expect(mapping.sellingPrice).toBeDefined()
  })

  it('accepts valid rows and rejects unknown species', () => {
    const rows = parseCsv(csv)
    const mapping = autoMapColumns(Object.keys(rows[0]))
    const preview = validateAndMapRows(rows, mapping)
    expect(preview.accepted).toHaveLength(1)
    expect(preview.rejected).toHaveLength(1)
    expect(preview.rejected[0].errors[0]).toContain('Unknown species')
  })

  it('applies accepted entries transactionally to price book', () => {
    const rows = parseCsv(csv)
    const mapping = autoMapColumns(Object.keys(rows[0]))
    const preview = validateAndMapRows(rows, mapping)
    const book = applyImportToPriceBook(buildEmptyPriceBook(), preview.accepted)
    expect(book['df|2×4']?.sellingPrice).toBe(540)
  })
})
