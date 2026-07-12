import { describe, expect, it } from 'vitest'
import { createEmptyTallyState } from '../../lib/constants'
import { tallyToLines } from './tallyAdapter'
import { validateDimensionalLine, isValidLine } from '../validation/lines'

describe('tallyAdapter', () => {
  it('converts empty tally to no lines', () => {
    const state = createEmptyTallyState()
    expect(tallyToLines(state, 'Doug Fir', '#2 & Btr')).toHaveLength(0)
  })

  it('creates one line per non-zero cell', () => {
    const state = createEmptyTallyState()
    state.units['2x4|8'] = 3
    const lines = tallyToLines(state, 'Doug Fir', '#2 & Btr')
    expect(lines).toHaveLength(1)
    expect(lines[0].materialType).toBe('dimensional')
    if (lines[0].materialType === 'dimensional') expect(lines[0].units).toBe(3)
  })
})

describe('line validation', () => {
  it('rejects negative units', () => {
    const issues = validateDimensionalLine({
      id: '1',
      materialType: 'dimensional',
      species: 'DF',
      grade: '#2',
      dimension: '2x4',
      thickness: 2,
      width: 4,
      lengthFt: 8,
      units: -1,
      piecesPerUnit: 208,
      marketPrice: null,
      acquisitionCost: null,
      sellingPrice: 500,
    })
    expect(issues.some((i) => i.severity === 'error')).toBe(true)
  })

  it('isValidLine requires positive units and pieces per unit', () => {
    expect(
      isValidLine({
        id: '1',
        materialType: 'dimensional',
        species: 'DF',
        grade: '#2',
        dimension: '2x4',
        thickness: 2,
        width: 4,
        lengthFt: 8,
        units: 1,
        piecesPerUnit: 208,
        marketPrice: null,
        acquisitionCost: null,
        sellingPrice: 500,
      }),
    ).toBe(true)
  })
})
