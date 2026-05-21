import { describe, it, expect } from 'vitest'
import { matchBranch, isReadyToEvolve } from './evolution.js'
import type { EvolutionRule } from './types.js'

const rule: EvolutionRule = {
  from: 'agumon',
  xpRequiredSec: 28800,
  branches: [
    { branch: 'light', careMissMin: 0, careMissMax: 1, to: 'angemon' },
    { branch: 'standard', careMissMin: 2, careMissMax: 4, to: 'greymon' },
    { branch: 'dark', careMissMin: 5, careMissMax: 999, to: 'devimon' },
  ],
}

describe('matchBranch', () => {
  it('matches light branch at careMiss=0', () => {
    expect(matchBranch(rule, 0)).toEqual(rule.branches[0])
  })

  it('matches light branch at careMiss=1 (inclusive max)', () => {
    expect(matchBranch(rule, 1)).toEqual(rule.branches[0])
  })

  it('matches standard branch at careMiss=2', () => {
    expect(matchBranch(rule, 2)).toEqual(rule.branches[1])
  })

  it('matches dark branch at careMiss=5', () => {
    expect(matchBranch(rule, 5)).toEqual(rule.branches[2])
  })

  it('matches dark branch at high careMiss', () => {
    expect(matchBranch(rule, 100)).toEqual(rule.branches[2])
  })

  it('throws when no branch matches', () => {
    const broken: EvolutionRule = { ...rule, branches: [rule.branches[0]!] }
    expect(() => matchBranch(broken, 99)).toThrow()
  })
})

describe('isReadyToEvolve', () => {
  it('false when inStageActiveSec < required', () => {
    expect(isReadyToEvolve(rule, 28799)).toBe(false)
  })

  it('true when inStageActiveSec >= required', () => {
    expect(isReadyToEvolve(rule, 28800)).toBe(true)
    expect(isReadyToEvolve(rule, 50000)).toBe(true)
  })
})
