export type Stage = 'egg' | 'baby' | 'child' | 'adult' | 'perfect'
export type Branch = 'light' | 'standard' | 'dark'
export type EventSource = 'claude-code' | 'vscode'

export type ActivityEvent = {
  ts: number          // unix epoch seconds
  src: EventSource
  kind: string
}

export type EvolutionHistoryEntry = {
  at: number
  from: string
  to: string
  careMissAtEvolve: number
  branch: Branch
}

export type PetState = {
  schemaVersion: 1
  petId: string
  bornAt: number

  digimonId: string
  stage: Stage

  xp: {
    totalActiveSec: number
    inStageActiveSec: number
  }

  careMiss: {
    inStageCount: number
    lifetimeCount: number
    accountedForCurrentIdle: number
  }

  lastActiveAt: number
  lastReducedEventTs: number

  evolutionHistory: EvolutionHistoryEntry[]

  rip?: { at: number; cause: string }
}

export type EvolutionBranch = {
  branch: Branch
  careMissMin: number
  careMissMax: number
  to: string
}

export type EvolutionRule = {
  from: string
  xpRequiredSec: number
  branches: EvolutionBranch[]
}

export type DigimonSprite = {
  idle: string
  walk?: string
  happy?: string
  sad?: string
  sleep?: string
}

export type Digimon = {
  id: string
  name: string
  stage: Stage
  sprite: DigimonSprite
  attribute?: 'vaccine' | 'data' | 'virus' | 'free'
}

export type DigicodaConfig = {
  schemaVersion: 1
  ui: {
    primary: 'panel' | 'sidebar'
    statusBar: boolean
  }
  audio?: { enabled: boolean }
  notifications: { evolveAlert: boolean }
  debug?: { logEvents: boolean }
}

export type Tunables = {
  ACTIVE_GAP_SEC: number
  SEED_SEC: number
  CARE_MISS_WINDOW_SEC: number
  CARE_MISS_RIP_LIMIT: number
}

export const DEFAULT_TUNABLES: Tunables = {
  ACTIVE_GAP_SEC: 300,
  SEED_SEC: 30,
  CARE_MISS_WINDOW_SEC: 86400,
  CARE_MISS_RIP_LIMIT: 12,
}
