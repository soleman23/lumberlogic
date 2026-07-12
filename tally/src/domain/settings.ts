import type { CompanySettings } from './types'
import { SCHEMA_VERSION } from './types'

export const DEFAULT_SETTINGS: CompanySettings = {
  schemaVersion: SCHEMA_VERSION,
  appName: 'Lumber Logic',
  companyLegalName: '',
  displayName: 'Lumber Logic',
  address: '',
  phone: '',
  replyToEmail: '',
  shippingOrigin: '',
  salespersonName: 'Cade Baggerly',
  quotePrefix: 'CB',
  quoteNumberFormat: 'CB-YYYY-####',
  defaultValidityDays: 14,
  defaultFreight: 0,
  defaultTaxRate: 0,
  defaultTaxDestination: 'OR',
  paymentTerms: 'Net 30',
  shippingTerms: 'FOB Shipping Point',
  currency: 'USD',
}

export type SettingsValidationIssue = { field: string; message: string; blocking: boolean }

export function validateCompanySettings(settings: CompanySettings): SettingsValidationIssue[] {
  const issues: SettingsValidationIssue[] = []
  const required: Array<[keyof CompanySettings, string]> = [
    ['companyLegalName', 'Company legal name'],
    ['address', 'Business address'],
    ['phone', 'Phone number'],
    ['replyToEmail', 'Reply-to email'],
    ['shippingOrigin', 'Shipping origin'],
    ['salespersonName', 'Salesperson name'],
  ]
  for (const [field, label] of required) {
    const val = settings[field]
    if (typeof val !== 'string' || !val.trim()) {
      issues.push({ field, message: `${label} is required`, blocking: true })
    }
  }
  if (settings.replyToEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.replyToEmail)) {
    issues.push({ field: 'replyToEmail', message: 'Reply-to email format is invalid', blocking: true })
  }
  return issues
}

export function isCompanySetupComplete(settings: CompanySettings): boolean {
  return validateCompanySettings(settings).filter((i) => i.blocking).length === 0
}

export function formatCompanyFooter(settings: CompanySettings): string {
  const parts = [settings.companyLegalName || settings.displayName]
  if (settings.address) parts.push(settings.address)
  if (settings.phone) parts.push(settings.phone)
  if (settings.replyToEmail) parts.push(settings.replyToEmail)
  return parts.filter(Boolean).join(' · ')
}
