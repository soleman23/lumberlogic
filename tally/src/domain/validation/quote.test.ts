import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '../settings'
import { canSendQuote, validateQuoteInput } from './quote'
import type { Load } from '../types'
import { SCHEMA_VERSION } from '../types'

const emptyLoad: Load = {
  schemaVersion: SCHEMA_VERSION,
  id: '1',
  name: '',
  sub: 'PO',
  species: 'Doug Fir',
  status: 'Draft',
  freight: 0,
  lines: [],
  trucks: [],
  nextTruckId: 1,
  createdAt: '',
  updatedAt: '',
}

describe('quote validation', () => {
  it('blocks empty quotes', () => {
    const issues = validateQuoteInput({
      load: emptyLoad,
      settings: DEFAULT_SETTINGS,
      validUntil: '2026-07-20',
      issuedAt: '2026-07-01',
    })
    expect(canSendQuote(issues)).toBe(false)
    expect(issues.some((i) => i.code === 'no_lines')).toBe(true)
  })

  it('blocks when company setup incomplete', () => {
    const issues = validateQuoteInput({
      load: { ...emptyLoad, name: 'Acme' },
      settings: DEFAULT_SETTINGS,
      validUntil: '2026-07-20',
      issuedAt: '2026-07-01',
    })
    expect(issues.some((i) => i.code === 'company_incomplete')).toBe(true)
  })
})
