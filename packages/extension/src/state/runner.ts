import * as fs from 'node:fs'
import * as path from 'node:path'
import { createRequire } from 'node:module'
import { reduce, DEFAULT_TUNABLES, type EvolutionRule, type PetState } from '@digicoda/core'
import { loadState, saveState, readEventsSince, appendGraveyard } from './io.js'

const require = createRequire(import.meta.url)
let cachedRules: EvolutionRule[] | null = null

function loadEvolutionRules(): EvolutionRule[] {
  if (cachedRules) return cachedRules
  // Resolve evolution.json from @digicoda/data
  const dataPkg = require.resolve('@digicoda/data/package.json')
  const dataRoot = path.dirname(dataPkg)
  const rulesPath = path.join(dataRoot, 'evolution.json')
  cachedRules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8')) as EvolutionRule[]
  return cachedRules
}

export type RunResult = {
  state: PetState
  ripped: boolean
  evolved: boolean
}

export function runReducerOnce(): RunResult {
  const prev = loadState()
  const newEvents = readEventsSince(prev.lastReducedEventTs)
  const now = Math.floor(Date.now() / 1000)
  const next = reduce(prev, newEvents, {
    now,
    tunables: DEFAULT_TUNABLES,
    evolutionRules: loadEvolutionRules(),
  })

  const evolved = next.evolutionHistory.length > prev.evolutionHistory.length

  if (next.rip && !prev.rip) {
    appendGraveyard(prev)
  }

  saveState(next)
  return { state: next, ripped: !!next.rip && !prev.rip, evolved }
}
