import type { EvolutionBranch, EvolutionRule, Stage } from './types.js'

export function isReadyToEvolve(rule: EvolutionRule, inStageActiveSec: number): boolean {
  return inStageActiveSec >= rule.xpRequiredSec
}

export function matchBranch(rule: EvolutionRule, careMissCount: number): EvolutionBranch {
  const match = rule.branches.find(
    (b) => careMissCount >= b.careMissMin && careMissCount <= b.careMissMax,
  )
  if (!match) {
    throw new Error(
      `No branch matches careMiss=${careMissCount} for rule from=${rule.from}. ` +
        `Branches must collectively cover all non-negative integers.`,
    )
  }
  return match
}

export function nextStage(stage: Stage): Stage {
  switch (stage) {
    case 'egg':
      return 'fresh'
    case 'fresh':
      return 'baby'
    case 'baby':
      return 'child'
    case 'child':
      return 'adult'
    case 'adult':
      return 'perfect'
    case 'perfect':
      return 'mega'
    case 'mega':
      return 'mega'
  }
}
