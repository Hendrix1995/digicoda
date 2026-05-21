export type Stage = 'egg' | 'fresh' | 'baby' | 'child' | 'adult' | 'perfect' | 'mega'

// Birth-set trait that nudges evolution branching. Stable for the life of a pet.
export type PetPersonality = 'calm' | 'gentle' | 'holy' | 'mischief' | 'savage'

export const PET_PERSONALITIES: PetPersonality[] = [
  'calm', 'gentle', 'holy', 'mischief', 'savage',
]
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

  // 1..N — selects the egg sprite shown while stage is 'egg' and determines
  // the baby branch this pet hatches into. Optional for back-compat with
  // pets created before this field existed.
  seedEggVariant?: number

  // Stable birth trait that biases evolution branch selection (offsets the
  // effective careMiss when matching). Optional for back-compat.
  personality?: PetPersonality

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
  // [0,1) — chance that an evolution randomly picks an alternate branch
  // instead of the careMiss-derived one. Set to 0 for deterministic tests.
  LUCKY_ROLL_CHANCE: number
}

export const DEFAULT_TUNABLES: Tunables = {
  ACTIVE_GAP_SEC: 300,
  SEED_SEC: 30,
  CARE_MISS_WINDOW_SEC: 21600, // 6h — was 24h; office coders accrued too fast.
  CARE_MISS_RIP_LIMIT: 12,
  LUCKY_ROLL_CHANCE: 0.12,
}
