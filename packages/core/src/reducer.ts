import type {
  ActivityEvent,
  EvolutionRule,
  PetState,
  Tunables,
} from './types.js'
import { computeActiveTime } from './xp.js'
import { accrueCareMisses } from './care-miss.js'
import { isReadyToEvolve, matchBranch, nextStage } from './evolution.js'

export type InitArgs = {
  now: number
  petId: string
}

export function initialState({ now, petId }: InitArgs): PetState {
  return {
    schemaVersion: 1,
    petId,
    bornAt: now,
    digimonId: 'egg',
    stage: 'egg',
    xp: { totalActiveSec: 0, inStageActiveSec: 0 },
    careMiss: { inStageCount: 0, lifetimeCount: 0, accountedForCurrentIdle: 0 },
    lastActiveAt: now,
    lastReducedEventTs: 0,
    evolutionHistory: [],
  }
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
  while (!next.rip && next.stage !== 'perfect') {
    const rule = evolutionRules.find((r) => r.from === next.digimonId)
    if (!rule || !isReadyToEvolve(rule, next.xp.inStageActiveSec)) break
    const branch = matchBranch(rule, next.careMiss.inStageCount)
    next = {
      ...next,
      evolutionHistory: [
        ...next.evolutionHistory,
        {
          at: now,
          from: next.digimonId,
          to: branch.to,
          careMissAtEvolve: next.careMiss.inStageCount,
          branch: branch.branch,
        },
      ],
      digimonId: branch.to,
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
