import { dateLong, fmt, money2 } from './formatters'

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
}

/** Plain-text rendering of a quote for email bodies and clipboard sharing. */
export function quoteToPlainText(quote: QuoteTextInput, meta: QuoteTextMeta): string {
  const lines = [
    `Lumber Logic — Quote ${meta.quoteNumber}`,
    `For: ${meta.customer}`,
    `Valid through ${dateLong(meta.validUntil)}`,
    '',
    ...quote.rows.map(
      (r) =>
        `${r.species} (${r.grade}) ${r.dims} — ${fmt(r.pcs, 0)} pcs, ` +
        `${fmt(Math.round(r.bf), 0)} bd ft @ $${fmt(r.mbf, 0)}/MBF = ${money2(r.ext)}`,
    ),
    '',
    `${quote.rows.length} items · ${fmt(quote.totalPcs, 0)} pieces · ${fmt(Math.round(quote.totalBf), 0)} board feet`,
    `Subtotal: ${money2(quote.subtotal)}`,
    `Freight: ${money2(meta.freight)}`,
    `Total due: ${money2(quote.total)}`,
    '',
    meta.message,
    '',
    'Lumber Logic LLC · 1842 Timber Lane · Bend, OR 97701 · (541) 555-0142',
  ]
  return lines.join('\n')
}

/** RFC 6068 mailto: URL with percent-encoded subject and body. */
export function buildMailtoUrl(email: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
