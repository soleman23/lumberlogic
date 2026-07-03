import { describe, expect, it } from 'vitest'
import { buildMailtoUrl, quoteToPlainText } from './quoteText'

const quote = {
  rows: [
    { species: 'Doug Fir', grade: '#2 & Btr', dims: '2″×4″×8′', pcs: 208, bf: 1109.33, mbf: 485, ext: 538.03 },
    { species: 'Doug Fir', grade: '#2 & Btr', dims: '2″×6″×10′', pcs: 128, bf: 1280, mbf: 467, ext: 597.76 },
  ],
  subtotal: 1135.79,
  totalBf: 2389.33,
  totalPcs: 336,
  total: 1820.79,
}

const meta = {
  customer: 'Cascade Millworks',
  quoteNumber: 'Q-2026-A3F2',
  validUntil: '2026-07-17',
  message: 'Thanks for the chance to quote PO 2231.',
  freight: 685,
}

describe('quoteToPlainText', () => {
  it('includes header, one line per row, and totals', () => {
    const text = quoteToPlainText(quote, meta)
    expect(text).toContain('Quote Q-2026-A3F2')
    expect(text).toContain('For: Cascade Millworks')
    expect(text).toContain('Valid through Jul 17, 2026')
    expect(text).toContain('Doug Fir (#2 & Btr) 2″×4″×8′ — 208 pcs, 1,109 bd ft @ $485/MBF = $538.03')
    expect(text).toContain('2 items · 336 pieces · 2,389 board feet')
    expect(text).toContain('Subtotal: $1,135.79')
    expect(text).toContain('Freight: $685.00')
    expect(text).toContain('Total due: $1,820.79')
    expect(text).toContain(meta.message)
  })

  it('omits the pcs clause for random-width hardwood rows', () => {
    const hwQuote = {
      rows: [{ species: 'White Oak', grade: 'FAS', dims: '4/4 · RW', pcs: 0, bf: 770, mbf: 3120, ext: 2402.4 }],
      subtotal: 2402.4,
      totalBf: 770,
      totalPcs: 0,
      total: 3087.4,
    }
    const text = quoteToPlainText(hwQuote, meta)
    expect(text).toContain('White Oak (FAS) 4/4 · RW — 770 bd ft @ $3,120/MBF = $2,402.40')
    expect(text).not.toContain('pcs')
    expect(text).toContain('1 items · 770 board feet')
    expect(text).not.toContain('pieces ·')
  })
})

describe('buildMailtoUrl', () => {
  it('percent-encodes recipient, subject, and body', () => {
    const url = buildMailtoUrl('a@b.com', 'Quote Q-1 — Acme & Co', 'line1\nline2')
    expect(url).toBe('mailto:a%40b.com?subject=Quote%20Q-1%20%E2%80%94%20Acme%20%26%20Co&body=line1%0Aline2')
  })
})
