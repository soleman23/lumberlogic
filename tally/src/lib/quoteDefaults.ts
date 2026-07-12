import type { SavedLoad } from '../types'

export const DEFAULT_FREIGHT = 0

export function defaultFreightFor(load: SavedLoad): number {
  return load.freight != null && load.freight >= 0 ? load.freight : DEFAULT_FREIGHT
}

const QUOTE_SEQ_KEY = 'lumber-logic-quote-seq'

const quoteSeqMemory: Record<string, number> = {}

function readSeq(key: string): number {
  if (typeof localStorage !== 'undefined') return parseInt(localStorage.getItem(key) ?? '0', 10)
  return quoteSeqMemory[key] ?? 0
}

function writeSeq(key: string, value: number): void {
  if (typeof localStorage !== 'undefined') localStorage.setItem(key, String(value))
  else quoteSeqMemory[key] = value
}

export function nextQuoteNumber(prefix = 'CB', year = new Date().getFullYear()): string {
  const key = `${QUOTE_SEQ_KEY}-${year}`
  const current = readSeq(key)
  const next = current + 1
  writeSeq(key, next)
  return `${prefix}-${year}-${String(next).padStart(4, '0')}`
}

/** @deprecated Use nextQuoteNumber for production quotes. */
export function quoteNumberFor(load: SavedLoad): string {
  return nextQuoteNumber('CB', parseInt(load.date.slice(0, 4), 10) || new Date().getFullYear())
}

export function defaultValidUntil(from = new Date(), days = 14): string {
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function defaultQuoteMessage(load: SavedLoad, shippingOrigin = 'our yard'): string {
  return (
    `Thanks for the chance to quote ${load.sub}. Pricing below covers the ` +
    `${load.species} load FOB ${shippingOrigin}. These numbers hold through the ` +
    `valid-through date — give us a call if you'd like to adjust counts or lengths.`
  )
}
