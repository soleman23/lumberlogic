import { describe, expect, it } from 'vitest'
import { defaultFreightFor, defaultQuoteMessage, defaultValidUntil, quoteNumberFor, DEFAULT_FREIGHT } from './quoteDefaults'
import type { SavedLoad } from '../types'

const load: SavedLoad = {
  id: 'a3f2c9d1-0000-0000-0000-000000000000',
  name: 'Cascade Millworks',
  sub: 'PO 2231',
  species: 'Doug Fir #1',
  status: 'Draft',
  bf: 8420,
  value: 4092,
  pieces: 388,
  date: '2026-06-28',
}

describe('quoteNumberFor', () => {
  it('is deterministic and derived from the load date and id', () => {
    expect(quoteNumberFor(load)).toBe('Q-2026-A3F2')
    expect(quoteNumberFor(load)).toBe(quoteNumberFor(load))
  })

  it('pads short seed ids', () => {
    expect(quoteNumberFor({ ...load, id: '7' })).toBe('Q-2026-0007')
  })
})

describe('defaultValidUntil', () => {
  it('returns an ISO date 14 days after the given date', () => {
    expect(defaultValidUntil(new Date('2026-07-03T12:00:00Z'))).toBe('2026-07-17')
  })

  it('rolls over month boundaries', () => {
    expect(defaultValidUntil(new Date('2026-06-25T12:00:00Z'))).toBe('2026-07-09')
  })
})

describe('defaultQuoteMessage', () => {
  it('references the load ref and species without demo names', () => {
    const msg = defaultQuoteMessage(load)
    expect(msg).toContain('PO 2231')
    expect(msg).toContain('Doug Fir #1')
    expect(msg).not.toContain('Dana')
  })
})

describe('defaultFreightFor', () => {
  it('returns saved freight when present', () => {
    expect(defaultFreightFor({ ...load, freight: 950 })).toBe(950)
  })

  it('falls back to the app default', () => {
    expect(defaultFreightFor(load)).toBe(DEFAULT_FREIGHT)
  })
})
