import { SEED_LOADS } from '../lib/priceData'
import { createDemoTallyState } from '../lib/constants'
import type { SavedLoad } from '../types'
import type { Load } from './types'
import { SCHEMA_VERSION } from './types'
import { tallyToLoad } from './adapters/tallyAdapter'

export function isDemoDataEnabled(): boolean {
  return import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_DATA === 'true'
}

export function createDemoLoads(): SavedLoad[] {
  const now = new Date().toISOString()
  return SEED_LOADS.map((l, i) => ({
    id: `demo-${i + 1}`,
    name: l.name,
    sub: l.sub,
    species: l.species,
    status: l.status,
    bf: l.bf,
    value: l.value,
    pieces: l.pieces,
    date: l.date,
    contact: l.contact,
    role: l.role,
    email: l.email,
    freight: 0,
    isDemo: true,
    schemaVersion: SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    tally: createDemoTallyState(l.species, l.bf),
  }))
}

export function createDemoDomainLoads(): Load[] {
  return createDemoLoads().map((saved) =>
    tallyToLoad(saved.tally!, {
      id: saved.id,
      name: saved.name,
      sub: saved.sub,
      species: saved.species,
      status: saved.status,
      contact: saved.contact,
      role: saved.role,
      email: saved.email,
      freight: saved.freight ?? 0,
      isDemo: true,
      createdAt: saved.createdAt ?? new Date().toISOString(),
      updatedAt: saved.updatedAt ?? new Date().toISOString(),
    }),
  )
}

export function isDemoRecord(record: { isDemo?: boolean; id?: string; name?: string }): boolean {
  if (record.isDemo) return true
  if (record.id?.startsWith('demo-')) return true
  return false
}
