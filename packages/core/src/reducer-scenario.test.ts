import { describe, it, expect } from 'vitest'
import { initialState, reduce } from './reducer.js'
import type { ActivityEvent, EvolutionRule } from './types.js'
import { DEFAULT_TUNABLES } from './types.js'

const rules: EvolutionRule[] = [
  {
    from: 'egg',
    xpRequiredSec: 300,
    branches: [
      { branch: 'light', careMissMin: 0, careMissMax: 0, to: 'koromon' },
      { branch: 'standard', careMissMin: 1, careMissMax: 999, to: 'koromon' },
      { branch: 'dark', careMissMin: 999, careMissMax: 999, to: 'koromon' },
    ],
  },
  {
    from: 'koromon',
    xpRequiredSec: 3600,
    branches: [
      { branch: 'light', careMissMin: 0, careMissMax: 1, to: 'agumon' },
      { branch: 'standard', careMissMin: 2, careMissMax: 999, to: 'agumon' },
      { branch: 'dark', careMissMin: 999, careMissMax: 999, to: 'agumon' },
    ],
  },
  {
    from: 'agumon',
    xpRequiredSec: 28800,
    branches: [
      { branch: 'light', careMissMin: 0, careMissMax: 1, to: 'angemon' },
      { branch: 'standard', careMissMin: 2, careMissMax: 4, to: 'greymon' },
      { branch: 'dark', careMissMin: 5, careMissMax: 999, to: 'devimon' },
    ],
  },
]

function densePromptStream(startTs: number, count: number, gapSec = 60): ActivityEvent[] {
  return Array.from({ length: count }, (_, i) => ({
    ts: startTs + i * gapSec,
    src: 'claude-code',
    kind: 'prompt-submit',
  }))
}

describe('scenario: dense coding 10h with light care', () => {
  it('reaches child stage with light branch', () => {
    let state = initialState({ now: 1_000_000, petId: 'scenario-1' })
    // Test uses 3 evolution rules (egg → koromon → agumon). The reducer's stage
    // advance now inserts 'fresh' between egg and baby, so 3 evolutions land at
    // stage='child' (egg→fresh→baby→child) with digimonId='greymon'/agumon-target.
    const events = densePromptStream(1_000_001, 600)
    state = reduce(state, events, {
      now: 1_000_000 + 36000,
      tunables: DEFAULT_TUNABLES,
      evolutionRules: rules,
    })
    expect(state.stage).toBe('child')
  })
})

describe('scenario: neglect → dark branch', () => {
  it('produces dark branch after 5+ care misses', () => {
    let state = initialState({ now: 1_000_000, petId: 'scenario-2' })

    // Phase 1: dense baby progression (egg→fresh→baby with the test's 3 rules)
    state = reduce(state, densePromptStream(1_000_001, 70), {
      now: 1_000_000 + 4200,
      tunables: DEFAULT_TUNABLES,
      evolutionRules: rules,
    })
    expect(state.stage).toBe('baby')

    // Phase 2: enough idle windows to cross the 5-miss dark threshold without
    // tipping over RIP_LIMIT (12). 6 windows = 6 misses.
    const window = DEFAULT_TUNABLES.CARE_MISS_WINDOW_SEC
    const phase2Now = 1_000_000 + 4200 + 6 * window
    state = reduce(state, [], {
      now: phase2Now,
      tunables: DEFAULT_TUNABLES,
      evolutionRules: rules,
    })
    expect(state.careMiss.inStageCount).toBeGreaterThanOrEqual(5)
    expect(state.rip).toBeUndefined()

    // Phase 3: 9h dense coding → agumon evolves to devimon (dark, careMiss≥5),
    // stage advances to 'child' under the new fresh-aware tree.
    const burstStart = phase2Now + 10
    state = reduce(state, densePromptStream(burstStart, 540), {
      now: burstStart + 32400,
      tunables: DEFAULT_TUNABLES,
      evolutionRules: rules,
    })
    expect(state.stage).toBe('child')
    const lastEvo = state.evolutionHistory[state.evolutionHistory.length - 1]
    expect(lastEvo?.branch).toBe('dark')
    expect(lastEvo?.to).toBe('devimon')
  })
})

describe('scenario: long neglect → RIP', () => {
  it('triggers RIP after RIP_LIMIT care misses', () => {
    let state = initialState({ now: 1_000_000, petId: 'scenario-3' })
    state = reduce(state, densePromptStream(1_000_001, 10), {
      now: 1_000_000 + 600,
      tunables: DEFAULT_TUNABLES,
      evolutionRules: rules,
    })
    // 13 days neglect → 13 care misses, RIP_LIMIT=12
    state = reduce(state, [], {
      now: 1_000_000 + 600 + 13 * 86400,
      tunables: DEFAULT_TUNABLES,
      evolutionRules: rules,
    })
    expect(state.rip).toBeDefined()
    expect(state.rip?.cause).toBe('neglect')
  })
})
