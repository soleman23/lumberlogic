import { DIMENSION_DEFS, LENGTHS, cellKey } from './constants'
import { DEFAULT_QUOTE_LINES, SPECIES_CATALOG } from './priceData'
import { effectivePrice } from './tallyMath'
import type { QuoteLine, SpeciesDef, TallyState } from '../types'

function speciesEntry(species: string): SpeciesDef | undefined {
  return SPECIES_CATALOG.find((s) => s.name === species || species.startsWith(s.name))
}

export function tallyToQuoteLines(state: TallyState, species: string): QuoteLine[] {
  const entry = speciesEntry(species)
  // The tally worksheet only models 2x dimensional lumber; hardwoods are
  // sold as 4/4-8/4 stock it can't represent, so don't fabricate dims.
  if (entry?.group === 'Hardwood') return DEFAULT_QUOTE_LINES

  const lines: QuoteLine[] = []
  const grade = entry?.grade ?? '#2 & Btr'

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

  return lines.length > 0 ? lines : DEFAULT_QUOTE_LINES
}
