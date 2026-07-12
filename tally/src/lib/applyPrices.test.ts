import { describe, expect, it } from 'vitest'
import { buildEmptyPriceBook, findSpecies, speciesPriceUpdates } from './applyPrices'

describe('applyPrices', () => {
  const prices = buildEmptyPriceBook()
  prices['df|2×4'] = { marketPrice: 478, acquisitionCost: 450, sellingPrice: 540 }
  prices['df|2×6'] = { marketPrice: 495, acquisitionCost: 470, sellingPrice: 560 }

  it('finds species by key and name', () => {
    expect(findSpecies('df')?.name).toBe('Doug Fir')
    expect(findSpecies('Doug Fir #2')?.name).toBe('Doug Fir')
  })

  it('maps softwood selling prices to base dims', () => {
    const sp = findSpecies('df')!
    const updates = speciesPriceUpdates(sp, prices)
    expect(updates.base['2x4']).toBe(540)
    expect(updates.acquisition['2x4']).toBe(450)
  })

  it('maps hardwood selling prices', () => {
    const pricesHw = buildEmptyPriceBook()
    pricesHw['wo|4/4'] = { marketPrice: 2650, acquisitionCost: 2400, sellingPrice: 3100 }
    const sp = findSpecies('wo')!
    const updates = speciesPriceUpdates(sp, pricesHw)
    expect(updates.hardwood['4/4']?.sellingPrice).toBe(3100)
  })
})
