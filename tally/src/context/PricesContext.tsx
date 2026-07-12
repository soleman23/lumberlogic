import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { buildEmptyPriceBook, migrateLegacyPrices } from '../lib/applyPrices'
import { getMarketPrice, getWeeklyChange, SPECIES_CATALOG } from '../lib/priceData'
import { computeMarkup } from '../domain/pricing'
import { priceRepository } from '../repositories/localStorage'
import type { PriceBookStore, PriceGroup } from '../types'
import { useToast } from './ToastContext'

type PricesContextValue = {
  prices: PriceBookStore
  query: string
  group: 'all' | PriceGroup
  setQuery: (q: string) => void
  setGroup: (g: 'all' | PriceGroup) => void
  setMarketPrice: (key: string, value: number | null) => void
  setAcquisitionCost: (key: string, value: number | null) => void
  setSellingPrice: (key: string, value: number | null) => void
  syncMarket: () => void
  getMarkup: (speciesKey: string, dim: string) => ReturnType<typeof computeMarkup>
  getMarket: typeof getMarketPrice
  getChange: typeof getWeeklyChange
  catalog: typeof SPECIES_CATALOG
}

const PricesContext = createContext<PricesContextValue | null>(null)

function initPrices(): PriceBookStore {
  const stored = priceRepository.load()
  if (!stored) return buildEmptyPriceBook()
  // Detect legacy format (number values)
  const firstVal = Object.values(stored)[0]
  if (typeof firstVal === 'number') {
    return migrateLegacyPrices(stored as unknown as Record<string, number>)
  }
  return stored as PriceBookStore
}

export function PricesProvider({ children }: { children: ReactNode }) {
  const [prices, setPrices] = useState<PriceBookStore>(() => initPrices())
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<'all' | PriceGroup>('all')
  const { showToast } = useToast()

  useEffect(() => {
    priceRepository.save(prices)
  }, [prices])

  const patchPrice = useCallback((key: string, field: keyof PriceBookStore[string], value: number | null) => {
    setPrices((p) => ({
      ...p,
      [key]: { ...(p[key] ?? { marketPrice: null, acquisitionCost: null, sellingPrice: null }), [field]: value },
    }))
  }, [])

  const setMarketPrice = useCallback((key: string, value: number | null) => patchPrice(key, 'marketPrice', value), [patchPrice])
  const setAcquisitionCost = useCallback((key: string, value: number | null) => patchPrice(key, 'acquisitionCost', value), [patchPrice])
  const setSellingPrice = useCallback((key: string, value: number | null) => patchPrice(key, 'sellingPrice', value), [patchPrice])

  const syncMarket = useCallback(() => {
    setPrices((p) => {
      const next = { ...p }
      SPECIES_CATALOG.forEach((sp) => {
        sp.dims.forEach((d, i) => {
          const k = `${sp.key}|${d}`
          if (!next[k]) next[k] = { marketPrice: null, acquisitionCost: null, sellingPrice: null }
          next[k] = { ...next[k], marketPrice: sp.market[i] }
        })
      })
      return next
    })
    showToast('Market reference prices updated from catalog')
  }, [showToast])

  const getMarkup = useCallback(
    (speciesKey: string, dim: string) => {
      const entry = prices[`${speciesKey}|${dim}`]
      if (!entry) return null
      return computeMarkup(entry.acquisitionCost, entry.sellingPrice)
    },
    [prices],
  )

  const value = useMemo(
    () => ({
      prices,
      query,
      group,
      setQuery,
      setGroup,
      setMarketPrice,
      setAcquisitionCost,
      setSellingPrice,
      syncMarket,
      getMarkup,
      getMarket: getMarketPrice,
      getChange: getWeeklyChange,
      catalog: SPECIES_CATALOG,
    }),
    [prices, query, group, setMarketPrice, setAcquisitionCost, setSellingPrice, syncMarket, getMarkup],
  )

  return <PricesContext.Provider value={value}>{children}</PricesContext.Provider>
}

export function usePrices() {
  const ctx = useContext(PricesContext)
  if (!ctx) throw new Error('usePrices must be used within PricesProvider')
  return ctx
}
