import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLoads } from '../context/LoadsContext'
import { useToast } from '../context/ToastContext'
import type { LoadStatus, SavedLoad } from '../types'
import { dateLabel, fmt, initials, money } from '../lib/formatters'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/Button'
import { SegmentedControl } from '../components/SegmentedControl'
import './SavedLoadsScreen.css'

type SortKey = 'date' | 'value' | 'bf' | 'pieces' | 'customer'
type SortDir = 'asc' | 'desc'

export function SavedLoadsScreen() {
  const { loads, deleteLoad, duplicateLoad, openLoad } = useLoads()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | LoadStatus>('All')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = loads.filter((l) => {
      if (statusFilter !== 'All' && l.status !== statusFilter) return false
      if (q && !(l.name.toLowerCase().includes(q) || l.species.toLowerCase().includes(q) || l.sub.toLowerCase().includes(q)))
        return false
      return true
    })
    list = [...list].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'date':
          cmp = a.date.localeCompare(b.date)
          break
        case 'value':
          cmp = a.value - b.value
          break
        case 'bf':
          cmp = a.bf - b.bf
          break
        case 'pieces':
          cmp = a.pieces - b.pieces
          break
        case 'customer':
          cmp = a.name.localeCompare(b.name)
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [loads, query, statusFilter, sortKey, sortDir])

  const handleOpen = (load: SavedLoad) => {
    openLoad(load.id)
    navigate('/')
    showToast(`Opened ${load.name}`)
  }

  const handleSend = (load: SavedLoad) => {
    navigate(`/send/${load.id}`)
  }

  return (
    <>
      <PageHeader
        eyebrow="Saved loads"
        title="Your tally book"
        description="Search, filter, and reopen saved loads."
        action={
          <Button variant="primary" onClick={() => navigate('/')}>
            + New load
          </Button>
        }
      />

      <div className="loads-controls card-surface">
        <label className="loads-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="#8C7E6B" strokeWidth="1.8" />
            <path d="M16 16l5 5" stroke="#8C7E6B" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customer or species"
            aria-label="Search loads"
          />
        </label>

        <SegmentedControl
          label="Status filter"
          options={[
            { value: 'All', label: 'All' },
            { value: 'Quoted', label: 'Quoted' },
            { value: 'Draft', label: 'Draft' },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />

        <div className="loads-sort">
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} aria-label="Sort by">
            <option value="date">Date saved</option>
            <option value="value">Load value</option>
            <option value="bf">Board ft</option>
            <option value="pieces">Pieces</option>
            <option value="customer">Customer</option>
          </select>
          <button
            type="button"
            className="loads-sort__dir"
            aria-label="Toggle sort direction"
            onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
            style={{ transform: sortDir === 'asc' ? 'rotate(180deg)' : undefined }}
          >
            ↓
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">No loads match your search.</div>
      ) : (
        <div className="loads-grid">
          {filtered.map((load) => (
            <article key={load.id} className="load-card card-surface">
              <div className="load-card__head">
                <div className="load-card__avatar">{initials(load.name)}</div>
                <div className="load-card__meta">
                  <h3>{load.name}</h3>
                  <p>
                    {load.sub} · {load.species}
                  </p>
                </div>
                <span className={`load-card__status load-card__status--${load.status.toLowerCase()}`}>{load.status}</span>
              </div>
              <div className="load-card__figures">
                <div>
                  <span>Board feet</span>
                  <strong>{fmt(load.bf, 0)}</strong>
                </div>
                <div>
                  <span>Value</span>
                  <strong className="load-card__value">{money(load.value)}</strong>
                </div>
              </div>
              <div className="load-card__stats">
                <div>
                  <span>Pieces</span>
                  <strong>{fmt(load.pieces, 0)}</strong>
                </div>
                <div>
                  <span>Saved</span>
                  <strong>{dateLabel(load.date)}</strong>
                </div>
                <div>
                  <span>Ref</span>
                  <strong>{load.sub}</strong>
                </div>
              </div>
              <div className="load-card__actions">
                <Button variant="secondary" size="sm" onClick={() => handleOpen(load)}>
                  Open
                </Button>
                <Button variant="primary" size="sm" onClick={() => handleSend(load)}>
                  Send
                </Button>
                <Button
                  variant="icon"
                  size="sm"
                  aria-label="Duplicate"
                  onClick={() => {
                    duplicateLoad(load.id)
                    showToast('Load duplicated as Draft')
                  }}
                >
                  ⧉
                </Button>
                <Button
                  variant="icon"
                  size="sm"
                  aria-label="Delete"
                  onClick={() => {
                    deleteLoad(load.id)
                    showToast('Load deleted')
                  }}
                >
                  ✕
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
