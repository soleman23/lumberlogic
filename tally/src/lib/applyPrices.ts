import { DIMENSION_DEFS, HARDWOOD_DEFS } from './constants'
import { priceKey, SPECIES_CATALOG } from './priceData'
import type { DimId, HwId, SpeciesDef } from '../types'

export type SpeciesPriceUpdates = {
  base: Partial<Record<DimId, number>>
  hardwood: Partial<Record<HwId, number>>
}

export function findSpecies(nameOrKey: string): SpeciesDef | undefined {
  return SPECIES_CATALOG.find(
    (s) => s.key === nameOrKey || s.name === nameOrKey || nameOrKey.startsWith(s.name),
  )
}

/** Map price-book "Your $" rows onto worksheet base $/MBF or hardwood $/MBF. */
export function speciesPriceUpdates(
  species: SpeciesDef,
  prices: Record<string, number>,
): SpeciesPriceUpdates {
  const base: Partial<Record<DimId, number>> = {}
  const hardwood: Partial<Record<HwId, number>> = {}

  if (species.group === 'Softwood') {
    DIMENSION_DEFS.forEach((d) => {
      const your = prices[priceKey(species.key, d.label)]
      if (your > 0) base[d.name] = your
    })
  } else {
    HARDWOOD_DEFS.forEach((h) => {
      const your = prices[priceKey(species.key, h.id)]
      if (your > 0) hardwood[h.id] = your
    })
  }

  return { base, hardwood }
}

export function countSpeciesPriceUpdates(updates: SpeciesPriceUpdates): number {
  return Object.keys(updates.base).length + Object.keys(updates.hardwood).length
}
