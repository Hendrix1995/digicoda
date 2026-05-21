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
  it('reaches adult stage with light branch', () => {
    let state = initialState({ now: 1_000_000, petId: 'scenario-1' })
    // 600 events × 60s gap = ~36000s of dense activity
    // egg(300) + baby(3600) + child(28800) = 32700s 필요. 36000 > 32700 → adult 도달.
    const events = densePromptStream(1_000_001, 600)
    state = reduce(state, events, {
      now: 1_000_000 + 36000,
      tunables: DEFAULT_TUNABLES,
      evolutionRules: rules,
    })
    expect(state.stage).toBe('adult')
  })
})

describe('scenario: neglect → dark branch', () => {
  it('produces dark branch after 5+ care misses', () => {
    let state = initialState({ now: 1_000_000, petId: 'scenario-2' })

    // Phase 1: dense child progression
    state = reduce(state, densePromptStream(1_000_001, 70), {
      now: 1_000_000 + 4200,
      tunables: DEFAULT_TUNABLES,
      evolutionRules: rules,
    })
    expect(state.stage).toBe('child')

    // Phase 2: 6 days of neglect → 6 care miss accrued in-stage
    state = reduce(state, [], {
      now: 1_000_000 + 4200 + 6 * 86400,
      tunables: DEFAULT_TUNABLES,
      evolutionRules: rules,
    })
    expect(state.careMiss.inStageCount).toBeGreaterThanOrEqual(5)

    // Phase 3: 9h dense coding → child(=agumon)→ adult(devimon, dark, careMiss=6)
    const burstStart = 1_000_000 + 4200 + 6 * 86400 + 10
    state = reduce(state, densePromptStream(burstStart, 540), {
      now: burstStart + 32400,
      tunables: DEFAULT_TUNABLES,
      evolutionRules: rules,
    })
    expect(state.stage).toBe('adult')
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
