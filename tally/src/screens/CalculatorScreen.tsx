import { useState } from 'react'
import { useBreakpoints } from '../hooks/useMediaQuery'
import { cellBF, dimTotals, effectivePrice, truckProgress, dimTotalUnits, dimAllocationTotals } from '../lib/tallyMath'
import { DIMENSION_DEFS, LENGTHS, cellKey } from '../lib/constants'
import { fmt, money, parseNum } from '../lib/formatters'
import { useTally } from '../context/TallyContext'
import { useLoads } from '../context/LoadsContext'
import { useToast } from '../context/ToastContext'
import { usePrices } from '../context/PricesContext'
import type { DimId, DimensionDef } from '../types'
import { Chip } from '../components/Chip'
import { Stepper } from '../components/Stepper'
import { Button } from '../components/Button'
import { SaveLoadModal, type SaveLoadMeta } from '../components/SaveLoadModal'
import './CalculatorScreen.css'

function DimensionBlock({ dim, showPriceRow }: { dim: DimensionDef; showPriceRow: boolean }) {
  const { state, setPieces, setBase, setUnits, setOverride } = useTally()
  const { isMobile, isWide } = useBreakpoints()
  const totals = dimTotals(dim, state)

  if (isMobile) {
    return (
      <div className="dim-block card-surface">
        <div className="dim-block__mobile-head">
          <span className="dim-block__swatch" style={{ background: dim.accent }} />
          <span className="dim-block__label">{dim.label}</span>
          <label className="dim-block__compact-field">
            <span>Pc/unit</span>
            <input
              type="number"
              value={state.pieces[dim.name] || ''}
              onChange={(e) => setPieces(dim.name, parseNum(e.target.value))}
            />
          </label>
          <label className="dim-block__compact-field">
            <span>$/MBF</span>
            <input
              type="number"
              value={state.base[dim.name] || ''}
              onChange={(e) => setBase(dim.name, parseNum(e.target.value))}
            />
          </label>
        </div>
        {LENGTHS.map((L) => {
          const u = state.units[cellKey(dim.name, L)] || 0
          const cbf = cellBF(dim, L, u, state.pieces[dim.name] || 0)
          return (
            <div key={L} className="dim-block__mobile-row">
              <span className="dim-block__len">{L}′</span>
              <Stepper value={u} onChange={(v: number) => setUnits(dim.name, L, v)} />
              <span className="dim-block__cell-bf">{cbf > 0 ? fmt(cbf, 0) : '·'} bf</span>
            </div>
          )
        })}
        <div className="dim-block__mobile-summary">
          <span>{fmt(totals.bf, 0)} bf</span>
          <span>{fmt(totals.pcs, 0)} pcs</span>
          {totals.cost > 0 && <span className="dim-block__cost">{money(totals.cost)}</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="dim-block card-surface">
      <div className={`dim-block__desktop ${isWide ? '' : 'dim-block__desktop--tablet'}`}>
        <div className="dim-block__info">
          <div className="dim-block__info-head">
            <span className="dim-block__swatch" style={{ background: dim.accent }} />
            <span className="dim-block__label">{dim.label}</span>
          </div>
          <label className="dim-block__field">
            <span className="dim-block__field-label">Pieces / unit</span>
            <input
              className="dim-block__pieces-input"
              type="number"
              value={state.pieces[dim.name] || ''}
              onChange={(e) => setPieces(dim.name, parseNum(e.target.value))}
            />
          </label>
          <label className="dim-block__field">
            <span className="dim-block__field-label">Base $ / MBF</span>
            <div className="dim-block__money-wrap">
              <span>$</span>
              <input
                type="number"
                value={state.base[dim.name] || ''}
                onChange={(e) => setBase(dim.name, parseNum(e.target.value))}
              />
            </div>
          </label>
        </div>

        <div className="dim-block__grid">
          <div className="dim-block__grid-row dim-block__grid-row--head">
            <span className="dim-block__row-label">ft</span>
            {LENGTHS.map((L) => (
              <span key={L} className="dim-block__len-head">
                {L}
              </span>
            ))}
          </div>
          <div className="dim-block__grid-row">
            <span className="dim-block__row-label">Units</span>
            {LENGTHS.map((L) => (
              <input
                key={L}
                type="number"
                className="dim-block__unit-input"
                value={state.units[cellKey(dim.name, L)] || ''}
                placeholder="0"
                onChange={(e) => setUnits(dim.name, L, parseNum(e.target.value))}
              />
            ))}
          </div>
          {showPriceRow && (
            <div className="dim-block__grid-row">
              <span className="dim-block__row-label">$-MBF</span>
              {LENGTHS.map((L) => {
                const ov = state.override[cellKey(dim.name, L)]
                const eff = effectivePrice(state, dim.name, L)
                return (
                  <input
                    key={L}
                    type="number"
                    className={`dim-block__price-input ${ov != null ? 'dim-block__price-input--override' : ''}`}
                    value={eff === 0 ? '' : eff}
                    placeholder="0"
                    onChange={(e) => {
                      const t = e.target.value.trim()
                      setOverride(dim.name, L, t === '' ? null : parseNum(t))
                    }}
                  />
                )
              })}
            </div>
          )}
          <div className="dim-block__grid-row">
            <span className="dim-block__row-label">Board ft</span>
            {LENGTHS.map((L) => {
              const u = state.units[cellKey(dim.name, L)] || 0
              const cbf = cellBF(dim, L, u, state.pieces[dim.name] || 0)
              return (
                <span key={L} className="dim-block__bf-readout">
                  {cbf > 0 ? fmt(cbf, 0) : '·'}
                </span>
              )
            })}
          </div>
        </div>

        <div className="dim-block__summary">
          <div className="dim-block__summary-bf">
            <span className="dim-block__summary-label">Board feet</span>
            <span>
              {fmt(totals.bf, 0)} <small>bf</small>
            </span>
          </div>
          <div className="dim-block__summary-grid">
            <div>
              <span>Pieces</span>
              <strong>{fmt(totals.pcs, 0)}</strong>
            </div>
            <div>
              <span>LF</span>
              <strong>{fmt(totals.lf, 0)}</strong>
            </div>
            <div>
              <span>Avg $/MBF</span>
              <strong className="dim-block__accent">{totals.avg > 0 ? money(totals.avg) : '—'}</strong>
            </div>
            <div>
              <span>Cost</span>
              <strong className="dim-block__green">{totals.cost > 0 ? money(totals.cost) : '—'}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TruckBuilder() {
  const { state, addTruckGroup, removeTruckGroup, patchTruck, toggleMember, setMemberQty } = useTally()

  return (
    <section className="trucks">
      <div className="trucks__head">
        <div>
          <h2 className="trucks__title">Mixed-truck builder</h2>
          <p className="trucks__desc">Group widths into a truck and set units per dimension toward your target capacity.</p>
        </div>
        <Button variant="primary" onClick={addTruckGroup}>
          + Add truck
        </Button>
      </div>
      <div className="trucks__grid">
        {state.trucks.map((truck) => {
          const p = truckProgress(truck, state)
          return (
            <div key={truck.id} className="truck-card card-surface">
              <div className="truck-card__top">
                <input
                  className="truck-card__name"
                  value={truck.name}
                  onChange={(e) => patchTruck(truck.id, { name: e.target.value })}
                  aria-label="Truck name"
                />
                <button type="button" className="truck-card__delete" aria-label="Remove truck" onClick={() => removeTruckGroup(truck.id)}>
                  🗑
                </button>
              </div>
              <div className="truck-card__chips">
                {DIMENSION_DEFS.map((d) => (
                  <Chip
                    key={d.name}
                    selected={truck.members.includes(d.name as DimId)}
                    onClick={() => toggleMember(truck.id, d.name as DimId)}
                  >
                    {d.label}
                  </Chip>
                ))}
              </div>
              {truck.members.length > 0 && (
                <div className="truck-card__qty-list">
                  {truck.members.map((dimId) => {
                    const d = DIMENSION_DEFS.find((x) => x.name === dimId)!
                    const worksheetUnits = dimTotalUnits(state, dimId)
                    const qty = truck.memberQty?.[dimId] ?? worksheetUnits
                    const alloc = dimAllocationTotals(d, state, qty)
                    return (
                      <div key={dimId} className="truck-card__qty-row">
                        <span className="truck-card__qty-label">{d.label}</span>
                        <label className="truck-card__qty-field">
                          <span>Units</span>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            inputMode="numeric"
                            value={qty === 0 ? '' : qty}
                            placeholder="0"
                            aria-label={`Units of ${d.label} on this truck`}
                            onChange={(e) => setMemberQty(truck.id, dimId, parseNum(e.target.value))}
                          />
                        </label>
                        <span className="truck-card__qty-bf">{fmt(alloc.bf, 0)} bf</span>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="truck-card__stats">
                <div>
                  <strong>{fmt(p.bf, 0)} bf</strong>
                  <span>
                    {fmt(p.lf, 0)} LF · {fmt(p.pcs, 0)} pcs
                  </span>
                </div>
                <label className="truck-card__target">
                  Target bf
                  <input
                    type="number"
                    value={truck.target || ''}
                    onChange={(e) => patchTruck(truck.id, { target: parseNum(e.target.value) })}
                  />
                </label>
              </div>
              <div className="truck-card__bar-track">
                <div
                  className="truck-card__bar-fill"
                  style={{ width: `${Math.min(100, p.pct)}%`, background: p.barColor }}
                />
              </div>
              <div className="truck-card__footer" style={{ color: p.barColor }}>
                <span>{fmt(Math.round(p.pct), 0)}% full</span>
                <span>{p.remainLabel}</span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function CalculatorScreen() {
  const { totals, setBase } = useTally()
  const { saveCurrentLoad } = useLoads()
  const { showToast } = useToast()
  const { prices } = usePrices()
  const { isMobile, isShort } = useBreakpoints()
  const showPriceRow = !isMobile

  const applyPriceBook = () => {
    const map: Record<string, [string, string]> = {
      '2x4': ['df', '2×4'],
      '2x6': ['df', '2×6'],
      '2x8': ['df', '2×8'],
      '2x10': ['df', '2×10'],
      '2x12': ['df', '2×12'],
    }
    Object.entries(map).forEach(([dim, [key, label]]) => {
      const p = prices[`${key}|${label}`]
      if (p) setBase(dim as import('../types').DimId, p)
    })
    showToast('Applied price book to base $/MBF')
  }

  const [saveOpen, setSaveOpen] = useState(false)

  const handleSaveLoad = (meta: SaveLoadMeta) => {
    const load = saveCurrentLoad(meta)
    setSaveOpen(false)
    showToast(`Saved ${load.name}`)
  }

  return (
    <>
      <div className="calc-top">
        <div className="page-header">
          <p className="page-header__eyebrow">Random length price converter</p>
          <h1 className="page-header__title">Load tally</h1>
          <p className="page-header__desc">
            Enter units per length. Board footage builds automatically — add $/MBF to price the load.
          </p>
        </div>

        <div className="calc-actions">
          {!isMobile && (
            <div className="grand-tiles">
              <div className="grand-tiles__dark">
                <span className="grand-tiles__label">Total board ft</span>
                <span className="grand-tiles__value">
                  {fmt(totals.bf, 0)} <small>bf</small>
                </span>
              </div>
              <div className="grand-tiles__light">
                <span className="grand-tiles__label">Pieces</span>
                <span className="grand-tiles__value">{fmt(totals.pcs, 0)}</span>
              </div>
              <div className="grand-tiles__light">
                <span className="grand-tiles__label">Load value</span>
                <span className="grand-tiles__value grand-tiles__value--green">{money(totals.cost)}</span>
              </div>
            </div>
          )}
          <div className="calc-actions__buttons">
            <Button variant="secondary" size="sm" onClick={applyPriceBook}>
              Apply prices
            </Button>
            <Button variant="primary" size="sm" onClick={() => setSaveOpen(true)}>
              Save load
            </Button>
          </div>
        </div>
      </div>

      <div className="dim-list">
        {DIMENSION_DEFS.map((d) => (
          <DimensionBlock key={d.name} dim={d} showPriceRow={showPriceRow} />
        ))}
      </div>

      <TruckBuilder />

      {isMobile && (
        <div
          className="mobile-totals"
          style={{ bottom: isShort ? 'calc(34px + env(safe-area-inset-bottom))' : 'calc(55px + env(safe-area-inset-bottom))' }}
        >
          <div>
            <span>{fmt(totals.bf, 0)} bf</span>
            <span>{fmt(totals.pcs, 0)} pcs</span>
          </div>
          <strong className="mobile-totals__cost">{money(totals.cost)}</strong>
        </div>
      )}

      {isMobile && <div style={{ height: isShort ? 92 : 120 }} aria-hidden="true" />}

      {saveOpen && <SaveLoadModal onClose={() => setSaveOpen(false)} onSave={handleSaveLoad} />}
    </>
  )
}
