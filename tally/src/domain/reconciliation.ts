import type { LineItem, Load, Truck, TruckAllocation } from './types'
import type { DimensionalLineItem } from './types'
import { dimensionalTotalPieces } from './pricing'

export type LineAllocationStatus = {
  lineId: string
  available: number
  allocated: number
  unallocated: number
  overallocated: number
  truckIds: number[]
  unit: 'units' | 'bf'
}

export function getLineAvailableQty(line: LineItem): number {
  if (line.materialType === 'hardwood') return line.directBf
  return line.units
}

export function allocationQty(alloc: TruckAllocation, line: LineItem): number {
  if (line.materialType === 'hardwood') return alloc.allocatedBf ?? 0
  return alloc.allocatedUnits ?? alloc.allocatedPieces ?? 0
}

export function lineAllocationStatuses(load: Load): LineAllocationStatus[] {
  return load.lines.map((line) => {
    const available = getLineAvailableQty(line)
    let allocated = 0
    const truckIds: number[] = []
    for (const truck of load.trucks) {
      for (const alloc of truck.allocations) {
        if (alloc.sourceLineId !== line.id) continue
        allocated += allocationQty(alloc, line)
        if (!truckIds.includes(truck.id)) truckIds.push(truck.id)
      }
    }
    const overallocated = Math.max(0, allocated - available)
    const unallocated = Math.max(0, available - allocated)
    return {
      lineId: line.id,
      available,
      allocated,
      unallocated,
      overallocated,
      truckIds,
      unit: line.materialType === 'hardwood' ? 'bf' : 'units',
    }
  })
}

export function hasOverAllocation(load: Load): boolean {
  return lineAllocationStatuses(load).some((s) => s.overallocated > 0)
}

export function truckAllocatedBf(truck: Truck, lines: LineItem[]): number {
  let bf = 0
  const lineMap = new Map(lines.map((l) => [l.id, l]))
  for (const alloc of truck.allocations) {
    const line = lineMap.get(alloc.sourceLineId)
    if (!line) continue
    if (line.materialType === 'hardwood') {
      bf += alloc.allocatedBf ?? 0
    } else {
      const dimLine = line as DimensionalLineItem
      const units = alloc.allocatedUnits ?? 0
      const pcs = dimLine.units > 0 ? (units / dimLine.units) * dimensionalTotalPieces(dimLine) : 0
      bf += (pcs * dimLine.thickness * dimLine.width * dimLine.lengthFt) / 12
    }
  }
  return bf
}

export function reconcileTruckToLoad(load: Load): { ok: boolean; diffs: string[] } {
  const diffs: string[] = []
  if (load.trucks.length === 0) return { ok: true, diffs: [] }

  const statuses = lineAllocationStatuses(load)
  for (const s of statuses) {
    if (s.overallocated > 0) {
      diffs.push(`Line ${s.lineId} over-allocated by ${s.overallocated} ${s.unit}`)
    }
  }
  return { ok: diffs.length === 0, diffs }
}

export function reconcileAll(load: Load): { ok: boolean; diffs: string[] } {
  const truck = reconcileTruckToLoad(load)
  return truck
}
