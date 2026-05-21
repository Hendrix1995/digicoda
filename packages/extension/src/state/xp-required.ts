import * as fs from 'node:fs'
import * as path from 'node:path'
import type { EvolutionRule, PetState } from '@digicoda/core'

let cache: EvolutionRule[] | null = null

function rules(): EvolutionRule[] {
  if (cache) return cache
  // At runtime, __dirname points to the dist/ directory where evolution.json was copied.
  const rulesPath = path.join(__dirname, 'data', 'evolution.json')
  cache = JSON.parse(fs.readFileSync(rulesPath, 'utf-8')) as EvolutionRule[]
  return cache
}

export function xpRequiredForStage(state: PetState): number {
  const rule = rules().find((r) => r.from === state.digimonId)
  return rule?.xpRequiredSec ?? 0
}

export function enrichStateForView(state: PetState): PetState & { xpRequiredForStage: number } {
  return { ...state, xpRequiredForStage: xpRequiredForStage(state) }
}
