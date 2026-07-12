import { describe, expect, it } from 'vitest'
import { computeMarkup, dimensionalBoardFeet, dimensionalLinealFeet, hasValidAcquisitionCost } from './pricing'

describe('pricing', () => {
  it('computes markup and gross margin', () => {
    const result = computeMarkup(400, 500)
    expect(result).not.toBeNull()
    expect(result!.markupDollars).toBe(100)
    expect(result!.markupPct).toBe(25)
    expect(result!.grossMarginPct).toBe(20)
  })

  it('returns null when acquisition cost is missing', () => {
    expect(computeMarkup(null, 500)).toBeNull()
    expect(computeMarkup(0, 500)).toBeNull()
  })

  it('computes dimensional board feet: pieces × t × w × L ÷ 12', () => {
    const bf = dimensionalBoardFeet({
      units: 2,
      piecesPerUnit: 208,
      thickness: 2,
      width: 4,
      lengthFt: 8,
    })
    expect(bf).toBeCloseTo(2218.67, 0)
  })

  it('computes lineal feet as total pieces × length', () => {
    const lf = dimensionalLinealFeet({ units: 2, piecesPerUnit: 208, lengthFt: 8 })
    expect(lf).toBe(3328)
  })

  it('hasValidAcquisitionCost rejects zero and null', () => {
    expect(hasValidAcquisitionCost(null)).toBe(false)
    expect(hasValidAcquisitionCost(0)).toBe(false)
    expect(hasValidAcquisitionCost(100)).toBe(true)
  })
})
