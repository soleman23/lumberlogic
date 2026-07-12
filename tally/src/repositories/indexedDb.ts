import type { SavedLoad, PriceBookStore, TallyState } from '../types'
import type { CompanySettings, QuoteRevision, SyncOutboxEntry } from '../domain/types'

const DB_NAME = 'lumber-logic'
const DB_VERSION = 1

type StoreName = 'loads' | 'tally' | 'prices' | 'settings' | 'quoteRevisions' | 'syncOutbox' | 'meta'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('loads')) db.createObjectStore('loads', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('tally')) db.createObjectStore('tally', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('prices')) db.createObjectStore('prices', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('quoteRevisions')) db.createObjectStore('quoteRevisions', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('syncOutbox')) db.createObjectStore('syncOutbox', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' })
    }
  })
}

async function put<T extends { id: string }>(store: StoreName, value: T): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).put(value)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function getAll<T>(store: StoreName): Promise<T[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const req = tx.objectStore(store).getAll()
    req.onsuccess = () => resolve(req.result as T[])
    req.onerror = () => reject(req.error)
  })
}

export const indexedDbRepository = {
  async saveLoad(load: SavedLoad): Promise<void> {
    await put('loads', load)
  },
  async listLoads(): Promise<SavedLoad[]> {
    return getAll<SavedLoad>('loads')
  },
  async saveTally(state: TallyState): Promise<void> {
    await put('tally', { id: 'worksheet', ...state } as TallyState & { id: string })
  },
  async savePrices(prices: PriceBookStore): Promise<void> {
    await put('prices', { id: 'pricebook', entries: prices } as { id: string; entries: PriceBookStore })
  },
  async saveSettings(settings: CompanySettings): Promise<void> {
    await put('settings', { ...settings, id: 'company' } as CompanySettings & { id: string })
  },
  async saveQuoteRevision(revision: QuoteRevision): Promise<void> {
    await put('quoteRevisions', revision)
  },
  async enqueueSync(entry: SyncOutboxEntry): Promise<void> {
    await put('syncOutbox', entry)
  },
  async exportBackup(): Promise<string> {
    const [loads, revisions] = await Promise.all([
      getAll<SavedLoad>('loads'),
      getAll<QuoteRevision>('quoteRevisions'),
    ])
    return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), loads, revisions }, null, 2)
  },
  async importBackup(json: string): Promise<{ loads: number; revisions: number }> {
    const data = JSON.parse(json) as { loads?: SavedLoad[]; revisions?: QuoteRevision[] }
    let loads = 0
    let revisions = 0
    for (const load of data.loads ?? []) {
      await put('loads', load)
      loads++
    }
    for (const rev of data.revisions ?? []) {
      await put('quoteRevisions', rev)
      revisions++
    }
    return { loads, revisions }
  },
}
