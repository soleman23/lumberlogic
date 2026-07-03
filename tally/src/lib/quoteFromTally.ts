import { DIMENSION_DEFS, HARDWOOD_DEFS, LENGTHS, cellKey } from './constants'
import { DEFAULT_QUOTE_LINES, SPECIES_CATALOG } from './priceData'
import { effectivePrice } from './tallyMath'
import type { QuoteLine, SpeciesDef, TallyState } from '../types'

function speciesEntry(species: string): SpeciesDef | undefined {
  return SPECIES_CATALOG.find((s) => s.name === species || species.startsWith(s.name))
}

/** One line per hardwood thickness with board feet on the worksheet. */
function hardwoodQuoteLines(state: TallyState, species: string, grade: string): QuoteLine[] {
  const lines: QuoteLine[] = []
  HARDWOOD_DEFS.forEach((h) => {
    const entry = state.hardwood[h.id]
    if (!entry || entry.bf <= 0) return
    lines.push({
      species,
      grade,
      t: 0,
      w: 0,
      lenFt: 0,
      pcs: 0,
      mbf: Math.round(entry.price),
      bf: Math.round(entry.bf),
      dims: `${h.label} · RW`,
    })
  })
  return lines
}

function dimensionalQuoteLines(state: TallyState, species: string, grade: string): QuoteLine[] {
  const lines: QuoteLine[] = []
  DIMENSION_DEFS.forEach((d) => {
    LENGTHS.forEach((L) => {
      const units = state.units[cellKey(d.name, L)] || 0
      if (units <= 0) return
      const pcs = units * (state.pieces[d.name] || 0)
      if (pcs <= 0) return
      const mbf = effectivePrice(state, d.name, L)
      lines.push({
        species,
        grade,
        t: d.t,
        w: d.w,
        lenFt: L,
        pcs: Math.round(pcs),
        mbf: Math.round(mbf),
      })
    })
  })
  return lines
}

export function tallyToQuoteLines(state: TallyState, species: string): QuoteLine[] {
  const entry = speciesEntry(species)

  // Hardwoods are random-width 4/4-8/4 stock tallied directly in board feet.
  if (entry?.group === 'Hardwood') {
    const lines = hardwoodQuoteLines(state, species, entry.grade)
    return lines.length > 0 ? lines : DEFAULT_QUOTE_LINES
  }

  const grade = entry?.grade ?? '#2 & Btr'
  const dimLines = dimensionalQuoteLines(state, species, grade)
  const hwLines = hardwoodQuoteLines(state, species, 'Random width')
  const combined = [...dimLines, ...hwLines]

  return combined.length > 0 ? combined : DEFAULT_QUOTE_LINES
}
