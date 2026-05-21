import * as fs from 'node:fs'
import * as path from 'node:path'
import type { EvolutionRule, PetState } from '@digicoda/core'

// Use require (available in CJS context after esbuild transpilation)
declare const require: any
let cache: EvolutionRule[] | null = null

function rules(): EvolutionRule[] {
  if (cache) return cache
  const dataPkg = require.resolve('@digicoda/data/package.json')
  cache = JSON.parse(
    fs.readFileSync(path.join(path.dirname(dataPkg), 'evolution.json'), 'utf-8'),
  ) as EvolutionRule[]
  return cache
}

export function xpRequiredForStage(state: PetState): number {
  const rule = rules().find((r) => r.from === state.digimonId)
  return rule?.xpRequiredSec ?? 0
}

export function enrichStateForView(state: PetState): PetState & { xpRequiredForStage: number } {
  return { ...state, xpRequiredForStage: xpRequiredForStage(state) }
}
