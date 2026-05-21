import { describe, it, expect } from 'vitest'
import { accrueCareMisses } from './care-miss.js'
import { DEFAULT_TUNABLES } from './types.js'

const WINDOW = DEFAULT_TUNABLES.CARE_MISS_WINDOW_SEC

describe('accrueCareMisses', () => {
  it('returns 0 when elapsed < window', () => {
    expect(accrueCareMisses(WINDOW - 1, DEFAULT_TUNABLES)).toBe(0)
  })

  it('returns 1 when elapsed exactly equals window', () => {
    expect(accrueCareMisses(WINDOW, DEFAULT_TUNABLES)).toBe(1)
  })

  it('returns 2 for 2 windows', () => {
    expect(accrueCareMisses(2 * WINDOW, DEFAULT_TUNABLES)).toBe(2)
  })

  it('returns 3 for 3 windows + partial', () => {
    expect(accrueCareMisses(3 * WINDOW + Math.floor(WINDOW / 6), DEFAULT_TUNABLES)).toBe(3)
  })

  it('returns 0 for negative or zero elapsed', () => {
    expect(accrueCareMisses(0, DEFAULT_TUNABLES)).toBe(0)
    expect(accrueCareMisses(-100, DEFAULT_TUNABLES)).toBe(0)
  })
})
