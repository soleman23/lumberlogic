import { DIMENSION_DEFS, HARDWOOD_DEFS } from './constants'
import { SPECIES_CATALOG } from './priceData'
import { effectivePrice } from './tallyMath'
import type { QuoteLine, TallyState } from '../types'
import { tallyToLines } from '../domain/adapters/tallyAdapter'
import { lineBoardFeet } from '../domain/pricing'

function speciesEntry(species: string) {
  return SPECIES_CATALOG.find((s) => s.name === species || species.startsWith(s.name))
}

export function tallyToQuoteLines(state: TallyState, species: string): QuoteLine[] {
  const entry = speciesEntry(species)
  const grade = entry?.grade ?? '#2 & Btr'
  const lines = tallyToLines(state, species, grade)

  return lines.map((line) => {
    if (line.materialType === 'hardwood') {
      const h = HARDWOOD_DEFS.find((x) => x.id === line.thickness)
      return {
        lineId: line.id,
        species: line.species,
        grade: line.grade,
        t: 0,
        w: 0,
        lenFt: 0,
        pcs: 0,
        mbf: Math.round(line.sellingPrice ?? 0),
        bf: Math.round(line.directBf),
        dims: `${h?.label ?? line.thickness} · RW`,
      }
    }
    const def = DIMENSION_DEFS.find((d) => d.name === line.dimension)!
    const pcs = line.units * line.piecesPerUnit
    const bf = lineBoardFeet(line)
    const mbf = line.sellingPrice ?? effectivePrice(state, line.dimension, line.lengthFt)
    return {
      lineId: line.id,
      species: line.species,
      grade: line.grade,
      t: def.t,
      w: def.w,
      lenFt: line.lengthFt,
      pcs: Math.round(pcs),
      mbf: Math.round(mbf),
      bf,
    }
  })
}

export function quoteLinesOrEmpty(state: TallyState, species: string): QuoteLine[] {
  const entry = SPECIES_CATALOG.find((s) => s.name === species || species.startsWith(s.name))
  const allLines = tallyToQuoteLines(state, species)
  if (entry?.group === 'Hardwood') {
    return allLines.filter((l) => l.dims?.includes('RW') || l.bf != null && l.pcs === 0)
  }
  return allLines.filter((l) => (l.bf ?? 0) > 0 && l.mbf > 0)
}
