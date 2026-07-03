import type { SavedLoad } from '../types'

/** Deterministic quote number derived from the load's date and id. */
export function quoteNumberFor(load: SavedLoad): string {
  const year = load.date.slice(0, 4) || String(new Date().getFullYear())
  const frag = load.id
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 4)
    .toUpperCase()
    .padStart(4, '0')
  return `Q-${year}-${frag}`
}

/** ISO date (YYYY-MM-DD) 14 days after `from` (defaults to today). */
export function defaultValidUntil(from = new Date()): string {
  const d = new Date(from)
  d.setDate(d.getDate() + 14)
  return d.toISOString().slice(0, 10)
}

/** Generic customer message built from the load's own details. */
export function defaultQuoteMessage(load: SavedLoad): string {
  return (
    `Thanks for the chance to quote ${load.sub}. Pricing below covers the ` +
    `${load.species} load FOB our Bend yard. These numbers hold through the ` +
    `valid-through date — give us a call if you'd like to adjust counts or lengths.`
  )
}
