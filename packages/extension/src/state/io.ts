import * as fs from 'node:fs'
import { randomUUID } from 'node:crypto'
import type { ActivityEvent, DigicodaConfig, PetState } from '@digicoda/core'
import { initialState, PET_PERSONALITIES } from '@digicoda/core'
import { PATHS } from './paths.js'

function randomPersonality() {
  return PET_PERSONALITIES[Math.floor(Math.random() * PET_PERSONALITIES.length)]
}

export function ensureDirs(): void {
  fs.mkdirSync(PATHS.dir, { recursive: true })
  fs.mkdirSync(PATHS.hooksDir, { recursive: true })
  fs.mkdirSync(PATHS.logsDir, { recursive: true })
}

export function loadState(): PetState {
  ensureDirs()
  if (!fs.existsSync(PATHS.state)) {
    const fresh = initialState({
      now: Math.floor(Date.now() / 1000),
      petId: randomUUID(),
      seedEggVariant: 1 + Math.floor(Math.random() * 11),
      personality: randomPersonality(),
    })
    saveState(fresh)
    return fresh
  }
  try {
    const loaded = JSON.parse(fs.readFileSync(PATHS.state, 'utf-8')) as PetState
    let dirty = false
    // Back-fill seedEggVariant for pre-feature pets still in egg stage so they
    // hatch into one of the three lineages instead of always 'koromon'.
    if (loaded.stage === 'egg' && loaded.seedEggVariant == null) {
      loaded.seedEggVariant = 1 + Math.floor(Math.random() * 11)
      dirty = true
    }
    // Back-fill personality so the next evolution gets variant from the trait.
    if (loaded.personality == null) {
      loaded.personality = randomPersonality()
      dirty = true
    }
    if (dirty) saveState(loaded)
    return loaded
  } catch (e) {
    console.error('[digicoda] state.json corrupted, regenerating:', e)
    const fresh = initialState({
      now: Math.floor(Date.now() / 1000),
      petId: randomUUID(),
      seedEggVariant: 1 + Math.floor(Math.random() * 11),
      personality: randomPersonality(),
    })
    saveState(fresh)
    return fresh
  }
}

export function saveState(state: PetState): void {
  ensureDirs()
  const tmp = PATHS.state + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2))
  fs.renameSync(tmp, PATHS.state)
}

export function appendEvent(event: ActivityEvent): void {
  ensureDirs()
  fs.appendFileSync(PATHS.events, JSON.stringify(event) + '\n')
}

export function readEventsSince(ts: number): ActivityEvent[] {
  if (!fs.existsSync(PATHS.events)) return []
  const raw = fs.readFileSync(PATHS.events, 'utf-8')
  const events: ActivityEvent[] = []
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      const e = JSON.parse(trimmed) as ActivityEvent
      if (typeof e.ts === 'number' && e.ts > ts) events.push(e)
    } catch {
      // skip corrupted lines
    }
  }
  return events
}

const DEFAULT_CONFIG: DigicodaConfig = {
  schemaVersion: 1,
  ui: { primary: 'sidebar', statusBar: true },
  notifications: { evolveAlert: true },
}

export function loadConfig(): DigicodaConfig {
  ensureDirs()
  if (!fs.existsSync(PATHS.config)) {
    saveConfig(DEFAULT_CONFIG)
    return { ...DEFAULT_CONFIG }
  }
  try {
    return JSON.parse(fs.readFileSync(PATHS.config, 'utf-8')) as DigicodaConfig
  } catch {
    saveConfig(DEFAULT_CONFIG)
    return { ...DEFAULT_CONFIG }
  }
}

export function saveConfig(config: DigicodaConfig): void {
  ensureDirs()
  const tmp = PATHS.config + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(config, null, 2))
  fs.renameSync(tmp, PATHS.config)
}

export function appendGraveyard(state: PetState): void {
  ensureDirs()
  fs.appendFileSync(PATHS.graveyard, JSON.stringify(state) + '\n')
}
