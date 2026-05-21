import { describe, it, expect } from 'vitest'
import { computeActiveTime } from './xp.js'
import { DEFAULT_TUNABLES, type ActivityEvent } from './types.js'

const ev = (ts: number, src: ActivityEvent['src'] = 'vscode', kind = 'tick'): ActivityEvent => ({
  ts,
  src,
  kind,
})

describe('computeActiveTime', () => {
  it('returns 0 for empty event list', () => {
    expect(computeActiveTime([], DEFAULT_TUNABLES)).toBe(0)
  })

  it('returns SEED_SEC for single event', () => {
    expect(computeActiveTime([ev(1000)], DEFAULT_TUNABLES)).toBe(DEFAULT_TUNABLES.SEED_SEC)
  })

  it('accumulates gaps within ACTIVE_GAP_SEC', () => {
    // 30s seed + 60s + 120s = 210s
    const events = [ev(1000), ev(1060), ev(1180)]
    expect(computeActiveTime(events, DEFAULT_TUNABLES)).toBe(30 + 60 + 120)
  })

  it('does not accumulate gaps beyond ACTIVE_GAP_SEC', () => {
    // gap1 (60s) accumulates, gap2 (600s > 300s) does not
    const events = [ev(1000), ev(1060), ev(1660)]
    expect(computeActiveTime(events, DEFAULT_TUNABLES)).toBe(30 + 60)
  })

  it('handles unsorted events by sorting ts', () => {
    const events = [ev(1180), ev(1000), ev(1060)]
    expect(computeActiveTime(events, DEFAULT_TUNABLES)).toBe(30 + 60 + 120)
  })

  it('skips events with ts <= previous ts (time-regression guard)', () => {
    // Two events with same ts → second is skipped
    const events = [ev(1000), ev(1000)]
    expect(computeActiveTime(events, DEFAULT_TUNABLES)).toBe(30)
  })
})
