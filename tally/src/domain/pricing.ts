import type { DimensionalLineItem, LineItem } from './types'

export type MarkupResult = {
  markupDollars: number
  markupPct: number
  grossProfit: number
  grossMarginPct: number
  isEstimated: boolean
} | null

export function hasValidAcquisitionCost(cost: number | null | undefined): cost is number {
  return cost != null && Number.isFinite(cost) && cost > 0
}

export function hasValidSellingPrice(price: number | null | undefined): price is number {
  return price != null && Number.isFinite(price) && price >= 0
}

/** Markup and gross margin from acquisition cost and selling price ($/MBF). */
export function computeMarkup(
  acquisitionCost: number | null | undefined,
  sellingPrice: number | null | undefined,
  isEstimated = false,
): MarkupResult {
  if (!hasValidAcquisitionCost(acquisitionCost) || !hasValidSellingPrice(sellingPrice)) {
    return null
  }
  const markupDollars = sellingPrice - acquisitionCost
  const grossProfit = markupDollars
  return {
    markupDollars,
    markupPct: (markupDollars / acquisitionCost) * 100,
    grossProfit,
    grossMarginPct: sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0,
    isEstimated,
  }
}

export function effectiveAcquisitionCost(
  marketPrice: number | null,
  acquisitionCost: number | null,
  useMarketAsEstimatedCost?: boolean,
): { cost: number | null; isEstimated: boolean } {
  if (hasValidAcquisitionCost(acquisitionCost)) {
    return { cost: acquisitionCost, isEstimated: false }
  }
  if (useMarketAsEstimatedCost && marketPrice != null && marketPrice > 0) {
    return { cost: marketPrice, isEstimated: true }
  }
  return { cost: null, isEstimated: false }
}

export function dimensionalBoardFeet(line: Pick<DimensionalLineItem, 'units' | 'piecesPerUnit' | 'thickness' | 'width' | 'lengthFt'>): number {
  const totalPieces = line.units * line.piecesPerUnit
  return (totalPieces * line.thickness * line.width * line.lengthFt) / 12
}

export function dimensionalLinealFeet(line: Pick<DimensionalLineItem, 'units' | 'piecesPerUnit' | 'lengthFt'>): number {
  const totalPieces = line.units * line.piecesPerUnit
  return totalPieces * line.lengthFt
}

export function dimensionalTotalPieces(line: Pick<DimensionalLineItem, 'units' | 'piecesPerUnit'>): number {
  return line.units * line.piecesPerUnit
}

export function lineBoardFeet(line: LineItem): number {
  if (line.materialType === 'hardwood') return line.directBf
  return dimensionalBoardFeet(line)
}

export function lineSellingValue(line: LineItem): number {
  const bf = lineBoardFeet(line)
  const price = line.sellingPrice ?? 0
  return (bf / 1000) * price
}

export function lineAcquisitionCost(line: LineItem): number | null {
  const bf = lineBoardFeet(line)
  const { cost } = effectiveAcquisitionCost(line.marketPrice, line.acquisitionCost, line.useMarketAsEstimatedCost)
  if (cost == null) return null
  return (bf / 1000) * cost
}

export function lineGrossProfit(line: LineItem): number | null {
  const acq = lineAcquisitionCost(line)
  if (acq == null) return null
  return lineSellingValue(line) - acq
}

export function loadTotals(lines: LineItem[]): {
  bf: number
  pcs: number
  sellingValue: number
  acquisitionCost: number | null
  grossProfit: number | null
} {
  let bf = 0
  let pcs = 0
  let sellingValue = 0
  let acquisitionCost = 0
  let hasCost = false
  let grossProfit = 0

  for (const line of lines) {
    bf += lineBoardFeet(line)
    if (line.materialType === 'dimensional') {
      pcs += dimensionalTotalPieces(line)
    }
    sellingValue += lineSellingValue(line)
    const acq = lineAcquisitionCost(line)
    if (acq != null) {
      hasCost = true
      acquisitionCost += acq
      grossProfit += acq != null ? lineSellingValue(line) - acq : 0
    }
  }

  return {
    bf,
    pcs,
    sellingValue,
    acquisitionCost: hasCost ? acquisitionCost : null,
    grossProfit: hasCost ? grossProfit : null,
  }
}

export const CURRENCY_TOLERANCE = 0.01
export const BF_TOLERANCE = 0.01

export function withinCurrencyTolerance(a: number, b: number): boolean {
  return Math.abs(a - b) <= CURRENCY_TOLERANCE
}

export function withinBfTolerance(a: number, b: number): boolean {
  return Math.abs(a - b) <= BF_TOLERANCE
}
