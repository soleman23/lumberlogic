import { useMemo, useRef } from 'react'
import { usePrices } from '../context/PricesContext'
import { useToast } from '../context/ToastContext'
import { dateLabel, money, parseNum } from '../lib/formatters'
import { IMPORT_TEMPLATE_CSV, parseCsv, autoMapColumns, validateAndMapRows, applyImportToPriceBook } from '../domain/import/spreadsheet'
import { IconRefresh, IconSearch } from '../components/Icons'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/Button'
import { SegmentedControl } from '../components/SegmentedControl'
import type { PriceGroup } from '../types'
import './PricesScreen.css'

function formatMarkup(markup: ReturnType<ReturnType<typeof usePrices>['getMarkup']>): string {
  if (!markup) return 'Cost required'
  const sign = markup.markupPct >= 0 ? '+' : '−'
  return `${sign}${Math.abs(markup.markupPct).toFixed(1)}%`
}

function formatMargin(markup: ReturnType<ReturnType<typeof usePrices>['getMarkup']>): string {
  if (!markup) return 'Not available'
  return `${markup.grossMarginPct.toFixed(1)}%`
}

export function PricesScreen() {
  const {
    prices,
    query,
    group,
    setQuery,
    setGroup,
    setMarketPrice,
    setAcquisitionCost,
    setSellingPrice,
    syncMarket,
    getMarkup,
    getMarket,
    getChange,
    catalog,
  } = usePrices()
  const { showToast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const stats = useMemo(() => {
    let softSelling = 0,
      softN = 0,
      hardSelling = 0,
      hardN = 0,
      marginSum = 0,
      marginN = 0,
      up = 0,
      down = 0
    catalog.forEach((sp) => {
      sp.dims.forEach((d) => {
        const k = `${sp.key}|${d}`
        const entry = prices[k]
        const selling = entry?.sellingPrice ?? 0
        const markup = getMarkup(sp.key, d)
        const ch = getChange(sp.key, d)
        if (sp.group === 'Softwood') {
          softSelling += selling
          softN++
        } else {
          hardSelling += selling
          hardN++
        }
        if (markup) {
          marginSum += markup.grossMarginPct
          marginN++
        }
        if (ch > 0) up++
        if (ch < 0) down++
      })
    })
    return {
      softAvg: softN ? Math.round(softSelling / softN) : 0,
      hardAvg: hardN ? Math.round(hardSelling / hardN) : 0,
      avgMargin: marginN ? marginSum / marginN : 0,
      up,
      down,
    }
  }, [catalog, prices, getMarkup, getChange])

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = (sp: (typeof catalog)[0]) =>
      (group === 'all' || sp.group === group) &&
      (q === '' || sp.name.toLowerCase().includes(q) || sp.grade.toLowerCase().includes(q))

    return (['Softwood', 'Hardwood'] as PriceGroup[])
      .map((g) => ({
        label: g,
        species: catalog.filter((sp) => sp.group === g && matches(sp)),
      }))
      .filter((g) => g.species.length > 0)
  }, [catalog, query, group])

  return (
    <>
      <PageHeader
        eyebrow="Price book"
        title="Board price book"
        description="Market reference, acquisition cost, and selling price — markup and gross margin update live."
        action={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              onClick={() => {
                const blob = new Blob([IMPORT_TEMPLATE_CSV], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'lumber-logic-price-template.csv'
                a.click()
                URL.revokeObjectURL(url)
              }}
            >
              Download template
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              Spreadsheet import
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const text = await file.text()
                const rows = parseCsv(text)
                const mapping = autoMapColumns(Object.keys(rows[0] ?? {}))
                const preview = validateAndMapRows(rows, mapping)
                if (preview.rejected.length > 0) {
                  showToast(`${preview.rejected.length} row(s) rejected — valid rows only imported`)
                }
                if (preview.accepted.length === 0) {
                  showToast('No valid rows to import')
                  return
                }
                const next = applyImportToPriceBook(prices, preview.accepted)
                Object.entries(next).forEach(([k, v]) => {
                  if (v.marketPrice != null) setMarketPrice(k, v.marketPrice)
                  if (v.acquisitionCost != null) setAcquisitionCost(k, v.acquisitionCost)
                  if (v.sellingPrice != null) setSellingPrice(k, v.sellingPrice)
                })
                showToast(`Imported ${preview.accepted.length} price row(s)`)
                e.target.value = ''
              }}
            />
            <Button variant="secondary" icon={<IconRefresh />} onClick={syncMarket}>
              Sync market reference
            </Button>
          </div>
        }
      />

      <div className="prices-controls card-surface">
        <label className="loads-search">
          <IconSearch />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search species or grade" aria-label="Search prices" />
        </label>
        <SegmentedControl
          label="Wood group"
          options={[
            { value: 'all', label: 'All' },
            { value: 'Softwood', label: 'Softwood' },
            { value: 'Hardwood', label: 'Hardwood' },
          ]}
          value={group}
          onChange={setGroup}
        />
      </div>

      <div className="price-stats">
        <div className="price-stat card-surface">
          <span>Softwood avg selling</span>
          <strong>{money(stats.softAvg)}</strong>
        </div>
        <div className="price-stat card-surface">
          <span>Hardwood avg selling</span>
          <strong>{money(stats.hardAvg)}</strong>
        </div>
        <div className="price-stat card-surface">
          <span>Avg gross margin</span>
          <strong className="price-stat--green">{stats.avgMargin.toFixed(1)}%</strong>
        </div>
        <div className="price-stat card-surface">
          <span>Movers up</span>
          <strong className="price-stat--green">{stats.up}</strong>
        </div>
        <div className="price-stat card-surface">
          <span>Movers down</span>
          <strong className="price-stat--clay">{stats.down}</strong>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="empty-state">No species match your search.</div>
      ) : (
        groups.map((grp) => (
          <section key={grp.label} className="price-group">
            <div className="price-group__head">
              <h2>{grp.label}</h2>
              <span>{grp.species.length} species</span>
            </div>
            <div className="price-species-grid">
              {grp.species.map((sp) => (
                <article key={sp.key} className="species-card card-surface">
                  <div className="species-card__head">
                    <span className="dim-block__swatch" style={{ background: sp.accent }} />
                    <div>
                      <h3>{sp.name}</h3>
                      <span className="species-card__grade">{sp.grade}</span>
                    </div>
                    <span className="species-card__updated">Upd {dateLabel(sp.updated)}</span>
                  </div>
                  {sp.dims.map((d) => {
                    const k = `${sp.key}|${d}`
                    const entry = prices[k] ?? { marketPrice: null, acquisitionCost: null, sellingPrice: null }
                    const mk = entry.marketPrice ?? getMarket(sp.key, d)
                    const ch = getChange(sp.key, d)
                    const markup = getMarkup(sp.key, d)
                    const dcol = ch > 0 ? '#2F6342' : ch < 0 ? '#B5482F' : '#A99B86'
                    return (
                      <div key={d} className="species-row">
                        <span className="species-row__dim">{d}</span>
                        <label className="species-row__your">
                          <span>Market</span>
                          <input
                            type="number"
                            value={entry.marketPrice ?? ''}
                            placeholder={String(mk || '')}
                            onChange={(e) => setMarketPrice(k, parseNum(e.target.value) || null)}
                          />
                        </label>
                        <label className="species-row__your">
                          <span>Acquisition</span>
                          <input
                            type="number"
                            value={entry.acquisitionCost ?? ''}
                            onChange={(e) => setAcquisitionCost(k, parseNum(e.target.value) || null)}
                          />
                        </label>
                        <label className="species-row__your">
                          <span>Selling</span>
                          <input
                            type="number"
                            value={entry.sellingPrice ?? ''}
                            onChange={(e) => setSellingPrice(k, parseNum(e.target.value) || null)}
                          />
                        </label>
                        <div className="species-row__market">
                          <span>{money(mk)}</span>
                          <span style={{ color: dcol }}>
                            {ch === 0 ? 'unch' : ch > 0 ? `+${ch}` : `−${Math.abs(ch)}`}
                          </span>
                        </div>
                        <span className="species-row__margin species-row__margin--pos">
                          {formatMarkup(markup)} / {formatMargin(markup)}
                        </span>
                      </div>
                    )
                  })}
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </>
  )
}
