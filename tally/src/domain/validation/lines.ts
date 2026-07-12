import type { DimensionalLineItem, HardwoodLineItem, LineItem } from '../types'

export type ValidationIssue = {
  field: string
  message: string
  severity: 'error' | 'warning'
}

function isNonNegativeFinite(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0
}

function isPositiveWhole(n: unknown): boolean {
  return typeof n === 'number' && Number.isInteger(n) && n > 0
}

function isNonNegativeWhole(n: unknown): boolean {
  return typeof n === 'number' && Number.isInteger(n) && n >= 0
}

const SUPPORTED_HW = new Set(['4/4', '5/4', '6/4', '8/4'])

export function validateDimensionalLine(line: DimensionalLineItem): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!isNonNegativeWhole(line.units)) {
    issues.push({ field: 'units', message: 'Units must be a non-negative whole number', severity: 'error' })
  }
  if (!isPositiveWhole(line.piecesPerUnit)) {
    issues.push({ field: 'piecesPerUnit', message: 'Pieces per unit must be a positive whole number', severity: 'error' })
  }
  if (!isNonNegativeFinite(line.lengthFt) || line.lengthFt <= 0) {
    issues.push({ field: 'lengthFt', message: 'Length must be positive', severity: 'error' })
  }
  if (!isNonNegativeFinite(line.thickness) || line.thickness <= 0) {
    issues.push({ field: 'thickness', message: 'Thickness must be positive', severity: 'error' })
  }
  if (!isNonNegativeFinite(line.width) || line.width <= 0) {
    issues.push({ field: 'width', message: 'Width must be positive', severity: 'error' })
  }
  if (line.marketPrice != null && !isNonNegativeFinite(line.marketPrice)) {
    issues.push({ field: 'marketPrice', message: 'Market price must be a non-negative number', severity: 'error' })
  }
  if (line.acquisitionCost != null && !isNonNegativeFinite(line.acquisitionCost)) {
    issues.push({ field: 'acquisitionCost', message: 'Acquisition cost must be a non-negative number', severity: 'error' })
  }
  if (line.sellingPrice != null && !isNonNegativeFinite(line.sellingPrice)) {
    issues.push({ field: 'sellingPrice', message: 'Selling price must be a non-negative number', severity: 'error' })
  }
  if (line.units > 10000) {
    issues.push({ field: 'units', message: 'Unusually large unit count', severity: 'warning' })
  }
  if ((line.sellingPrice ?? 0) > 50000) {
    issues.push({ field: 'sellingPrice', message: 'Unusually high selling price', severity: 'warning' })
  }
  return issues
}

export function validateHardwoodLine(line: HardwoodLineItem): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!SUPPORTED_HW.has(line.thickness)) {
    issues.push({ field: 'thickness', message: 'Thickness must be 4/4, 5/4, 6/4, or 8/4', severity: 'error' })
  }
  if (!isNonNegativeFinite(line.directBf)) {
    issues.push({ field: 'directBf', message: 'Board feet must be a non-negative number', severity: 'error' })
  }
  if (line.marketPrice != null && !isNonNegativeFinite(line.marketPrice)) {
    issues.push({ field: 'marketPrice', message: 'Market price must be a non-negative number', severity: 'error' })
  }
  if (line.acquisitionCost != null && !isNonNegativeFinite(line.acquisitionCost)) {
    issues.push({ field: 'acquisitionCost', message: 'Acquisition cost must be a non-negative number', severity: 'error' })
  }
  if (line.sellingPrice != null && !isNonNegativeFinite(line.sellingPrice)) {
    issues.push({ field: 'sellingPrice', message: 'Selling price must be a non-negative number', severity: 'error' })
  }
  if (line.directBf > 1_000_000) {
    issues.push({ field: 'directBf', message: 'Unusually large board-foot quantity', severity: 'warning' })
  }
  return issues
}

export function validateLineItem(line: LineItem): ValidationIssue[] {
  return line.materialType === 'dimensional'
    ? validateDimensionalLine(line)
    : validateHardwoodLine(line)
}

export function hasBlockingIssues(issues: ValidationIssue[]): boolean {
  return issues.some((i) => i.severity === 'error')
}

export function isValidLine(line: LineItem): boolean {
  if (line.materialType === 'dimensional') {
    return line.units > 0 && line.piecesPerUnit > 0 && line.lengthFt > 0
  }
  return line.directBf > 0
}

export function getValidLines(lines: LineItem[]): LineItem[] {
  return lines.filter(isValidLine)
}
