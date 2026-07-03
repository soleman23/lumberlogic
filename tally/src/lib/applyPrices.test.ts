import { describe, expect, it } from 'vitest'
import { buildInitialPrices } from './priceData'
import { countSpeciesPriceUpdates, findSpecies, speciesPriceUpdates } from './applyPrices'

describe('applyPrices', () => {
  const prices = buildInitialPrices()

  it('findSpecies matches catalog name, key, or prefix', () => {
    expect(findSpecies('df')?.name).toBe('Doug Fir')
    expect(findSpecies('Doug Fir')?.key).toBe('df')
    expect(findSpecies('Doug Fir #2')?.key).toBe('df')
  })

  it('maps softwood price book rows to dimensional base $/MBF', () => {
    const species = findSpecies('SPF #2')!
    const updates = speciesPriceUpdates(species, prices)
    expect(Object.keys(updates.base)).toHaveLength(5)
    expect(updates.base['2x4']).toBe(prices['spf|2×4'])
    expect(updates.hardwood).toEqual({})
  })

  it('maps hardwood price book rows to hardwood $/MBF', () => {
    const species = findSpecies('White Oak')!
    const updates = speciesPriceUpdates(species, prices)
    expect(updates.base).toEqual({})
    expect(updates.hardwood['4/4']).toBe(prices['wo|4/4'])
    expect(updates.hardwood['8/4']).toBe(prices['wo|8/4'])
  })

  it('counts applied rows', () => {
    const updates = speciesPriceUpdates(findSpecies('Hem-Fir')!, prices)
    expect(countSpeciesPriceUpdates(updates)).toBe(5)
  })
})
