import { dateLong, fmt, money2 } from './formatters'
import type { CompanySettings } from '../domain/types'
import { formatCompanyFooter } from '../domain/settings'

export type QuoteTextRow = {
  species: string
  grade: string
  dims: string
  pcs: number
  bf: number
  mbf: number
  ext: number
}

export type QuoteTextInput = {
  rows: QuoteTextRow[]
  subtotal: number
  totalBf: number
  totalPcs: number
  total: number
}

export type QuoteTextMeta = {
  customer: string
  quoteNumber: string
  validUntil: string
  message: string
  freight: number
  settings?: CompanySettings
}

/** Plain-text rendering of a quote for email bodies and clipboard sharing. */
export function quoteToPlainText(quote: QuoteTextInput, meta: QuoteTextMeta): string {
  const appName = meta.settings?.displayName || meta.settings?.appName || 'Lumber Logic'
  const footer = meta.settings ? formatCompanyFooter(meta.settings) : appName
  const lines = [
    `${appName} — Quote ${meta.quoteNumber}`,
    `For: ${meta.customer}`,
    `Valid through ${dateLong(meta.validUntil)}`,
    '',
    ...quote.rows.map(
      (r) =>
        `${r.species} (${r.grade}) ${r.dims} — ` +
        (r.pcs > 0 ? `${fmt(r.pcs, 0)} pcs, ` : '') +
        `${fmt(Math.round(r.bf), 0)} bd ft @ $${fmt(r.mbf, 0)}/MBF = ${money2(r.ext)}`,
    ),
    '',
    `${quote.rows.length} items · ` +
      (quote.totalPcs > 0 ? `${fmt(quote.totalPcs, 0)} pieces · ` : '') +
      `${fmt(Math.round(quote.totalBf), 0)} board feet`,
    `Subtotal: ${money2(quote.subtotal)}`,
    `Freight: ${money2(meta.freight)}`,
    `Total due: ${money2(quote.total)}`,
    '',
    meta.message,
    '',
    footer,
  ]
  return lines.join('\n')
}

export function buildMailtoUrl(email: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
