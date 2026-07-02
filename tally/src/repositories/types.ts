import type { SavedLoad, TallyState } from '../types'

export interface LoadRepository {
  list(): SavedLoad[]
  save(load: SavedLoad): void
  delete(id: string): void
  get(id: string): SavedLoad | undefined
}

export interface TallyRepository {
  load(): TallyState | null
  save(state: TallyState): void
}

export interface PriceRepository {
  load(): Record<string, number> | null
  save(prices: Record<string, number>): void
}

/** Future backend swap-in points */
export interface QuoteService {
  sendEmail(to: string, quoteId: string): Promise<void>
  generatePdf(quoteId: string): Promise<Blob>
  createShareLink(quoteId: string): Promise<string>
}

export interface MarketSyncService {
  syncMarket(): Promise<void>
}
