import { describe, expect, it } from 'vitest'
import { createInitialTallyState } from './constants'
import { DEFAULT_QUOTE_LINES } from './priceData'
import { tallyToQuoteLines } from './quoteFromTally'

describe('quoteFromTally', () => {
  it('builds line items from non-zero tally units', () => {
    const state = createInitialTallyState()
    const lines = tallyToQuoteLines(state, 'Doug Fir')
    expect(lines.length).toBeGreaterThan(0)
    expect(lines[0].species).toBe('Doug Fir')
    expect(lines[0].pcs).toBeGreaterThan(0)
  })

  it('derives the grade from the species catalog', () => {
    const state = createInitialTallyState()
    expect(tallyToQuoteLines(state, 'Doug Fir')[0].grade).toBe('#2 & Btr')
    expect(tallyToQuoteLines(state, 'SPF #2')[0].grade).toBe('Kiln-dried')
    expect(tallyToQuoteLines(state, 'Hem-Fir')[0].grade).toBe('#2 & Btr')
  })

  it('falls back to default lines for hardwoods the 2x worksheet cannot represent', () => {
    const state = createInitialTallyState()
    expect(tallyToQuoteLines(state, 'White Oak')).toBe(DEFAULT_QUOTE_LINES)
    expect(tallyToQuoteLines(state, 'Ipe')).toBe(DEFAULT_QUOTE_LINES)
  })
})
