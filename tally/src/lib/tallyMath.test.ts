import { describe, expect, it } from 'vitest'
import {
  DIMENSION_DEFS,
  LENGTHS,
  cellKey,
  createInitialTallyState,
  normalizeTallyState,
} from './constants'
import {
  bfPerFt,
  cellBF,
  clearTally,
  dimAllocatedAcrossTrucks,
  dimAllocationStatus,
  dimTotalUnits,
  dimTotals,
  effectivePrice,
  grandTotals,
  hardwoodTotals,
  truckMemberQty,
  truckProgress,
} from './tallyMath'
import type { TallyState } from '../types'

describe('tallyMath', () => {
  it('computes bf per foot for 2x4', () => {
    expect(bfPerFt({ t: 2, w: 4 })).toBeCloseTo(0.666667, 5)
  })

  it('computes cell BF: units × length × pieces/unit × (t×w/12)', () => {
    const d = DIMENSION_DEFS[0]
    // 1 unit × 8 ft × 208 pcs × (2×4/12) = 1109.33...
    const bf = cellBF(d, 8, 1, 208)
    expect(bf).toBeCloseTo(1109.33, 1)
  })

  it('uses override price when set', () => {
    const state = createInitialTallyState()
    state.override[cellKey('2x4', 8)] = 600
    expect(effectivePrice(state, '2x4', 8)).toBe(600)
    expect(effectivePrice(state, '2x4', 10)).toBe(485)
  })

  it('computes dim totals with seeded state', () => {
    const state = createInitialTallyState()
    const d4 = DIMENSION_DEFS.find((d) => d.name === '2x4')!
    const tot = dimTotals(d4, state)
    expect(tot.bf).toBeGreaterThan(0)
    expect(tot.pcs).toBeGreaterThan(0)
    expect(tot.cost).toBeGreaterThan(0)
  })

  it('computes grand totals from all dimensions', () => {
    const state = createInitialTallyState()
    const g = grandTotals(state)
    expect(g.bf).toBeGreaterThan(0)
    expect(g.pcs).toBeGreaterThan(0)
  })

  it('clearTally zeroes units and overrides only', () => {
    const state = createInitialTallyState()
    state.units[cellKey('2x4', 8)] = 5
    state.override[cellKey('2x4', 8)] = 999
    const cleared = clearTally(state)
    expect(cleared.units[cellKey('2x4', 8)]).toBe(0)
    expect(cleared.override[cellKey('2x4', 8)]).toBeNull()
    expect(cleared.base['2x4']).toBe(state.base['2x4'])
  })

  it('truck progress colors: over 100% is clay', () => {
    const state: TallyState = {
      ...createInitialTallyState(),
      units: Object.fromEntries(LENGTHS.map((L) => [cellKey('2x4', L), 50])),
      trucks: [{ id: 1, name: 'Test', target: 1000, members: ['2x4'], memberQty: { '2x4': 50 }, allocations: [] }],
      nextTruckId: 2,
    }
    const p = truckProgress(state.trucks[0], state)
    expect(p.over).toBe(true)
    expect(p.barColor).toBe('#B5482F')
  })

  it('truckMemberQty defaults to 0 when unset', () => {
    const state = createInitialTallyState()
    const truck = { id: 1, name: 'T', target: 8000, members: ['2x4' as const], memberQty: {}, allocations: [] }
    expect(truckMemberQty(truck, state, '2x4')).toBe(0)
    expect(truckMemberQty(truck, state, '2x6')).toBe(0)
  })

  it('dimAllocatedAcrossTrucks sums quantities on all trucks', () => {
    const state = createInitialTallyState()
    state.trucks = [
      { id: 1, name: 'A', target: 8000, members: ['2x4'], memberQty: { '2x4': 5 }, allocations: [] },
      { id: 2, name: 'B', target: 8000, members: ['2x4'], memberQty: { '2x4': 7 }, allocations: [] },
    ]
    expect(dimAllocatedAcrossTrucks(state, '2x4')).toBe(12)
  })

  it('dimAllocationStatus reports over-allocation across trucks', () => {
    const state = createInitialTallyState()
    const worksheet = dimTotalUnits(state, '2x4')
    state.trucks = [
      { id: 1, name: 'A', target: 8000, members: ['2x4'], memberQty: { '2x4': worksheet }, allocations: [] },
      { id: 2, name: 'B', target: 8000, members: ['2x4'], memberQty: { '2x4': 3 }, allocations: [] },
    ]
    const status = dimAllocationStatus(state, '2x4')
    expect(status.worksheet).toBe(worksheet)
    expect(status.allocated).toBe(worksheet + 3)
    expect(status.isOver).toBe(true)
    expect(status.overBy).toBe(3)
    expect(status.remaining).toBe(0)
  })

  it('dimAllocationStatus flags duplicate defaults when two trucks share a dim with explicit qty', () => {
    const state = createInitialTallyState()
    const worksheet = dimTotalUnits(state, '2x4')
    state.trucks = [
      { id: 1, name: 'A', target: 8000, members: ['2x4'], memberQty: { '2x4': worksheet }, allocations: [] },
      { id: 2, name: 'B', target: 8000, members: ['2x4'], memberQty: { '2x4': worksheet }, allocations: [] },
    ]
    const status = dimAllocationStatus(state, '2x4')
    expect(status.allocated).toBe(worksheet * 2)
    expect(status.isOver).toBe(true)
    expect(status.overBy).toBe(worksheet)
  })

  it('truck progress scales by member quantity', () => {
    const state = createInitialTallyState()
    Object.keys(state.units).forEach((k) => { state.units[k] = 0 })
    state.units[cellKey('2x4', 8)] = 4
    const full = truckProgress(
      { id: 1, name: 'T', target: 999999, members: ['2x4'], memberQty: { '2x4': 4 }, allocations: [] },
      state,
    )
    const half = truckProgress(
      { id: 1, name: 'T', target: 999999, members: ['2x4'], memberQty: { '2x4': 2 }, allocations: [] },
      state,
    )
    expect(half.bf).toBeCloseTo(full.bf / 2, 0)
  })

  it('matches industry BF formula: 2×4×8 single piece', () => {
    const bf = cellBF({ name: '2x4', label: '2×4', t: 2, w: 4, pieces: 1, accent: '' }, 8, 1, 1)
    expect(bf).toBeCloseTo(5.33, 2)
  })

  it('hardwoodTotals sums bf and cost at $/MBF', () => {
    const state = createInitialTallyState()
    state.hardwood['4/4'] = { bf: 1000, price: 3000 }
    state.hardwood['8/4'] = { bf: 500, price: 4000 }
    const hw = hardwoodTotals(state)
    expect(hw.bf).toBe(1500)
    expect(hw.cost).toBe(1000 / 1000 * 3000 + 500 / 1000 * 4000) // 5000
  })

  it('grand totals include hardwood bf and cost but not pieces', () => {
    const state = createInitialTallyState()
    const before = grandTotals(state)
    state.hardwood['4/4'] = { bf: 1000, price: 3000 }
    const after = grandTotals(state)
    expect(after.bf).toBeCloseTo(before.bf + 1000, 5)
    expect(after.cost).toBeCloseTo(before.cost + 3000, 5)
    expect(after.pcs).toBe(before.pcs)
  })

  it('clearTally zeroes hardwood bf but keeps prices', () => {
    const state = createInitialTallyState()
    state.hardwood['5/4'] = { bf: 400, price: 3320 }
    const cleared = clearTally(state)
    expect(cleared.hardwood['5/4'].bf).toBe(0)
    expect(cleared.hardwood['5/4'].price).toBe(3320)
  })

  it('normalizeTallyState fills hardwood and memberQty on legacy persisted state', () => {
    const modern = createInitialTallyState()
    const legacy = {
      ...modern,
      hardwood: undefined,
      trucks: modern.trucks.map(({ memberQty: _drop, ...rest }) => rest),
    } as unknown as TallyState
    const normalized = normalizeTallyState(legacy)
    expect(normalized.hardwood['4/4']).toMatchObject({ bf: 0, price: 0 })
    normalized.trucks.forEach((t) => expect(t.memberQty).toEqual({}))
  })
})
