import type { ActivityEvent, Tunables } from './types.js'

export function computeActiveTime(events: ActivityEvent[], tunables: Tunables): number {
  if (events.length === 0) return 0

  const sorted = [...events].sort((a, b) => a.ts - b.ts)

  let activeSec = 0
  let prev: ActivityEvent | null = null

  for (const e of sorted) {
    if (prev === null) {
      activeSec += tunables.SEED_SEC
    } else if (e.ts <= prev.ts) {
      continue
    } else {
      const gap = e.ts - prev.ts
      if (gap <= tunables.ACTIVE_GAP_SEC) {
        activeSec += gap
      }
    }
    prev = e
  }

  return activeSec
}
