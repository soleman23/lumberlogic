import { describe, expect, it } from 'vitest'
import { defaultFreightFor, defaultQuoteMessage, defaultValidUntil, nextQuoteNumber } from './quoteDefaults'
import type { SavedLoad } from '../types'

const sampleLoad: SavedLoad = {
  id: 'abc-123',
  name: 'Cascade Millworks',
  sub: 'PO 2231',
  species: 'Doug Fir',
  status: 'Draft',
  bf: 1000,
  value: 5000,
  pieces: 100,
  date: '2026-06-28',
}

describe('quoteDefaults', () => {
  it('defaults freight to 0 when not set on load', () => {
    expect(defaultFreightFor(sampleLoad)).toBe(0)
  })

  it('uses saved freight when present', () => {
    expect(defaultFreightFor({ ...sampleLoad, freight: 250 })).toBe(250)
  })

  it('generates collision-resistant quote numbers', () => {
    const a = nextQuoteNumber('CB', 2026)
    const b = nextQuoteNumber('CB', 2026)
    expect(a).toMatch(/^CB-2026-\d{4}$/)
    expect(b).not.toBe(a)
  })

  it('defaultValidUntil is 14 days ahead', () => {
    const from = new Date('2026-06-01')
    expect(defaultValidUntil(from, 14)).toBe('2026-06-15')
  })

  it('references the load ref and species without demo names', () => {
    const msg = defaultQuoteMessage(sampleLoad, 'Bend yard')
    expect(msg).toContain('PO 2231')
    expect(msg).toContain('Doug Fir')
    expect(msg).not.toContain('Casey')
  })
})
