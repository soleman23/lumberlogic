import { describe, expect, it } from 'vitest'
import { DIMENSION_DEFS, LENGTHS, cellKey, createInitialTallyState } from './constants'
import {
  bfPerFt,
  cellBF,
  clearTally,
  dimTotals,
  effectivePrice,
  grandTotals,
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
      trucks: [{ id: 1, name: 'Test', target: 1000, members: ['2x4'], memberQty: {} }],
      nextTruckId: 2,
    }
    const p = truckProgress(state.trucks[0], state)
    expect(p.over).toBe(true)
    expect(p.barColor).toBe('#B5482F')
  })

  it('truck progress scales by member quantity', () => {
    const state = createInitialTallyState()
    const full = truckProgress(
      { id: 1, name: 'T', target: 999999, members: ['2x4'], memberQty: {} },
      state,
    )
    const totalUnits = LENGTHS.reduce((s, L) => s + (state.units[cellKey('2x4', L)] || 0), 0)
    const half = truckProgress(
      { id: 1, name: 'T', target: 999999, members: ['2x4'], memberQty: { '2x4': totalUnits / 2 } },
      state,
    )
    expect(half.bf).toBeCloseTo(full.bf / 2, 0)
  })

  it('matches industry BF formula: 2×4×8 single piece', () => {
    const bf = cellBF({ name: '2x4', label: '2×4', t: 2, w: 4, pieces: 1, accent: '' }, 8, 1, 1)
    expect(bf).toBeCloseTo(5.33, 2)
  })
})
