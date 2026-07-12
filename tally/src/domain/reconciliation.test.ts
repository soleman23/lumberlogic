import { describe, expect, it } from 'vitest'
import type { Load, DimensionalLineItem } from './types'
import { lineAllocationStatuses, hasOverAllocation, truckAllocatedBf } from './reconciliation'
import { SCHEMA_VERSION } from './types'

function dimLine(id: string, units: number, lengthFt: number): DimensionalLineItem {
  return {
    id,
    materialType: 'dimensional',
    species: 'Doug Fir',
    grade: '#2',
    dimension: '2x4',
    thickness: 2,
    width: 4,
    lengthFt,
    units,
    piecesPerUnit: 208,
    marketPrice: null,
    acquisitionCost: null,
    sellingPrice: 500,
  }
}

function makeLoad(lines: DimensionalLineItem[], trucks: Load['trucks']): Load {
  return {
    schemaVersion: SCHEMA_VERSION,
    id: '1',
    name: 'Test',
    sub: 'PO',
    species: 'Doug Fir',
    status: 'Draft',
    freight: 0,
    lines,
    trucks,
    nextTruckId: 2,
    createdAt: '',
    updatedAt: '',
  }
}

describe('truck allocation', () => {
  it('tracks available vs allocated per line', () => {
    const line = dimLine('l1', 10, 8)
    const load = makeLoad([line], [
      { id: 1, name: 'T1', targetBf: 8000, allocations: [{ sourceLineId: 'l1', allocatedUnits: 6 }] },
    ])
    const status = lineAllocationStatuses(load)[0]
    expect(status.available).toBe(10)
    expect(status.allocated).toBe(6)
    expect(status.unallocated).toBe(4)
    expect(status.overallocated).toBe(0)
  })

  it('detects over-allocation', () => {
    const line = dimLine('l1', 5, 8)
    const load = makeLoad([line], [
      { id: 1, name: 'T1', targetBf: 8000, allocations: [{ sourceLineId: 'l1', allocatedUnits: 8 }] },
    ])
    expect(hasOverAllocation(load)).toBe(true)
    expect(lineAllocationStatuses(load)[0].overallocated).toBe(3)
  })

  it('splits one line across multiple trucks', () => {
    const line = dimLine('l1', 10, 12)
    const load = makeLoad([line], [
      { id: 1, name: 'T1', targetBf: 5000, allocations: [{ sourceLineId: 'l1', allocatedUnits: 4 }] },
      { id: 2, name: 'T2', targetBf: 5000, allocations: [{ sourceLineId: 'l1', allocatedUnits: 6 }] },
    ])
    const status = lineAllocationStatuses(load)[0]
    expect(status.allocated).toBe(10)
    expect(status.truckIds).toEqual([1, 2])
  })

  it('computes truck BF from exact allocated units', () => {
    const line = dimLine('l1', 10, 8)
    const load = makeLoad([line], [
      { id: 1, name: 'T1', targetBf: 8000, allocations: [{ sourceLineId: 'l1', allocatedUnits: 5 }] },
    ])
    const bf = truckAllocatedBf(load.trucks[0], load.lines)
    expect(bf).toBeCloseTo((5 * 208 * 2 * 4 * 8) / 12, 0)
  })
})
