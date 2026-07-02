import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { buildInitialPrices, getMarketPrice, getWeeklyChange, SPECIES_CATALOG } from '../lib/priceData'
import { priceRepository } from '../repositories/localStorage'
import type { PriceGroup } from '../types'
import { useToast } from './ToastContext'

type PricesContextValue = {
  prices: Record<string, number>
  query: string
  group: 'all' | PriceGroup
  setQuery: (q: string) => void
  setGroup: (g: 'all' | PriceGroup) => void
  setYourPrice: (key: string, value: number) => void
  syncMarket: () => void
  getMargin: (speciesKey: string, dim: string) => number
  getMarket: typeof getMarketPrice
  getChange: typeof getWeeklyChange
  catalog: typeof SPECIES_CATALOG
}

const PricesContext = createContext<PricesContextValue | null>(null)

export function PricesProvider({ children }: { children: ReactNode }) {
  const [prices, setPrices] = useState<Record<string, number>>(
    () => priceRepository.load() ?? buildInitialPrices(),
  )
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<'all' | PriceGroup>('all')
  const { showToast } = useToast()

  useEffect(() => {
    priceRepository.save(prices)
  }, [prices])

  const setYourPrice = useCallback((key: string, value: number) => {
    setPrices((p) => ({ ...p, [key]: value }))
  }, [])

  const syncMarket = useCallback(() => {
    showToast('Market prices synced (demo)')
  }, [showToast])

  const getMargin = useCallback(
    (speciesKey: string, dim: string) => {
      const mk = getMarketPrice(speciesKey, dim)
      const your = prices[`${speciesKey}|${dim}`] || 0
      return mk > 0 ? ((your - mk) / mk) * 100 : 0
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
      setYourPrice,
      syncMarket,
      getMargin,
      getMarket: getMarketPrice,
      getChange: getWeeklyChange,
      catalog: SPECIES_CATALOG,
    }),
    [prices, query, group, setYourPrice, syncMarket, getMargin],
  )

  return <PricesContext.Provider value={value}>{children}</PricesContext.Provider>
}

export function usePrices() {
  const ctx = useContext(PricesContext)
  if (!ctx) throw new Error('usePrices must be used within PricesProvider')
  return ctx
}
