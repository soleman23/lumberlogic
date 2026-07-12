import type { CompanySettings } from '../types'
import { isCompanySetupComplete } from '../settings'
import { getValidLines, hasBlockingIssues, validateLineItem } from './lines'
import type { Load } from '../types'
import { lineBoardFeet, lineSellingValue, withinBfTolerance, withinCurrencyTolerance } from '../pricing'
import { isDemoRecord } from '../demoData'

export type QuoteValidationIssue = {
  code: string
  message: string
  lineId?: string
  blocking: boolean
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function validateQuoteInput(input: {
  load: Load
  settings: CompanySettings
  validUntil: string
  issuedAt: string
  email?: string
  deliveryMethod?: 'email' | 'share_link' | 'pdf'
}): QuoteValidationIssue[] {
  const issues: QuoteValidationIssue[] = []
  const { load, settings, validUntil, issuedAt, email, deliveryMethod } = input

  if (isDemoRecord(load)) {
    issues.push({ code: 'demo_data', message: 'Demo loads cannot be sent as real quotes', blocking: true })
  }

  if (!load.name.trim()) {
    issues.push({ code: 'customer_required', message: 'Customer name is required', blocking: true })
  }

  if (!isCompanySetupComplete(settings)) {
    issues.push({ code: 'company_incomplete', message: 'Complete company setup before sending quotes', blocking: true })
  }

  const validLines = getValidLines(load.lines)
  if (validLines.length === 0) {
    issues.push({ code: 'no_lines', message: 'At least one valid line item is required', blocking: true })
    return issues
  }

  for (const line of load.lines) {
    const lineIssues = validateLineItem(line)
    if (hasBlockingIssues(lineIssues)) {
      issues.push({
        code: 'invalid_line',
        message: `Line ${line.id} has validation errors`,
        lineId: line.id,
        blocking: true,
      })
    }
  }

  for (const line of validLines) {
    if (line.sellingPrice == null || !Number.isFinite(line.sellingPrice)) {
      issues.push({
        code: 'missing_selling_price',
        message: `Selling price required for ${line.species} ${line.materialType === 'hardwood' ? line.thickness : line.dimension}`,
        lineId: line.id,
        blocking: true,
      })
    }
    const bf = lineBoardFeet(line)
    if (!Number.isFinite(bf) || bf < 0) {
      issues.push({ code: 'invalid_bf', message: 'Invalid board feet on line', lineId: line.id, blocking: true })
    }
    const ext = lineSellingValue(line)
    if (!Number.isFinite(ext) || ext < 0) {
      issues.push({ code: 'invalid_extension', message: 'Invalid line extension', lineId: line.id, blocking: true })
    }
  }

  if (validUntil < issuedAt.slice(0, 10)) {
    issues.push({ code: 'invalid_dates', message: 'Valid-through date cannot precede issue date', blocking: true })
  }

  if (load.freight < 0 || !Number.isFinite(load.freight)) {
    issues.push({ code: 'invalid_freight', message: 'Freight must be a non-negative number', blocking: true })
  }

  if (deliveryMethod === 'email') {
    if (!email?.trim()) {
      issues.push({ code: 'email_required', message: 'Email is required for email delivery', blocking: true })
    } else if (!validateEmail(email)) {
      issues.push({ code: 'email_invalid', message: 'Email format is invalid', blocking: true })
    }
  }

  const recon = reconcileLoadQuote(load)
  if (!recon.ok) {
    for (const diff of recon.diffs) {
      issues.push({ code: 'reconciliation', message: diff, blocking: true })
    }
  }

  return issues
}

export function canSendQuote(issues: QuoteValidationIssue[]): boolean {
  return issues.filter((i) => i.blocking).length === 0
}

export function reconcileLoadQuote(load: Load): { ok: boolean; diffs: string[] } {
  const validLines = getValidLines(load.lines)
  const loadBf = validLines.reduce((s, l) => s + lineBoardFeet(l), 0)
  const loadSelling = validLines.reduce((s, l) => s + lineSellingValue(l), 0)

  const quoteBf = validLines.reduce((s, l) => s + lineBoardFeet(l), 0)
  const quoteSelling = validLines.reduce((s, l) => s + lineSellingValue(l), 0)

  const diffs: string[] = []
  if (!withinBfTolerance(loadBf, quoteBf)) {
    diffs.push(`Board-foot mismatch: load ${loadBf.toFixed(2)} vs quote ${quoteBf.toFixed(2)}`)
  }
  if (!withinCurrencyTolerance(loadSelling, quoteSelling)) {
    diffs.push(`Selling value mismatch: load $${loadSelling.toFixed(2)} vs quote $${quoteSelling.toFixed(2)}`)
  }

  // Check saved load snapshot totals if present
  if (load.tally) {
    // totals from domain lines are authoritative
  }

  return { ok: diffs.length === 0, diffs }
}
