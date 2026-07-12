import type { SavedLoad, TallyState } from '../../types'
import { normalizeTallyState, createEmptyTallyState } from '../../lib/constants'
import { SEED_LOADS } from '../../lib/priceData'
import { SCHEMA_VERSION } from '../types'

const MIGRATION_KEY = 'lumber-logic-migration-v'
const DEMO_SEED_NAMES = new Set(SEED_LOADS.map((l) => l.name))

export type MigrationResult<T> = {
  data: T
  migrated: boolean
  warnings: string[]
}

function isLegacyDemoLoad(load: SavedLoad): boolean {
  if (load.isDemo) return true
  if (load.id && /^\d+$/.test(load.id) && DEMO_SEED_NAMES.has(load.name)) return true
  return false
}

export function migrateLoads(raw: SavedLoad[]): MigrationResult<SavedLoad[]> {
  const warnings: string[] = []
  let migrated = false

  const result = raw
    .filter((load) => {
      if (isLegacyDemoLoad(load)) {
        warnings.push(`Removed demo load: ${load.name}`)
        migrated = true
        return false
      }
      return true
    })
    .map((load) => {
      const next: SavedLoad = {
        ...load,
        schemaVersion: SCHEMA_VERSION,
        createdAt: load.createdAt ?? load.date,
        updatedAt: load.updatedAt ?? load.date,
        freight: load.freight ?? 0,
      }
      if (load.tally) {
        next.tally = normalizeTallyState(load.tally)
        if (!load.schemaVersion) migrated = true
      }
      return next
    })

  return { data: result, migrated, warnings }
}

export function migrateTally(raw: TallyState | null): MigrationResult<TallyState> {
  if (!raw) {
    return { data: createEmptyTallyState(), migrated: true, warnings: ['Initialized empty worksheet'] }
  }
  return { data: normalizeTallyState(raw), migrated: false, warnings: [] }
}

export function runStorageMigration(): string[] {
  const warnings: string[] = []
  const version = parseInt(localStorage.getItem(MIGRATION_KEY) ?? '0', 10)

  if (version < 1) {
    const raw = localStorage.getItem('lumber-logic-loads')
    if (raw) {
      try {
        const loads = JSON.parse(raw) as SavedLoad[]
        const { data, warnings: w } = migrateLoads(loads)
        localStorage.setItem('lumber-logic-loads', JSON.stringify(data))
        warnings.push(...w)
      } catch {
        warnings.push('Could not migrate loads; starting fresh')
        localStorage.removeItem('lumber-logic-loads')
      }
    }
    localStorage.setItem(MIGRATION_KEY, '1')
  }

  if (version < 2) {
    const tallyRaw = localStorage.getItem('lumber-logic-tally')
    if (tallyRaw) {
      try {
        const tally = JSON.parse(tallyRaw) as TallyState
        const hasSeedUnits = Object.values(tally.units ?? {}).some((v) => (v as number) > 0)
        if (hasSeedUnits) {
          localStorage.setItem('lumber-logic-tally', JSON.stringify(createEmptyTallyState()))
          warnings.push('Reset worksheet with demo seed units to empty state')
        }
      } catch {
        localStorage.removeItem('lumber-logic-tally')
      }
    }
    localStorage.setItem(MIGRATION_KEY, '2')
  }

  return warnings
}

export function markMigrationComplete(): void {
  localStorage.setItem(MIGRATION_KEY, String(SCHEMA_VERSION))
}
