import { describe, it, expect } from 'vitest'
import { initialState, reduce } from './reducer.js'
import type { ActivityEvent, EvolutionRule } from './types.js'
import { DEFAULT_TUNABLES } from './types.js'

const evolutionRules: EvolutionRule[] = [
  {
    from: 'egg',
    xpRequiredSec: 300, // 5 minutes
    branches: [
      { branch: 'light', careMissMin: 0, careMissMax: 0, to: 'koromon' },
      { branch: 'standard', careMissMin: 1, careMissMax: 999, to: 'koromon' },
      { branch: 'dark', careMissMin: 999, careMissMax: 999, to: 'koromon' },
    ],
  },
]

const ev = (ts: number, kind = 'tick'): ActivityEvent => ({ ts, src: 'vscode', kind })

describe('initialState', () => {
  it('starts with egg, schemaVersion 1, zero XP', () => {
    const s = initialState({ now: 1000, petId: 'p1' })
    expect(s.schemaVersion).toBe(1)
    expect(s.stage).toBe('egg')
    expect(s.digimonId).toBe('egg')
    expect(s.xp.totalActiveSec).toBe(0)
    expect(s.xp.inStageActiveSec).toBe(0)
    expect(s.careMiss.inStageCount).toBe(0)
    expect(s.bornAt).toBe(1000)
    expect(s.petId).toBe('p1')
    expect(s.evolutionHistory).toEqual([])
    expect(s.rip).toBeUndefined()
  })
})

describe('reduce', () => {
  it('returns state unchanged for empty new events', () => {
    const s0 = initialState({ now: 1000, petId: 'p1' })
    const s1 = reduce(s0, [], { now: 1500, tunables: DEFAULT_TUNABLES, evolutionRules })
    expect(s1.xp.totalActiveSec).toBe(0)
  })

  it('accumulates XP from events', () => {
    const s0 = initialState({ now: 1000, petId: 'p1' })
    const events = [ev(1100), ev(1160)] // SEED 30 + 60 = 90s
    const s1 = reduce(s0, events, { now: 1200, tunables: DEFAULT_TUNABLES, evolutionRules })
    expect(s1.xp.totalActiveSec).toBe(90)
    expect(s1.xp.inStageActiveSec).toBe(90)
    expect(s1.lastActiveAt).toBe(1160)
  })

  it('is idempotent — replaying same events does not double-count', () => {
    const s0 = initialState({ now: 1000, petId: 'p1' })
    const events = [ev(1100), ev(1160)]
    const s1 = reduce(s0, events, { now: 1200, tunables: DEFAULT_TUNABLES, evolutionRules })
    const s2 = reduce(s1, events, { now: 1300, tunables: DEFAULT_TUNABLES, evolutionRules })
    expect(s2.xp.totalActiveSec).toBe(s1.xp.totalActiveSec)
  })

  it('triggers evolution when threshold reached', () => {
    const s0 = initialState({ now: 1000, petId: 'p1' })
    // 20 events spaced 60s → 19 gaps × 60s = 1140 active seconds
    const events: ActivityEvent[] = []
    for (let i = 0; i < 20; i++) events.push(ev(1000 + i * 60))
    const s1 = reduce(s0, events, { now: 2500, tunables: DEFAULT_TUNABLES, evolutionRules })
    // Egg now hatches into Fresh (Baby I). Local test rule names 'koromon' as
    // the destination for simplicity; reducer doesn't validate stage/digimonId pairing.
    expect(s1.stage).toBe('fresh')
    expect(s1.digimonId).toBe('koromon')
    expect(s1.evolutionHistory.length).toBe(1)
    // 잉여 XP는 다음 스테이지로 이월: 1140 - 300(egg threshold) = 840
    expect(s1.xp.inStageActiveSec).toBeGreaterThan(0)
  })

  it('accrues care miss when long elapsed without events', () => {
    const s0 = initialState({ now: 1000, petId: 'p1' })
    // Plant an event to set lastActiveAt
    const s1 = reduce(s0, [ev(1000)], {
      now: 1001,
      tunables: DEFAULT_TUNABLES,
      evolutionRules,
    })
    // Jump 2 care-windows ahead with no events → should accrue exactly 2 misses.
    const window = DEFAULT_TUNABLES.CARE_MISS_WINDOW_SEC
    const s2 = reduce(s1, [], {
      now: 1000 + 2 * window,
      tunables: DEFAULT_TUNABLES,
      evolutionRules,
    })
    expect(s2.careMiss.inStageCount).toBe(2)
    expect(s2.careMiss.lifetimeCount).toBe(2)
  })
})
