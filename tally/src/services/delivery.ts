import { buildMailtoUrl } from '../lib/quoteText'
import type { QuoteRevision } from '../domain/types'

export type EmailSendResult = {
  success: boolean
  error?: string
  fallbackUrl?: string
}

function escapePdfText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '-')
    .replace(/([\\()])/g, '\\$1')
}

function wrapPdfLine(line: string, max = 90): string[] {
  if (line.length <= max) return [line]
  const words = line.split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > max && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines
}

function createSimplePdf(lines: string[]): string {
  const textLines = lines.flatMap((line) => (line ? wrapPdfLine(line) : [''])).slice(0, 48)
  const stream = [
    'BT',
    '/F1 11 Tf',
    '14 TL',
    '50 750 Td',
    ...textLines.map((line) => `(${escapePdfText(line)}) Tj\nT*`),
    'ET',
  ].join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ]
  const offsets: number[] = []
  let body = '%PDF-1.4\n'
  objects.forEach((object, i) => {
    offsets.push(body.length)
    body += `${i + 1} 0 obj\n${object}\nendobj\n`
  })
  const xrefStart = body.length
  const xrefRows = offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n `)
  body += [
    'xref',
    `0 ${objects.length + 1}`,
    '0000000000 65535 f ',
    ...xrefRows,
    'trailer',
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    'startxref',
    String(xrefStart),
    '%%EOF',
  ].join('\n')
  return body
}

export const emailService = {
  async send(input: {
    to: string
    subject: string
    body: string
    replyTo: string
  }): Promise<EmailSendResult> {
    const useGraph = import.meta.env.VITE_M365_CLIENT_ID
    if (useGraph) {
      try {
        const res = await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })
        if (res.ok) return { success: true }
        return { success: false, error: await res.text() }
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }
    return {
      success: false,
      fallbackUrl: buildMailtoUrl(input.to, input.subject, input.body),
    }
  },
}

export const pdfService = {
  async generate(revision: QuoteRevision): Promise<Blob> {
    const s = revision.companySnapshot
    const lineRows = revision.lines.map(
      (l) =>
        `${l.species} (${l.grade}) ${l.dims} - ${Math.round(l.bf)} bd ft @ $${l.sellingPricePerMbf}/MBF = $${l.extendedSelling.toFixed(2)}`,
    )

    const textLines = [
      `${s.displayName || s.appName} - Quote ${revision.quoteNumber}`,
      `For: ${revision.customerName}`,
      `Valid through ${revision.validUntil}`,
      '',
      ...lineRows,
      '',
      `Subtotal: $${revision.subtotal.toFixed(2)}`,
      `Freight: $${revision.freight.toFixed(2)}`,
      `Total: $${revision.total.toFixed(2)}`,
      '',
      revision.message,
      '',
      `${s.shippingTerms} - ${s.paymentTerms}`,
    ]

    return new Blob([createSimplePdf(textLines)], { type: 'application/pdf' })
  },
}

const SHARE_LINKS_KEY = 'lumber-logic-share-links'

type ShareLinkRecord = {
  token: string
  revisionId: string
  revoked: boolean
  createdAt: string
}

function loadShareLinks(): ShareLinkRecord[] {
  try {
    return JSON.parse(localStorage.getItem(SHARE_LINKS_KEY) ?? '[]') as ShareLinkRecord[]
  } catch {
    return []
  }
}

function saveShareLinks(links: ShareLinkRecord[]): void {
  localStorage.setItem(SHARE_LINKS_KEY, JSON.stringify(links))
}

export const shareLinkService = {
  async create(revisionId: string): Promise<{ url: string; token: string; revoked: boolean }> {
    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 16)
    const base = window.location.origin
    const url = `${base}/quote/${token}`
    const links = loadShareLinks()
    links.push({ token, revisionId, revoked: false, createdAt: new Date().toISOString() })
    saveShareLinks(links)
    return { url, token, revoked: false }
  },

  async revoke(token: string): Promise<boolean> {
    const links = loadShareLinks()
    const link = links.find((l) => l.token === token)
    if (!link) return false
    link.revoked = true
    saveShareLinks(links)
    return true
  },

  getByToken(token: string): ShareLinkRecord | undefined {
    return loadShareLinks().find((l) => l.token === token && !l.revoked)
  },
}

export const cloudSyncService = {
  async push(): Promise<{ synced: number; failed: number }> {
    return { synced: 0, failed: 0 }
  },
  async pull(): Promise<{ updated: number }> {
    return { updated: 0 }
  },
}
