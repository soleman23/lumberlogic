import type { SavedLoad, TallyState } from '../types'

const LOADS_KEY = 'lumber-logic-loads'
const TALLY_KEY = 'lumber-logic-tally'
const PRICES_KEY = 'lumber-logic-prices'

export interface LoadRepository {
  list(): SavedLoad[]
  save(load: SavedLoad): void
  saveAll(loads: SavedLoad[]): void
  delete(id: string): void
  get(id: string): SavedLoad | undefined
}

export interface TallyRepository {
  load(): TallyState | null
  save(state: TallyState): void
}

export interface PriceRepository {
  load(): Record<string, number> | null
  save(prices: Record<string, number>): void
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export const loadRepository: LoadRepository = {
  list() {
    return readJson<SavedLoad[]>(LOADS_KEY) ?? []
  },
  save(load) {
    const list = loadRepository.list()
    const i = list.findIndex((l) => l.id === load.id)
    if (i >= 0) list[i] = load
    else list.unshift(load)
    writeJson(LOADS_KEY, list)
  },
  saveAll(loads) {
    writeJson(LOADS_KEY, loads)
  },
  delete(id) {
    writeJson(LOADS_KEY, loadRepository.list().filter((l) => l.id !== id))
  },
  get(id) {
    return loadRepository.list().find((l) => l.id === id)
  },
}

export const tallyRepository: TallyRepository = {
  load() {
    return readJson<TallyState>(TALLY_KEY)
  },
  save(state) {
    writeJson(TALLY_KEY, state)
  },
}

export const priceRepository: PriceRepository = {
  load() {
    return readJson<Record<string, number>>(PRICES_KEY)
  },
  save(prices) {
    writeJson(PRICES_KEY, prices)
  },
}
