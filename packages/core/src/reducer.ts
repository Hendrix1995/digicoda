import type {
  ActivityEvent,
  EvolutionRule,
  PetPersonality,
  PetState,
  Tunables,
} from './types.js'
import { computeActiveTime } from './xp.js'
import { accrueCareMisses } from './care-miss.js'
import { isReadyToEvolve, matchBranch, nextStage } from './evolution.js'

export type InitArgs = {
  now: number
  petId: string
  seedEggVariant?: number
  personality?: PetPersonality
}

export function initialState({ now, petId, seedEggVariant, personality }: InitArgs): PetState {
  return {
    schemaVersion: 1,
    petId,
    bornAt: now,
    ...(seedEggVariant != null ? { seedEggVariant } : {}),
    ...(personality != null ? { personality } : {}),
    digimonId: 'egg',
    stage: 'egg',
    xp: { totalActiveSec: 0, inStageActiveSec: 0 },
    careMiss: { inStageCount: 0, lifetimeCount: 0, accountedForCurrentIdle: 0 },
    lastActiveAt: now,
    lastReducedEventTs: 0,
    evolutionHistory: [],
  }
}

// Personality biases the effective careMiss when matching evolution branches.
// Negative = light bias (gentler outcomes), positive = dark bias.
const PERSONALITY_OFFSET: Record<PetPersonality, number> = {
  holy:     -2,
  gentle:   -1,
  calm:      0,
  mischief: +1,
  savage:   +2,
}

export function applyPersonalityOffset(careMiss: number, personality: PetPersonality | undefined): number {
  if (!personality) return careMiss
  return Math.max(0, careMiss + (PERSONALITY_OFFSET[personality] ?? 0))
}

// FNV-1a-based seeded RNG. Same pet+evolution-index → same [0,1) value, so the
// reducer stays pure and tests don't need a TEST_TUNABLES escape hatch — every
// pet's luck is its own fixed fate.
export function seededRandom(seed: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h / 0x100000000
}

// Egg variant (1..N) → Fresh (Baby I) digimon that hatches from it.
// Round-robin across three lineages so variant fate is stable.
//   Lineage A: Botamon → Koromon → Agumon → Greymon → MetalGreymon
//   Lineage B: Kuramon → Tsunomon → Gabumon → Garurumon → WereGarurumon
//   Lineage C: Poyomon → Tokomon → Patamon → Angemon → MagnaAngemon
const EGG_LINEAGE: Record<number, string> = {
  1: 'botamon', 2: 'kuramon', 3: 'poyomon',
  4: 'botamon', 5: 'kuramon', 6: 'poyomon',
  7: 'botamon', 8: 'kuramon', 9: 'poyomon',
  10: 'botamon', 11: 'kuramon',
}

export function freshForEggVariant(variant: number | undefined): string | undefined {
  if (variant == null) return undefined
  return EGG_LINEAGE[variant]
}

export type ReduceArgs = {
  now: number
  tunables: Tunables
  evolutionRules: EvolutionRule[]
}

export function reduce(
  prev: PetState,
  newEvents: ActivityEvent[],
  args: ReduceArgs,
): PetState {
  const { now, tunables, evolutionRules } = args

  // Filter: only events strictly newer than lastReducedEventTs (idempotency)
  const fresh = newEvents
    .filter((e) => e.ts > prev.lastReducedEventTs)
    .sort((a, b) => a.ts - b.ts)

  let next: PetState = { ...prev }

  // 1. Compute active time gained from fresh events
  if (fresh.length > 0) {
    // Compute XP from fresh events alone (SEED + inter-event gaps within ACTIVE_GAP_SEC)
    const newActive = computeActiveTime(fresh, tunables)

    next = {
      ...next,
      xp: {
        totalActiveSec: next.xp.totalActiveSec + newActive,
        inStageActiveSec: next.xp.inStageActiveSec + newActive,
      },
      lastActiveAt: fresh[fresh.length - 1]!.ts,
      lastReducedEventTs: fresh[fresh.length - 1]!.ts,
    }
  }

  // 2. Accrue care miss from time since last activity
  let careMiss = next.careMiss
  if (fresh.length > 0) {
    // 활동이 있으면 현재 idle window가 리셋됨 (이미 계상된 미스는 보존)
    careMiss = { ...careMiss, accountedForCurrentIdle: 0 }
  } else {
    const elapsedSinceActive = now - next.lastActiveAt
    const missesNow = accrueCareMisses(elapsedSinceActive, tunables)
    const delta = Math.max(0, missesNow - careMiss.accountedForCurrentIdle)
    if (delta > 0) {
      careMiss = {
        inStageCount: careMiss.inStageCount + delta,
        lifetimeCount: careMiss.lifetimeCount + delta,
        accountedForCurrentIdle: missesNow,
      }
    }
  }
  next = { ...next, careMiss }

  // 3. RIP check
  if (!next.rip && next.careMiss.inStageCount >= tunables.CARE_MISS_RIP_LIMIT) {
    next = { ...next, rip: { at: now, cause: 'neglect' } }
    return next
  }

  // 4. Evolution check (loop to handle overflow across multiple stages)
  while (!next.rip && next.stage !== 'mega') {
    const rule = evolutionRules.find((r) => r.from === next.digimonId)
    if (!rule || !isReadyToEvolve(rule, next.xp.inStageActiveSec)) break

    const effectiveCareMiss = applyPersonalityOffset(next.careMiss.inStageCount, next.personality)
    let branch = matchBranch(rule, effectiveCareMiss)

    // Lucky roll: small chance to swap to a different branch entirely. Skips
    // when the rule's branches all share the same `to` (no real alternative).
    // Uses pet-state-seeded RNG so the result is fixed for a given pet+stage
    // rather than re-rolling each time the reducer runs.
    const distinctBranches = rule.branches.filter((b) => b.to !== branch.to)
    const luckSeed = `${next.petId}:luck:${next.evolutionHistory.length}`
    if (distinctBranches.length > 0 && seededRandom(luckSeed) < tunables.LUCKY_ROLL_CHANCE) {
      const altSeed = `${next.petId}:luck-alt:${next.evolutionHistory.length}`
      const idx = Math.floor(seededRandom(altSeed) * distinctBranches.length)
      branch = distinctBranches[idx] ?? branch
    }

    // For the initial egg→fresh step, the egg variant deterministically picks
    // the lineage, overriding careMiss/personality/lucky-roll branching.
    const to = (next.digimonId === 'egg' && freshForEggVariant(next.seedEggVariant))
      || branch.to
    next = {
      ...next,
      evolutionHistory: [
        ...next.evolutionHistory,
        {
          at: now,
          from: next.digimonId,
          to,
          careMissAtEvolve: next.careMiss.inStageCount,
          branch: branch.branch,
        },
      ],
      digimonId: to,
      stage: nextStage(next.stage),
      xp: {
        ...next.xp,
        // 잉여 XP는 다음 스테이지로 이월
        inStageActiveSec: Math.max(0, next.xp.inStageActiveSec - rule.xpRequiredSec),
      },
      careMiss: { ...next.careMiss, inStageCount: 0, accountedForCurrentIdle: 0 },
    }
  }

  return next
}
