import { describe, expect, it } from 'vitest'
import { createInitialTallyState } from './constants'
import { quoteLinesOrEmpty } from './quoteFromTally'

describe('quoteFromTally', () => {
  it('builds line items from non-zero tally units', () => {
    const state = createInitialTallyState()
    const lines = quoteLinesOrEmpty(state, 'Doug Fir')
    expect(lines.length).toBeGreaterThan(0)
    expect(lines[0].species).toBe('Doug Fir')
    expect(lines[0].pcs).toBeGreaterThan(0)
  })

  it('derives the grade from the species catalog', () => {
    const state = createInitialTallyState()
    expect(quoteLinesOrEmpty(state, 'Doug Fir')[0].grade).toBe('#2 & Btr')
    expect(quoteLinesOrEmpty(state, 'SPF #2')[0].grade).toBe('Kiln-dried')
    expect(quoteLinesOrEmpty(state, 'Hem-Fir')[0].grade).toBe('#2 & Btr')
  })

  it('returns empty array when hardwood species has no bf entered', () => {
    const state = createInitialTallyState()
    expect(quoteLinesOrEmpty(state, 'White Oak')).toHaveLength(0)
  })

  it('builds hardwood lines from tally hardwood entries', () => {
    const state = createInitialTallyState()
    state.hardwood['4/4'] = { bf: 1200, price: 2650, sellingPrice: 2650 }
    state.hardwood['8/4'] = { bf: 400, price: 3380, sellingPrice: 3380 }
    const lines = quoteLinesOrEmpty(state, 'White Oak')
    expect(lines).toHaveLength(2)
    expect(lines[0].bf).toBe(1200)
    expect(lines[0].mbf).toBe(2650)
    expect(lines[0].dims).toContain('4/4')
    expect(lines[1].bf).toBe(400)
  })

  it('appends hardwood lines to softwood loads when bf is present', () => {
    const state = createInitialTallyState()
    state.hardwood['5/4'] = { bf: 500, price: 2800, sellingPrice: 2800 }
    const lines = quoteLinesOrEmpty(state, 'Doug Fir')
    const hw = lines.find((l) => l.dims?.includes('5/4'))
    expect(hw).toBeDefined()
    expect(hw?.grade).toBe('#2 & Btr')
    expect(hw?.bf).toBe(500)
  })
})
