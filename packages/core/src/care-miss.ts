import type { Tunables } from './types.js'

/**
 * 마지막 활동 이후 elapsedSec 동안의 경과로 누적되는 케어 미스 수.
 * 음수/0은 0 반환.
 */
export function accrueCareMisses(elapsedSec: number, tunables: Tunables): number {
  if (elapsedSec <= 0) return 0
  return Math.floor(elapsedSec / tunables.CARE_MISS_WINDOW_SEC)
}
