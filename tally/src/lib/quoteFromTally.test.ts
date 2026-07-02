import { describe, expect, it } from 'vitest'
import { createInitialTallyState } from './constants'
import { tallyToQuoteLines } from './quoteFromTally'

describe('quoteFromTally', () => {
  it('builds line items from non-zero tally units', () => {
    const state = createInitialTallyState()
    const lines = tallyToQuoteLines(state, 'Doug Fir')
    expect(lines.length).toBeGreaterThan(0)
    expect(lines[0].species).toBe('Doug Fir')
    expect(lines[0].pcs).toBeGreaterThan(0)
  })
})
