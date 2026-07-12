import { useMemo } from 'react'
import { usePrices } from '../context/PricesContext'
import { dateLabel, money, parseNum } from '../lib/formatters'
import { IconRefresh, IconSearch } from '../components/Icons'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/Button'
import { SegmentedControl } from '../components/SegmentedControl'
import type { PriceGroup } from '../types'
import './PricesScreen.css'

export function PricesScreen() {
  const { prices, query, group, setQuery, setGroup, setYourPrice, syncMarket, getMargin, getMarket, getChange, catalog } =
    usePrices()
  const stats = useMemo(() => {
    let softSum = 0,
      softN = 0,
      hardSum = 0,
      hardN = 0,
      marginSum = 0,
      marginN = 0,
      up = 0,
      down = 0
    catalog.forEach((sp) => {
      sp.dims.forEach((d) => {
        const k = `${sp.key}|${d}`
        const your = prices[k] || 0
        const ch = getChange(sp.key, d)
        if (sp.group === 'Softwood') {
          softSum += your
          softN++
        } else {
          hardSum += your
          hardN++
        }
        marginSum += getMargin(sp.key, d)
        marginN++
        if (ch > 0) up++
        if (ch < 0) down++
      })
    })
    return {
      softAvg: softN ? Math.round(softSum / softN) : 0,
      hardAvg: hardN ? Math.round(hardSum / hardN) : 0,
      avgMargin: marginN ? marginSum / marginN : 0,
      up,
      down,
    }
  }, [catalog, prices, getMargin, getChange])

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
        eyebrow="Price sheet · week of Jun 29"
        title="Board price book"
        description="Your $/MBF vs market — margins update live."
        action={
          <Button variant="secondary" icon={<IconRefresh />} onClick={syncMarket}>
            Sync market
          </Button>
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
          <span>Softwood avg</span>
          <strong>{money(stats.softAvg)}</strong>
        </div>
        <div className="price-stat card-surface">
          <span>Hardwood avg</span>
          <strong>{money(stats.hardAvg)}</strong>
        </div>
        <div className="price-stat card-surface">
          <span>Avg margin</span>
          <strong className="price-stat--green">+{stats.avgMargin.toFixed(1)}%</strong>
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
                    const your = prices[k] || 0
                    const mk = getMarket(sp.key, d)
                    const ch = getChange(sp.key, d)
                    const margin = getMargin(sp.key, d)
                    const dcol = ch > 0 ? '#2F6342' : ch < 0 ? '#B5482F' : '#A99B86'
                    return (
                      <div key={d} className="species-row">
                        <span className="species-row__dim">{d}</span>
                        <label className="species-row__your">
                          <span>Your $</span>
                          <input
                            type="number"
                            value={your || ''}
                            onChange={(e) => setYourPrice(k, parseNum(e.target.value))}
                          />
                        </label>
                        <div className="species-row__market">
                          <span>{money(mk)}</span>
                          <span style={{ color: dcol }}>
                            {ch === 0 ? 'unch' : ch > 0 ? `+${ch}` : `−${Math.abs(ch)}`}
                          </span>
                        </div>
                        <span className={`species-row__margin ${margin >= 0 ? 'species-row__margin--pos' : 'species-row__margin--neg'}`}>
                          {margin >= 0 ? '+' : '−'}
                          {Math.abs(margin).toFixed(1)}%
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
