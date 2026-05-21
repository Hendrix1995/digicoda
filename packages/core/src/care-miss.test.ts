import { describe, it, expect } from 'vitest'
import { accrueCareMisses } from './care-miss.js'
import { DEFAULT_TUNABLES } from './types.js'

const HR = 3600
const DAY = 86400

describe('accrueCareMisses', () => {
  it('returns 0 when elapsed < window', () => {
    expect(accrueCareMisses(DAY - 1, DEFAULT_TUNABLES)).toBe(0)
  })

  it('returns 1 when elapsed exactly equals window', () => {
    expect(accrueCareMisses(DAY, DEFAULT_TUNABLES)).toBe(1)
  })

  it('returns 2 for 2 windows', () => {
    expect(accrueCareMisses(2 * DAY, DEFAULT_TUNABLES)).toBe(2)
  })

  it('returns 3 for 3 windows + partial', () => {
    expect(accrueCareMisses(3 * DAY + HR, DEFAULT_TUNABLES)).toBe(3)
  })

  it('returns 0 for negative or zero elapsed', () => {
    expect(accrueCareMisses(0, DEFAULT_TUNABLES)).toBe(0)
    expect(accrueCareMisses(-100, DEFAULT_TUNABLES)).toBe(0)
  })
})
