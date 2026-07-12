import { DIMENSION_DEFS, HARDWOOD_DEFS } from './constants'
import { priceKey, SPECIES_CATALOG } from './priceData'
import type { DimId, HwId, PriceBookStore, SpeciesDef } from '../types'

export type SpeciesPriceUpdates = {
  base: Partial<Record<DimId, number>>
  hardwood: Partial<Record<HwId, { sellingPrice: number; acquisitionCost: number | null; marketPrice: number | null }>>
  acquisition: Partial<Record<DimId, number>>
}

export function findSpecies(nameOrKey: string): SpeciesDef | undefined {
  return SPECIES_CATALOG.find(
    (s) => s.key === nameOrKey || s.name === nameOrKey || nameOrKey.startsWith(s.name),
  )
}

/** Map price-book entries onto worksheet selling/acquisition prices. */
export function speciesPriceUpdates(
  species: SpeciesDef,
  prices: PriceBookStore,
): SpeciesPriceUpdates {
  const base: Partial<Record<DimId, number>> = {}
  const acquisition: Partial<Record<DimId, number>> = {}
  const hardwood: SpeciesPriceUpdates['hardwood'] = {}

  if (species.group === 'Softwood') {
    DIMENSION_DEFS.forEach((d) => {
      const entry = prices[priceKey(species.key, d.label)]
      if (!entry) return
      if (entry.sellingPrice != null && entry.sellingPrice > 0) base[d.name] = entry.sellingPrice
      if (entry.acquisitionCost != null && entry.acquisitionCost > 0) acquisition[d.name] = entry.acquisitionCost
    })
  } else {
    HARDWOOD_DEFS.forEach((h) => {
      const entry = prices[priceKey(species.key, h.id)]
      if (!entry) return
      if (entry.sellingPrice != null && entry.sellingPrice > 0) {
        hardwood[h.id] = {
          sellingPrice: entry.sellingPrice,
          acquisitionCost: entry.acquisitionCost,
          marketPrice: entry.marketPrice,
        }
      }
    })
  }

  return { base, hardwood, acquisition }
}

export function countSpeciesPriceUpdates(updates: SpeciesPriceUpdates): number {
  return Object.keys(updates.base).length + Object.keys(updates.hardwood).length + Object.keys(updates.acquisition).length
}

export function buildEmptyPriceBook(): PriceBookStore {
  const store: PriceBookStore = {}
  SPECIES_CATALOG.forEach((sp) => {
    sp.dims.forEach((d) => {
      store[priceKey(sp.key, d)] = { marketPrice: null, acquisitionCost: null, sellingPrice: null }
    })
  })
  return store
}

export function migrateLegacyPrices(legacy: Record<string, number>): PriceBookStore {
  const store = buildEmptyPriceBook()
  for (const [key, value] of Object.entries(legacy)) {
    if (store[key]) {
      store[key] = { marketPrice: null, acquisitionCost: null, sellingPrice: value }
    }
  }
  return store
}
