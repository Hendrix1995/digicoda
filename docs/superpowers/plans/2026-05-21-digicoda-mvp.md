# DigiCoda MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** VS Code 확장 DigiCoda MVP(v0.3 통합 범위) 구현 — 디지몬 테마 가상 펫이 Claude Code/VS Code 활동에 따라 성장·진화하며, 케어 미스로 분기. 펫이 화면에서 자율적으로 움직임.

**Architecture:** pnpm 워크스페이스 모노레포. `core`(VS Code 비의존 순수 도메인 로직, vitest), `extension`(VS Code 통합), `data`(스프라이트·로스터·진화 트리). 머신 전역 상태(`~/.digicoda/`). Claude Code 훅은 `~/.digicoda/hooks/record.js`를 호출.

**Tech Stack:**
- Node 22 LTS, TypeScript 5.5+, pnpm 9+
- core: vitest, fast-check (property-based 옵션)
- extension: VS Code Extension API, esbuild, @vscode/test-electron
- 빌드/패키징: esbuild, @vscode/vsce

**Spec:** `docs/superpowers/specs/2026-05-21-digicoda-design.md`

---

## Phase 0 — Project Bootstrap

### Task 1: Git 초기화 + 기본 ignore

**Files:**
- Create: `.gitignore`
- Create: `.npmrc`

- [ ] **Step 1: Git 초기화**

```bash
cd /Users/hendrix/Desktop/private/DigiCoda
git init
git branch -M main
```

- [ ] **Step 2: .gitignore 작성**

Write `/Users/hendrix/Desktop/private/DigiCoda/.gitignore`:

```
# Node
node_modules/
.pnpm-store/
*.log
.DS_Store

# Build
dist/
out/
*.tsbuildinfo

# VS Code extension
*.vsix
.vscode-test/

# Brainstorming companion (auto-generated)
.superpowers/

# Local environment
.env
.env.local
```

- [ ] **Step 3: .npmrc 작성**

Write `/Users/hendrix/Desktop/private/DigiCoda/.npmrc`:

```
shamefully-hoist=false
strict-peer-dependencies=true
auto-install-peers=true
```

- [ ] **Step 4: 초기 커밋**

```bash
git add .gitignore .npmrc docs/
git commit -m "chore: initial repo scaffold with gitignore and spec"
```

---

### Task 2: pnpm workspace 설정

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `package.json` (root)

- [ ] **Step 1: pnpm-workspace.yaml 작성**

Write `/Users/hendrix/Desktop/private/DigiCoda/pnpm-workspace.yaml`:

```yaml
packages:
  - 'packages/*'
```

- [ ] **Step 2: root package.json 작성**

Write `/Users/hendrix/Desktop/private/DigiCoda/package.json`:

```json
{
  "name": "digicoda",
  "version": "0.1.0-dev",
  "private": true,
  "description": "Digimon-themed virtual pet for VS Code / Cursor",
  "license": "MIT",
  "engines": {
    "node": ">=22.0.0",
    "pnpm": ">=9.0.0"
  },
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^22.0.0",
    "prettier": "^3.3.0"
  }
}
```

- [ ] **Step 3: 의존성 설치 확인**

```bash
pnpm install
```

Expected: `node_modules/` 생성, `pnpm-lock.yaml` 생성, 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add pnpm-workspace.yaml package.json pnpm-lock.yaml
git commit -m "chore: configure pnpm workspace"
```

---

### Task 3: TypeScript / Prettier 베이스 설정

**Files:**
- Create: `tsconfig.base.json`
- Create: `.prettierrc.json`
- Create: `.prettierignore`

- [ ] **Step 1: tsconfig.base.json 작성**

Write `/Users/hendrix/Desktop/private/DigiCoda/tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "declaration": true,
    "sourceMap": true,
    "incremental": true
  }
}
```

- [ ] **Step 2: Prettier 설정**

Write `/Users/hendrix/Desktop/private/DigiCoda/.prettierrc.json`:

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

Write `/Users/hendrix/Desktop/private/DigiCoda/.prettierignore`:

```
node_modules/
dist/
out/
*.vsix
pnpm-lock.yaml
.superpowers/
```

- [ ] **Step 3: 커밋**

```bash
git add tsconfig.base.json .prettierrc.json .prettierignore
git commit -m "chore: add TypeScript and Prettier base configs"
```

---

## Phase 1 — Core Package: Types

### Task 4: core 패키지 스캐폴드

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/index.ts`
- Create: `packages/core/vitest.config.ts`

- [ ] **Step 1: package.json 작성**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/core/package.json`:

```json
{
  "name": "@digicoda/core",
  "version": "0.1.0-dev",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "echo 'lint: noop'"
  },
  "devDependencies": {
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: tsconfig.json 작성**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/core/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules", "**/*.test.ts"]
}
```

- [ ] **Step 3: src/index.ts 작성 (스텁)**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/core/src/index.ts`:

```ts
export const VERSION = '0.1.0-dev'
```

- [ ] **Step 4: vitest.config.ts 작성**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/core/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
```

- [ ] **Step 5: 의존성 설치 + 빌드 확인**

```bash
pnpm install
pnpm --filter @digicoda/core build
```

Expected: `packages/core/dist/index.js`, `index.d.ts` 생성.

- [ ] **Step 6: 커밋**

```bash
git add packages/core/
git commit -m "feat(core): scaffold core package with vitest"
```

---

### Task 5: core 타입 정의

**Files:**
- Create: `packages/core/src/types.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: types.ts 작성**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/core/src/types.ts`:

```ts
export type Stage = 'egg' | 'baby' | 'child' | 'adult' | 'perfect'
export type Branch = 'light' | 'standard' | 'dark'
export type EventSource = 'claude-code' | 'vscode'

export type ActivityEvent = {
  ts: number          // unix epoch seconds
  src: EventSource
  kind: string
}

export type EvolutionHistoryEntry = {
  at: number
  from: string
  to: string
  careMissAtEvolve: number
  branch: Branch
}

export type PetState = {
  schemaVersion: 1
  petId: string
  bornAt: number

  digimonId: string
  stage: Stage

  xp: {
    totalActiveSec: number
    inStageActiveSec: number
  }

  careMiss: {
    inStageCount: number
    lifetimeCount: number
    accountedForCurrentIdle: number  // 현재 idle window 동안 이미 계상한 미스 수
  }

  lastActiveAt: number
  lastReducedEventTs: number

  evolutionHistory: EvolutionHistoryEntry[]

  rip?: { at: number; cause: string }
}

export type EvolutionBranch = {
  branch: Branch
  careMissMin: number
  careMissMax: number
  to: string
}

export type EvolutionRule = {
  from: string
  xpRequiredSec: number
  branches: EvolutionBranch[]
}

export type DigimonSprite = {
  idle: string
  walk?: string
  happy?: string
  sad?: string
  sleep?: string
}

export type Digimon = {
  id: string
  name: string
  stage: Stage
  sprite: DigimonSprite
  attribute?: 'vaccine' | 'data' | 'virus' | 'free'
}

export type DigicodaConfig = {
  schemaVersion: 1
  ui: {
    primary: 'panel' | 'sidebar'
    statusBar: boolean
  }
  audio?: { enabled: boolean }
  notifications: { evolveAlert: boolean }
  debug?: { logEvents: boolean }
}

export type Tunables = {
  ACTIVE_GAP_SEC: number
  SEED_SEC: number
  CARE_MISS_WINDOW_SEC: number
  CARE_MISS_RIP_LIMIT: number
}

export const DEFAULT_TUNABLES: Tunables = {
  ACTIVE_GAP_SEC: 300,
  SEED_SEC: 30,
  CARE_MISS_WINDOW_SEC: 86400,
  CARE_MISS_RIP_LIMIT: 12,
}
```

- [ ] **Step 2: index.ts에서 re-export**

Replace `/Users/hendrix/Desktop/private/DigiCoda/packages/core/src/index.ts`:

```ts
export * from './types.js'

export const VERSION = '0.1.0-dev'
```

- [ ] **Step 3: typecheck 통과 확인**

Run: `pnpm --filter @digicoda/core typecheck`
Expected: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add packages/core/src/
git commit -m "feat(core): define core domain types"
```

---

## Phase 2 — Core: Active Time (TDD)

### Task 6: Active time 계산 (TDD)

**Files:**
- Test: `packages/core/src/xp.test.ts`
- Create: `packages/core/src/xp.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: 실패 테스트 작성**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/core/src/xp.test.ts`:

```ts
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm --filter @digicoda/core test`
Expected: FAIL — "Cannot find module './xp.js'"

- [ ] **Step 3: xp.ts 구현**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/core/src/xp.ts`:

```ts
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
```

- [ ] **Step 4: index.ts에서 re-export**

Edit `/Users/hendrix/Desktop/private/DigiCoda/packages/core/src/index.ts` — add line after types export:

```ts
export * from './xp.js'
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `pnpm --filter @digicoda/core test`
Expected: 6 tests pass.

- [ ] **Step 6: 커밋**

```bash
git add packages/core/src/xp.ts packages/core/src/xp.test.ts packages/core/src/index.ts
git commit -m "feat(core): compute active time with gap window (TDD)"
```

---

## Phase 3 — Core: Care Miss (TDD)

### Task 7: Care miss 누적 (TDD)

**Files:**
- Test: `packages/core/src/care-miss.test.ts`
- Create: `packages/core/src/care-miss.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: 실패 테스트 작성**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/core/src/care-miss.test.ts`:

```ts
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm --filter @digicoda/core test care-miss`
Expected: FAIL — module not found.

- [ ] **Step 3: care-miss.ts 구현**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/core/src/care-miss.ts`:

```ts
import type { Tunables } from './types.js'

/**
 * 마지막 활동 이후 elapsedSec 동안의 경과로 누적되는 케어 미스 수.
 * 음수/0은 0 반환.
 */
export function accrueCareMisses(elapsedSec: number, tunables: Tunables): number {
  if (elapsedSec <= 0) return 0
  return Math.floor(elapsedSec / tunables.CARE_MISS_WINDOW_SEC)
}
```

- [ ] **Step 4: index.ts에서 re-export**

Append to `/Users/hendrix/Desktop/private/DigiCoda/packages/core/src/index.ts`:

```ts
export * from './care-miss.js'
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `pnpm --filter @digicoda/core test care-miss`
Expected: 5 tests pass.

- [ ] **Step 6: 커밋**

```bash
git add packages/core/src/care-miss.ts packages/core/src/care-miss.test.ts packages/core/src/index.ts
git commit -m "feat(core): accrue care misses by elapsed time (TDD)"
```

---

## Phase 4 — Core: Evolution (TDD)

### Task 8: 진화 분기 평가 (TDD)

**Files:**
- Test: `packages/core/src/evolution.test.ts`
- Create: `packages/core/src/evolution.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: 실패 테스트 작성**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/core/src/evolution.test.ts`:

```ts
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm --filter @digicoda/core test evolution`
Expected: FAIL.

- [ ] **Step 3: evolution.ts 구현**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/core/src/evolution.ts`:

```ts
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
      return 'baby'
    case 'baby':
      return 'child'
    case 'child':
      return 'adult'
    case 'adult':
      return 'perfect'
    case 'perfect':
      return 'perfect'
  }
}
```

- [ ] **Step 4: index.ts에서 re-export**

Append to `/Users/hendrix/Desktop/private/DigiCoda/packages/core/src/index.ts`:

```ts
export * from './evolution.js'
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `pnpm --filter @digicoda/core test evolution`
Expected: 8 tests pass.

- [ ] **Step 6: 커밋**

```bash
git add packages/core/src/evolution.ts packages/core/src/evolution.test.ts packages/core/src/index.ts
git commit -m "feat(core): evaluate evolution branches by care miss (TDD)"
```

---

## Phase 5 — Core: Reducer

### Task 9: Reducer 기본 형태 (TDD)

**Files:**
- Test: `packages/core/src/reducer.test.ts`
- Create: `packages/core/src/reducer.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: 실패 테스트 작성**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/core/src/reducer.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { initialState, reduce } from './reducer.js'
import type { ActivityEvent, EvolutionRule } from './types.js'
import { DEFAULT_TUNABLES } from './types.js'

const evolutionRules: EvolutionRule[] = [
  {
    from: 'egg',
    xpRequiredSec: 300, // 5 minutes
    branches: [
      { branch: 'light', careMissMin: 0, careMissMax: 0, to: 'koromon' },
      { branch: 'standard', careMissMin: 1, careMissMax: 999, to: 'koromon' },
      { branch: 'dark', careMissMin: 999, careMissMax: 999, to: 'koromon' },
    ],
  },
]

const ev = (ts: number, kind = 'tick'): ActivityEvent => ({ ts, src: 'vscode', kind })

describe('initialState', () => {
  it('starts with egg, schemaVersion 1, zero XP', () => {
    const s = initialState({ now: 1000, petId: 'p1' })
    expect(s.schemaVersion).toBe(1)
    expect(s.stage).toBe('egg')
    expect(s.digimonId).toBe('egg')
    expect(s.xp.totalActiveSec).toBe(0)
    expect(s.xp.inStageActiveSec).toBe(0)
    expect(s.careMiss.inStageCount).toBe(0)
    expect(s.bornAt).toBe(1000)
    expect(s.petId).toBe('p1')
    expect(s.evolutionHistory).toEqual([])
    expect(s.rip).toBeUndefined()
  })
})

describe('reduce', () => {
  it('returns state unchanged for empty new events', () => {
    const s0 = initialState({ now: 1000, petId: 'p1' })
    const s1 = reduce(s0, [], { now: 1500, tunables: DEFAULT_TUNABLES, evolutionRules })
    expect(s1.xp.totalActiveSec).toBe(0)
  })

  it('accumulates XP from events', () => {
    const s0 = initialState({ now: 1000, petId: 'p1' })
    const events = [ev(1100), ev(1160)] // SEED 30 + 60 = 90s
    const s1 = reduce(s0, events, { now: 1200, tunables: DEFAULT_TUNABLES, evolutionRules })
    expect(s1.xp.totalActiveSec).toBe(90)
    expect(s1.xp.inStageActiveSec).toBe(90)
    expect(s1.lastActiveAt).toBe(1160)
  })

  it('is idempotent — replaying same events does not double-count', () => {
    const s0 = initialState({ now: 1000, petId: 'p1' })
    const events = [ev(1100), ev(1160)]
    const s1 = reduce(s0, events, { now: 1200, tunables: DEFAULT_TUNABLES, evolutionRules })
    const s2 = reduce(s1, events, { now: 1300, tunables: DEFAULT_TUNABLES, evolutionRules })
    expect(s2.xp.totalActiveSec).toBe(s1.xp.totalActiveSec)
  })

  it('triggers evolution when threshold reached', () => {
    const s0 = initialState({ now: 1000, petId: 'p1' })
    // 20 events spaced 60s → 19 gaps × 60s = 1140 active seconds
    const events: ActivityEvent[] = []
    for (let i = 0; i < 20; i++) events.push(ev(1000 + i * 60))
    const s1 = reduce(s0, events, { now: 2500, tunables: DEFAULT_TUNABLES, evolutionRules })
    expect(s1.stage).toBe('baby')
    expect(s1.digimonId).toBe('koromon')
    expect(s1.evolutionHistory.length).toBe(1)
    // 잉여 XP는 다음 스테이지로 이월: 1140 - 300(egg threshold) = 840
    expect(s1.xp.inStageActiveSec).toBeGreaterThan(0)
  })

  it('accrues care miss when long elapsed without events', () => {
    const s0 = initialState({ now: 1000, petId: 'p1' })
    // Plant an event to set lastActiveAt
    const s1 = reduce(s0, [ev(1000)], {
      now: 1001,
      tunables: DEFAULT_TUNABLES,
      evolutionRules,
    })
    // Now jump 2 days ahead with no events
    const s2 = reduce(s1, [], {
      now: 1000 + 2 * 86400,
      tunables: DEFAULT_TUNABLES,
      evolutionRules,
    })
    expect(s2.careMiss.inStageCount).toBe(2)
    expect(s2.careMiss.lifetimeCount).toBe(2)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm --filter @digicoda/core test reducer`
Expected: FAIL.

- [ ] **Step 3: reducer.ts 구현**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/core/src/reducer.ts`:

```ts
import type {
  ActivityEvent,
  EvolutionRule,
  PetState,
  Tunables,
} from './types.js'
import { computeActiveTime } from './xp.js'
import { accrueCareMisses } from './care-miss.js'
import { isReadyToEvolve, matchBranch, nextStage } from './evolution.js'

export type InitArgs = {
  now: number
  petId: string
}

export function initialState({ now, petId }: InitArgs): PetState {
  return {
    schemaVersion: 1,
    petId,
    bornAt: now,
    digimonId: 'egg',
    stage: 'egg',
    xp: { totalActiveSec: 0, inStageActiveSec: 0 },
    careMiss: { inStageCount: 0, lifetimeCount: 0, accountedForCurrentIdle: 0 },
    lastActiveAt: now,
    lastReducedEventTs: 0,
    evolutionHistory: [],
  }
}

export type ReduceArgs = {
  now: number
  tunables: Tunables
  evolutionRules: EvolutionRule[]
}

export function reduce(
  prev: PetState,
  newEvents: ActivityEvent[],
  args: ReduceArgs,
): PetState {
  const { now, tunables, evolutionRules } = args

  // Filter: only events strictly newer than lastReducedEventTs (idempotency)
  const fresh = newEvents
    .filter((e) => e.ts > prev.lastReducedEventTs)
    .sort((a, b) => a.ts - b.ts)

  let next: PetState = { ...prev }

  // 1. Compute active time gained from fresh events
  if (fresh.length > 0) {
    // We need to consider the gap from lastActiveAt to first fresh event too
    const synthetic: ActivityEvent[] = [
      { ts: prev.lastActiveAt, src: 'vscode', kind: '__lastActive' },
      ...fresh,
    ]
    const newActiveAll = computeActiveTime(synthetic, tunables)
    // Subtract SEED_SEC because synthetic[0] is not a real new event
    const newActive = Math.max(0, newActiveAll - tunables.SEED_SEC)

    next = {
      ...next,
      xp: {
        totalActiveSec: next.xp.totalActiveSec + newActive,
        inStageActiveSec: next.xp.inStageActiveSec + newActive,
      },
      lastActiveAt: fresh[fresh.length - 1]!.ts,
      lastReducedEventTs: fresh[fresh.length - 1]!.ts,
      // New activity resets the care-miss window — handled below by adjusting
      // baseline. We do NOT reset careMiss.inStageCount because the spec says
      // accrued misses persist until evolution.
    }
  }

  // 2. Accrue care miss from time since last activity
  let careMiss = next.careMiss
  if (fresh.length > 0) {
    // 활동이 있으면 현재 idle window가 리셋됨 (이미 계상된 미스는 보존)
    careMiss = { ...careMiss, accountedForCurrentIdle: 0 }
  } else {
    const elapsedSinceActive = now - next.lastActiveAt
    const missesNow = accrueCareMisses(elapsedSinceActive, tunables)
    const delta = Math.max(0, missesNow - careMiss.accountedForCurrentIdle)
    if (delta > 0) {
      careMiss = {
        inStageCount: careMiss.inStageCount + delta,
        lifetimeCount: careMiss.lifetimeCount + delta,
        accountedForCurrentIdle: missesNow,
      }
    }
  }
  next = { ...next, careMiss }

  // 3. RIP check
  if (!next.rip && next.careMiss.inStageCount >= tunables.CARE_MISS_RIP_LIMIT) {
    next = { ...next, rip: { at: now, cause: 'neglect' } }
    return next
  }

  // 4. Evolution check (loop to handle overflow across multiple stages)
  while (!next.rip && next.stage !== 'perfect') {
    const rule = evolutionRules.find((r) => r.from === next.digimonId)
    if (!rule || !isReadyToEvolve(rule, next.xp.inStageActiveSec)) break
    const branch = matchBranch(rule, next.careMiss.inStageCount)
    next = {
      ...next,
      evolutionHistory: [
        ...next.evolutionHistory,
        {
          at: now,
          from: next.digimonId,
          to: branch.to,
          careMissAtEvolve: next.careMiss.inStageCount,
          branch: branch.branch,
        },
      ],
      digimonId: branch.to,
      stage: nextStage(next.stage),
      xp: {
        ...next.xp,
        // 잉여 XP는 다음 스테이지로 이월
        inStageActiveSec: Math.max(0, next.xp.inStageActiveSec - rule.xpRequiredSec),
      },
      careMiss: { ...next.careMiss, inStageCount: 0, accountedForCurrentIdle: 0 },
    }
  }

  return next
}
```

- [ ] **Step 4: index.ts에서 re-export**

Append to `/Users/hendrix/Desktop/private/DigiCoda/packages/core/src/index.ts`:

```ts
export * from './reducer.js'
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `pnpm --filter @digicoda/core test reducer`
Expected: 6 tests pass.

- [ ] **Step 6: 커밋**

```bash
git add packages/core/src/reducer.ts packages/core/src/reducer.test.ts packages/core/src/index.ts
git commit -m "feat(core): reducer with active time, care miss, evolution"
```

---

### Task 10: Reducer 시나리오 테스트

**Files:**
- Test: `packages/core/src/reducer-scenario.test.ts`

- [ ] **Step 1: 시나리오 테스트 작성**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/core/src/reducer-scenario.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { initialState, reduce } from './reducer.js'
import type { ActivityEvent, EvolutionRule } from './types.js'
import { DEFAULT_TUNABLES } from './types.js'

const rules: EvolutionRule[] = [
  {
    from: 'egg',
    xpRequiredSec: 300,
    branches: [
      { branch: 'light', careMissMin: 0, careMissMax: 0, to: 'koromon' },
      { branch: 'standard', careMissMin: 1, careMissMax: 999, to: 'koromon' },
      { branch: 'dark', careMissMin: 999, careMissMax: 999, to: 'koromon' },
    ],
  },
  {
    from: 'koromon',
    xpRequiredSec: 3600,
    branches: [
      { branch: 'light', careMissMin: 0, careMissMax: 1, to: 'agumon' },
      { branch: 'standard', careMissMin: 2, careMissMax: 999, to: 'agumon' },
      { branch: 'dark', careMissMin: 999, careMissMax: 999, to: 'agumon' },
    ],
  },
  {
    from: 'agumon',
    xpRequiredSec: 28800,
    branches: [
      { branch: 'light', careMissMin: 0, careMissMax: 1, to: 'angemon' },
      { branch: 'standard', careMissMin: 2, careMissMax: 4, to: 'greymon' },
      { branch: 'dark', careMissMin: 5, careMissMax: 999, to: 'devimon' },
    ],
  },
]

function densePromptStream(startTs: number, count: number, gapSec = 60): ActivityEvent[] {
  return Array.from({ length: count }, (_, i) => ({
    ts: startTs + i * gapSec,
    src: 'claude-code',
    kind: 'prompt-submit',
  }))
}

describe('scenario: dense coding 10h with light care', () => {
  it('reaches adult stage with light branch', () => {
    let state = initialState({ now: 1_000_000, petId: 'scenario-1' })
    // 600 events × 60s gap = ~36000s = 10h of dense activity
    // egg(300) + baby(3600) + child(28800) = 32700s 필요. 36000 > 32700 → adult 도달.
    const events = densePromptStream(1_000_001, 600)
    state = reduce(state, events, {
      now: 1_000_000 + 36000,
      tunables: DEFAULT_TUNABLES,
      evolutionRules: rules,
    })
    expect(state.stage).toBe('adult')
  })
})

describe('scenario: neglect → dark branch', () => {
  it('produces dark branch after 5+ care misses', () => {
    let state = initialState({ now: 1_000_000, petId: 'scenario-2' })

    // Phase 1: dense child progression (need egg+koromon = 3900s, light branch → patamon)
    state = reduce(state, densePromptStream(1_000_001, 70), {
      now: 1_000_000 + 4200,
      tunables: DEFAULT_TUNABLES,
      evolutionRules: rules,
    })
    expect(state.stage).toBe('child')

    // Phase 2: 6 days of neglect → 6 care miss accrued in-stage
    state = reduce(state, [], {
      now: 1_000_000 + 4200 + 6 * 86400,
      tunables: DEFAULT_TUNABLES,
      evolutionRules: rules,
    })
    expect(state.careMiss.inStageCount).toBeGreaterThanOrEqual(5)

    // Phase 3: 9h dense coding → patamon → devimon (dark, careMiss=6)
    const burstStart = 1_000_000 + 4200 + 6 * 86400 + 10
    state = reduce(state, densePromptStream(burstStart, 540), {
      now: burstStart + 32400,
      tunables: DEFAULT_TUNABLES,
      evolutionRules: rules,
    })
    expect(state.stage).toBe('adult')
    const lastEvo = state.evolutionHistory[state.evolutionHistory.length - 1]
    expect(lastEvo?.branch).toBe('dark')
    expect(lastEvo?.to).toBe('devimon')
  })
})

describe('scenario: long neglect → RIP', () => {
  it('triggers RIP after RIP_LIMIT care misses', () => {
    let state = initialState({ now: 1_000_000, petId: 'scenario-3' })
    // 10 events → egg을 koromon으로 진화 (스테이지=baby)
    state = reduce(state, densePromptStream(1_000_001, 10), {
      now: 1_000_000 + 600,
      tunables: DEFAULT_TUNABLES,
      evolutionRules: rules,
    })
    // 13 days neglect → 13 care misses, RIP_LIMIT=12
    state = reduce(state, [], {
      now: 1_000_000 + 600 + 13 * 86400,
      tunables: DEFAULT_TUNABLES,
      evolutionRules: rules,
    })
    expect(state.rip).toBeDefined()
    expect(state.rip?.cause).toBe('neglect')
  })
})
```

- [ ] **Step 2: 테스트 통과 확인**

Run: `pnpm --filter @digicoda/core test reducer-scenario`
Expected: 3 scenarios pass.

- [ ] **Step 3: 커밋**

```bash
git add packages/core/src/reducer-scenario.test.ts
git commit -m "test(core): end-to-end reducer scenarios (light/dark/RIP)"
```

---

## Phase 6 — Data Package

### Task 11: data 패키지 + roster/evolution JSON

**Files:**
- Create: `packages/data/package.json`
- Create: `packages/data/roster.json`
- Create: `packages/data/evolution.json`
- Create: `packages/data/sprites/.gitkeep`

- [ ] **Step 1: data 패키지 package.json**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/data/package.json`:

```json
{
  "name": "@digicoda/data",
  "version": "0.1.0-dev",
  "private": true,
  "files": ["roster.json", "evolution.json", "sprites/"],
  "scripts": {
    "build": "echo 'data: no build'",
    "test": "echo 'data: no tests'",
    "typecheck": "echo 'data: no typecheck'",
    "lint": "echo 'data: noop'"
  }
}
```

- [ ] **Step 2: roster.json 작성**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/data/roster.json`:

```json
[
  { "id": "egg",          "name": "Digi Egg",      "stage": "egg",     "sprite": { "idle": "egg/idle.png" } },
  { "id": "koromon",      "name": "Koromon",       "stage": "baby",    "sprite": { "idle": "koromon/idle.png", "walk": "koromon/walk.png" } },
  { "id": "tsunomon",     "name": "Tsunomon",      "stage": "baby",    "sprite": { "idle": "tsunomon/idle.png", "walk": "tsunomon/walk.png" } },
  { "id": "tokomon",      "name": "Tokomon",       "stage": "baby",    "sprite": { "idle": "tokomon/idle.png", "walk": "tokomon/walk.png" } },
  { "id": "agumon",       "name": "Agumon",        "stage": "child",   "sprite": { "idle": "agumon/idle.png", "walk": "agumon/walk.png", "happy": "agumon/happy.png", "sad": "agumon/sad.png", "sleep": "agumon/sleep.png" }, "attribute": "vaccine" },
  { "id": "gabumon",      "name": "Gabumon",       "stage": "child",   "sprite": { "idle": "gabumon/idle.png", "walk": "gabumon/walk.png", "happy": "gabumon/happy.png", "sad": "gabumon/sad.png", "sleep": "gabumon/sleep.png" }, "attribute": "data" },
  { "id": "patamon",      "name": "Patamon",       "stage": "child",   "sprite": { "idle": "patamon/idle.png", "walk": "patamon/walk.png", "happy": "patamon/happy.png", "sad": "patamon/sad.png", "sleep": "patamon/sleep.png" }, "attribute": "vaccine" },
  { "id": "greymon",      "name": "Greymon",       "stage": "adult",   "sprite": { "idle": "greymon/idle.png", "walk": "greymon/walk.png" }, "attribute": "vaccine" },
  { "id": "garurumon",    "name": "Garurumon",     "stage": "adult",   "sprite": { "idle": "garurumon/idle.png", "walk": "garurumon/walk.png" }, "attribute": "data" },
  { "id": "angemon",      "name": "Angemon",       "stage": "adult",   "sprite": { "idle": "angemon/idle.png", "walk": "angemon/walk.png" }, "attribute": "vaccine" },
  { "id": "devimon",      "name": "Devimon",       "stage": "adult",   "sprite": { "idle": "devimon/idle.png", "walk": "devimon/walk.png" }, "attribute": "virus" },
  { "id": "skullgreymon", "name": "SkullGreymon",  "stage": "adult",   "sprite": { "idle": "skullgreymon/idle.png", "walk": "skullgreymon/walk.png" }, "attribute": "virus" },
  { "id": "weregarurumon","name": "WereGarurumon", "stage": "adult",   "sprite": { "idle": "weregarurumon/idle.png", "walk": "weregarurumon/walk.png" }, "attribute": "vaccine" },
  { "id": "metalgreymon", "name": "MetalGreymon",  "stage": "perfect", "sprite": { "idle": "metalgreymon/idle.png", "walk": "metalgreymon/walk.png" }, "attribute": "vaccine" },
  { "id": "magnaangemon", "name": "MagnaAngemon",  "stage": "perfect", "sprite": { "idle": "magnaangemon/idle.png", "walk": "magnaangemon/walk.png" }, "attribute": "vaccine" }
]
```

- [ ] **Step 3: evolution.json 작성**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/data/evolution.json`:

```json
[
  {
    "from": "egg",
    "xpRequiredSec": 300,
    "branches": [
      { "branch": "light",    "careMissMin": 0, "careMissMax": 0,   "to": "koromon"   },
      { "branch": "standard", "careMissMin": 1, "careMissMax": 998, "to": "tsunomon"  },
      { "branch": "dark",     "careMissMin": 999,"careMissMax": 999,"to": "tokomon"   }
    ]
  },
  {
    "from": "koromon",
    "xpRequiredSec": 3600,
    "branches": [
      { "branch": "light",    "careMissMin": 0, "careMissMax": 1,   "to": "patamon" },
      { "branch": "standard", "careMissMin": 2, "careMissMax": 999, "to": "agumon"  },
      { "branch": "dark",     "careMissMin": 999,"careMissMax": 999,"to": "agumon"  }
    ]
  },
  {
    "from": "tsunomon",
    "xpRequiredSec": 3600,
    "branches": [
      { "branch": "light",    "careMissMin": 0, "careMissMax": 1,   "to": "gabumon" },
      { "branch": "standard", "careMissMin": 2, "careMissMax": 999, "to": "gabumon" },
      { "branch": "dark",     "careMissMin": 999,"careMissMax": 999,"to": "gabumon" }
    ]
  },
  {
    "from": "tokomon",
    "xpRequiredSec": 3600,
    "branches": [
      { "branch": "light",    "careMissMin": 0, "careMissMax": 999, "to": "patamon" },
      { "branch": "standard", "careMissMin": 999,"careMissMax": 999,"to": "patamon" },
      { "branch": "dark",     "careMissMin": 999,"careMissMax": 999,"to": "patamon" }
    ]
  },
  {
    "from": "agumon",
    "xpRequiredSec": 28800,
    "branches": [
      { "branch": "light",    "careMissMin": 0, "careMissMax": 1,   "to": "angemon" },
      { "branch": "standard", "careMissMin": 2, "careMissMax": 4,   "to": "greymon" },
      { "branch": "dark",     "careMissMin": 5, "careMissMax": 999, "to": "devimon" }
    ]
  },
  {
    "from": "gabumon",
    "xpRequiredSec": 28800,
    "branches": [
      { "branch": "light",    "careMissMin": 0, "careMissMax": 1,   "to": "weregarurumon" },
      { "branch": "standard", "careMissMin": 2, "careMissMax": 4,   "to": "garurumon"     },
      { "branch": "dark",     "careMissMin": 5, "careMissMax": 999, "to": "skullgreymon"  }
    ]
  },
  {
    "from": "patamon",
    "xpRequiredSec": 28800,
    "branches": [
      { "branch": "light",    "careMissMin": 0, "careMissMax": 1,   "to": "angemon" },
      { "branch": "standard", "careMissMin": 2, "careMissMax": 4,   "to": "angemon" },
      { "branch": "dark",     "careMissMin": 5, "careMissMax": 999, "to": "devimon" }
    ]
  },
  {
    "from": "greymon",
    "xpRequiredSec": 86400,
    "branches": [
      { "branch": "light",    "careMissMin": 0, "careMissMax": 1,   "to": "metalgreymon" },
      { "branch": "standard", "careMissMin": 2, "careMissMax": 999, "to": "metalgreymon" },
      { "branch": "dark",     "careMissMin": 999,"careMissMax": 999,"to": "metalgreymon" }
    ]
  },
  {
    "from": "angemon",
    "xpRequiredSec": 86400,
    "branches": [
      { "branch": "light",    "careMissMin": 0, "careMissMax": 999, "to": "magnaangemon" },
      { "branch": "standard", "careMissMin": 999,"careMissMax": 999,"to": "magnaangemon" },
      { "branch": "dark",     "careMissMin": 999,"careMissMax": 999,"to": "magnaangemon" }
    ]
  }
]
```

- [ ] **Step 4: sprites/ 디렉토리 placeholder**

```bash
mkdir -p /Users/hendrix/Desktop/private/DigiCoda/packages/data/sprites
touch /Users/hendrix/Desktop/private/DigiCoda/packages/data/sprites/.gitkeep
```

- [ ] **Step 5: 의존성 등록 확인**

```bash
pnpm install
```

- [ ] **Step 6: 커밋**

```bash
git add packages/data/
git commit -m "feat(data): roster (15 digimon) and evolution tree"
```

---

### Task 12: Placeholder 스프라이트 생성기

**Files:**
- Create: `packages/data/scripts/generate-placeholder-sprites.mjs`
- Modify: `packages/data/package.json`

- [ ] **Step 1: 스크립트 작성**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/data/scripts/generate-placeholder-sprites.mjs`:

```js
// Generates simple 48x48 PNG placeholder sprites per digimon entry.
// Uses pure Node (no canvas dep) — writes a 1x1 colored PNG and scales via CSS later.
// Each digimon gets a distinct color hash from its name.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'
import crypto from 'node:crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const roster = JSON.parse(fs.readFileSync(path.join(root, 'roster.json'), 'utf-8'))

function colorFor(id) {
  const h = crypto.createHash('sha256').update(id).digest()
  return [h[0] ?? 0, h[1] ?? 0, h[2] ?? 0]
}

// Minimal PNG writer: 48×48 solid color
function makePng(w, h, rgb) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = chunk('IHDR', Buffer.concat([
    u32(w), u32(h),
    Buffer.from([8, 2, 0, 0, 0]),
  ]))
  // Row data: 1 byte filter + w*3 bytes RGB, repeated h times
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(w * 3).map((_, i) => rgb[i % 3] ?? 0)])
  const raw = Buffer.alloc(0)
  const rows = []
  for (let i = 0; i < h; i++) rows.push(row)
  const idatRaw = Buffer.concat(rows)
  const idat = chunk('IDAT', zlib.deflateSync(idatRaw))
  const iend = chunk('IEND', Buffer.alloc(0))
  return Buffer.concat([sig, ihdr, idat, iend])
}

function u32(n) { const b = Buffer.alloc(4); b.writeUInt32BE(n, 0); return b }
function chunk(type, data) {
  const len = u32(data.length)
  const t = Buffer.from(type, 'ascii')
  const crc = crc32(Buffer.concat([t, data]))
  return Buffer.concat([len, t, data, crc])
}
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = (crcTable[(c ^ b) & 0xff] ?? 0) ^ (c >>> 8)
  const out = Buffer.alloc(4)
  out.writeUInt32BE((c ^ 0xffffffff) >>> 0, 0)
  return out
}

const spritesDir = path.join(root, 'sprites')
fs.mkdirSync(spritesDir, { recursive: true })

let created = 0
for (const d of roster) {
  const dir = path.join(spritesDir, d.id)
  fs.mkdirSync(dir, { recursive: true })
  const rgb = colorFor(d.id)
  for (const key of ['idle', 'walk', 'happy', 'sad', 'sleep']) {
    const rel = d.sprite[key]
    if (!rel) continue
    const out = path.join(spritesDir, rel)
    fs.mkdirSync(path.dirname(out), { recursive: true })
    if (!fs.existsSync(out)) {
      fs.writeFileSync(out, makePng(48, 48, rgb))
      created++
    }
  }
}
console.log(`Created ${created} placeholder sprites`)
```

- [ ] **Step 2: package.json에 스크립트 등록**

Edit `/Users/hendrix/Desktop/private/DigiCoda/packages/data/package.json` — replace `"build"` script:

```json
{
  "scripts": {
    "build": "node scripts/generate-placeholder-sprites.mjs",
    "test": "echo 'data: no tests'",
    "typecheck": "echo 'data: no typecheck'",
    "lint": "echo 'data: noop'"
  }
}
```

- [ ] **Step 3: 실행 확인**

```bash
pnpm --filter @digicoda/data build
```

Expected: `Created N placeholder sprites` (N = roster의 sprite 항목 총합), `packages/data/sprites/<id>/idle.png` 등 생성.

- [ ] **Step 4: 커밋**

```bash
git add packages/data/scripts/ packages/data/package.json packages/data/sprites/
git commit -m "feat(data): placeholder sprite generator (per-digimon solid color)"
```

---

## Phase 7 — Extension Package Scaffold

### Task 13: Extension 패키지 + VS Code manifest

**Files:**
- Create: `packages/extension/package.json`
- Create: `packages/extension/tsconfig.json`
- Create: `packages/extension/.vscodeignore`
- Create: `packages/extension/src/extension.ts`
- Create: `packages/extension/esbuild.config.mjs`

- [ ] **Step 1: package.json 작성**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/extension/package.json`:

```json
{
  "name": "digicoda",
  "displayName": "DigiCoda",
  "description": "Digimon-themed virtual pet that grows with your coding (VS Code + Claude Code)",
  "version": "0.1.0-dev",
  "publisher": "hendrix",
  "private": true,
  "engines": {
    "vscode": "^1.92.0"
  },
  "categories": ["Other"],
  "main": "./dist/extension.js",
  "activationEvents": ["onStartupFinished"],
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        { "id": "digicoda", "title": "DigiCoda", "icon": "$(person)" }
      ]
    },
    "views": {
      "digicoda": [
        { "id": "digicoda.sidebar", "name": "Pet", "type": "webview" }
      ]
    },
    "commands": [
      { "command": "digicoda.showPanel",       "title": "DigiCoda: Show Panel" },
      { "command": "digicoda.showSidebar",     "title": "DigiCoda: Show Sidebar" },
      { "command": "digicoda.installHooks",    "title": "DigiCoda: Install Claude Code Hooks" },
      { "command": "digicoda.uninstallHooks",  "title": "DigiCoda: Uninstall Claude Code Hooks" },
      { "command": "digicoda.resetPet",        "title": "DigiCoda: Reset Pet (start new egg)" }
    ],
    "configuration": {
      "title": "DigiCoda",
      "properties": {
        "digicoda.ui.primary": {
          "type": "string",
          "enum": ["panel", "sidebar"],
          "default": "sidebar",
          "description": "Primary pet display location"
        },
        "digicoda.ui.statusBar": {
          "type": "boolean",
          "default": true,
          "description": "Show mini pet indicator in status bar"
        },
        "digicoda.notifications.evolveAlert": {
          "type": "boolean",
          "default": true,
          "description": "Show notification when pet evolves"
        }
      }
    }
  },
  "scripts": {
    "build": "node esbuild.config.mjs",
    "watch": "node esbuild.config.mjs --watch",
    "test": "echo 'extension tests run via vscode-test'",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "echo 'extension: noop'",
    "package": "vsce package --no-dependencies"
  },
  "dependencies": {
    "@digicoda/core": "workspace:*",
    "@digicoda/data": "workspace:*",
    "chokidar": "^4.0.0"
  },
  "devDependencies": {
    "@types/vscode": "^1.92.0",
    "@types/node": "^22.0.0",
    "esbuild": "^0.24.0",
    "@vscode/vsce": "^3.0.0"
  }
}
```

- [ ] **Step 2: tsconfig.json**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/extension/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./out",
    "rootDir": "./src",
    "types": ["node", "vscode"]
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "out", "node_modules", "**/*.test.ts"]
}
```

- [ ] **Step 3: esbuild.config.mjs**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/extension/esbuild.config.mjs`:

```js
import esbuild from 'esbuild'

const watch = process.argv.includes('--watch')

const ctx = await esbuild.context({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  external: ['vscode'],
  sourcemap: true,
  minify: false,
  logLevel: 'info',
})

if (watch) {
  await ctx.watch()
} else {
  await ctx.rebuild()
  await ctx.dispose()
}
```

- [ ] **Step 4: .vscodeignore**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/extension/.vscodeignore`:

```
src/
out/
tsconfig.json
esbuild.config.mjs
**/*.map
**/*.test.ts
.vscode-test/
node_modules/
```

- [ ] **Step 5: src/extension.ts 스텁**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/extension/src/extension.ts`:

```ts
import * as vscode from 'vscode'

export function activate(_context: vscode.ExtensionContext) {
  console.log('[digicoda] activated')
}

export function deactivate() {
  console.log('[digicoda] deactivated')
}
```

- [ ] **Step 6: 빌드 확인**

```bash
pnpm install
pnpm --filter digicoda build
```

Expected: `packages/extension/dist/extension.js` 생성.

- [ ] **Step 7: 커밋**

```bash
git add packages/extension/
git commit -m "feat(extension): scaffold VS Code extension manifest and build"
```

---

### Task 14: State 파일 I/O 모듈

**Files:**
- Create: `packages/extension/src/state/paths.ts`
- Create: `packages/extension/src/state/io.ts`

- [ ] **Step 1: paths.ts 작성**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/extension/src/state/paths.ts`:

```ts
import * as os from 'node:os'
import * as path from 'node:path'

export const DIGICODA_DIR = path.join(os.homedir(), '.digicoda')

export const PATHS = {
  dir: DIGICODA_DIR,
  state: path.join(DIGICODA_DIR, 'state.json'),
  events: path.join(DIGICODA_DIR, 'events.jsonl'),
  config: path.join(DIGICODA_DIR, 'config.json'),
  graveyard: path.join(DIGICODA_DIR, 'graveyard.jsonl'),
  hooksDir: path.join(DIGICODA_DIR, 'hooks'),
  recordJs: path.join(DIGICODA_DIR, 'hooks', 'record.js'),
  logsDir: path.join(DIGICODA_DIR, 'logs'),
} as const
```

- [ ] **Step 2: io.ts 작성**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/extension/src/state/io.ts`:

```ts
import * as fs from 'node:fs'
import * as path from 'node:path'
import { randomUUID } from 'node:crypto'
import type { ActivityEvent, DigicodaConfig, PetState } from '@digicoda/core'
import { initialState } from '@digicoda/core'
import { PATHS } from './paths.js'

export function ensureDirs(): void {
  fs.mkdirSync(PATHS.dir, { recursive: true })
  fs.mkdirSync(PATHS.hooksDir, { recursive: true })
  fs.mkdirSync(PATHS.logsDir, { recursive: true })
}

export function loadState(): PetState {
  ensureDirs()
  if (!fs.existsSync(PATHS.state)) {
    const fresh = initialState({ now: Math.floor(Date.now() / 1000), petId: randomUUID() })
    saveState(fresh)
    return fresh
  }
  try {
    return JSON.parse(fs.readFileSync(PATHS.state, 'utf-8')) as PetState
  } catch (e) {
    console.error('[digicoda] state.json corrupted, regenerating:', e)
    const fresh = initialState({ now: Math.floor(Date.now() / 1000), petId: randomUUID() })
    saveState(fresh)
    return fresh
  }
}

export function saveState(state: PetState): void {
  ensureDirs()
  const tmp = PATHS.state + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2))
  fs.renameSync(tmp, PATHS.state)
}

export function appendEvent(event: ActivityEvent): void {
  ensureDirs()
  fs.appendFileSync(PATHS.events, JSON.stringify(event) + '\n')
}

export function readEventsSince(ts: number): ActivityEvent[] {
  if (!fs.existsSync(PATHS.events)) return []
  const raw = fs.readFileSync(PATHS.events, 'utf-8')
  const events: ActivityEvent[] = []
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      const e = JSON.parse(trimmed) as ActivityEvent
      if (typeof e.ts === 'number' && e.ts > ts) events.push(e)
    } catch {
      // skip corrupted lines
    }
  }
  return events
}

const DEFAULT_CONFIG: DigicodaConfig = {
  schemaVersion: 1,
  ui: { primary: 'sidebar', statusBar: true },
  notifications: { evolveAlert: true },
}

export function loadConfig(): DigicodaConfig {
  ensureDirs()
  if (!fs.existsSync(PATHS.config)) {
    saveConfig(DEFAULT_CONFIG)
    return { ...DEFAULT_CONFIG }
  }
  try {
    return JSON.parse(fs.readFileSync(PATHS.config, 'utf-8')) as DigicodaConfig
  } catch {
    saveConfig(DEFAULT_CONFIG)
    return { ...DEFAULT_CONFIG }
  }
}

export function saveConfig(config: DigicodaConfig): void {
  ensureDirs()
  const tmp = PATHS.config + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(config, null, 2))
  fs.renameSync(tmp, PATHS.config)
}

export function appendGraveyard(state: PetState): void {
  ensureDirs()
  fs.appendFileSync(PATHS.graveyard, JSON.stringify(state) + '\n')
}
```

- [ ] **Step 2: typecheck 통과**

Run: `pnpm --filter digicoda typecheck`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add packages/extension/src/state/
git commit -m "feat(extension): state/config file I/O with atomic writes"
```

---

### Task 15: Reducer Runner

**Files:**
- Create: `packages/extension/src/state/runner.ts`

- [ ] **Step 1: runner.ts 작성**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/extension/src/state/runner.ts`:

```ts
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { reduce, DEFAULT_TUNABLES, type EvolutionRule, type PetState } from '@digicoda/core'
import { loadState, saveState, readEventsSince, appendGraveyard } from './io.js'
import { PATHS } from './paths.js'

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

  const evolved =
    next.evolutionHistory.length > prev.evolutionHistory.length

  if (next.rip && !prev.rip) {
    // Move the previously living pet to graveyard
    appendGraveyard(prev)
  }

  saveState(next)
  return { state: next, ripped: !!next.rip && !prev.rip, evolved }
}
```

- [ ] **Step 2: typecheck 통과**

Run: `pnpm --filter digicoda typecheck`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add packages/extension/src/state/runner.ts
git commit -m "feat(extension): reducer runner (load → reduce → save)"
```

---

## Phase 8 — Activity Recording

### Task 16: VS Code Activity Recorder

**Files:**
- Create: `packages/extension/src/activity/recorder.ts`

- [ ] **Step 1: recorder.ts 작성**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/extension/src/activity/recorder.ts`:

```ts
import * as vscode from 'vscode'
import { appendEvent } from '../state/io.js'

const DEBOUNCE_SEC = 30
const lastWritten: Record<string, number> = {}

function record(kind: string) {
  const now = Math.floor(Date.now() / 1000)
  if (now - (lastWritten[kind] ?? 0) < DEBOUNCE_SEC) return
  lastWritten[kind] = now
  try {
    appendEvent({ ts: now, src: 'vscode', kind })
  } catch (e) {
    console.error('[digicoda] failed to record event:', e)
  }
}

export function startActivityRecorder(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(() => {
      if (vscode.window.state.focused) record('text-change')
    }),
    vscode.window.onDidChangeWindowState((s) => {
      if (s.focused) record('focus')
    }),
    vscode.window.onDidChangeActiveTextEditor(() => {
      if (vscode.window.state.focused) record('editor-switch')
    }),
  )
}
```

- [ ] **Step 2: typecheck 통과**

Run: `pnpm --filter digicoda typecheck`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add packages/extension/src/activity/
git commit -m "feat(extension): VS Code activity recorder with 30s debounce"
```

---

### Task 17: Claude Code 훅 설치/제거

**Files:**
- Create: `packages/extension/src/hooks/installer.ts`
- Create: `packages/extension/src/hooks/record-template.ts`

- [ ] **Step 1: record-template.ts 작성**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/extension/src/hooks/record-template.ts`:

```ts
// Source for the record.js script that lives at ~/.digicoda/hooks/record.js.
// Inlined as a string so the extension can write it without bundling assets.
export const RECORD_JS = `
const fs = require('fs')
const path = require('path')
const os = require('os')

const [, , src, kind] = process.argv
const ts = Math.floor(Date.now() / 1000)
const line = JSON.stringify({ ts: ts, src: src, kind: kind }) + '\\n'

const dir = path.join(os.homedir(), '.digicoda')
try {
  fs.mkdirSync(dir, { recursive: true })
  fs.appendFileSync(path.join(dir, 'events.jsonl'), line)
} catch (e) {
  // Hooks must never block Claude Code — silently swallow failures.
}
process.exit(0)
`.trim()
```

- [ ] **Step 2: installer.ts 작성**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/extension/src/hooks/installer.ts`:

```ts
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { execSync } from 'node:child_process'
import { PATHS } from '../state/paths.js'
import { RECORD_JS } from './record-template.js'

const CLAUDE_DIR = path.join(os.homedir(), '.claude')
const CLAUDE_SETTINGS = path.join(CLAUDE_DIR, 'settings.json')
const BACKUP = path.join(CLAUDE_DIR, 'settings.json.digicoda-backup')

const HOOK_EVENTS = ['SessionStart', 'UserPromptSubmit', 'PostToolUse', 'Stop'] as const
const HOOK_KIND_MAP: Record<(typeof HOOK_EVENTS)[number], string> = {
  SessionStart: 'session-start',
  UserPromptSubmit: 'prompt-submit',
  PostToolUse: 'tool-use',
  Stop: 'session-quiet',
}
const DIGICODA_HOOK_MARK = 'digicoda-hook-v1'

type ClaudeHook = {
  type: 'command'
  command: string
  description?: string
}
type ClaudeHookGroup = { matcher?: string; hooks: ClaudeHook[] }
type ClaudeSettings = { hooks?: Record<string, ClaudeHookGroup[]>; [k: string]: unknown }

export function isClaudeCodePresent(): boolean {
  return fs.existsSync(CLAUDE_DIR)
}

function resolveNodeBinary(): string {
  try {
    const out = execSync(process.platform === 'win32' ? 'where node' : 'which node', {
      encoding: 'utf-8',
    })
    return out.split(/\r?\n/)[0]?.trim() || 'node'
  } catch {
    return 'node'
  }
}

function buildCommand(node: string, kind: string): string {
  return `${JSON.stringify(node)} ${JSON.stringify(PATHS.recordJs)} claude-code ${kind}`
}

function loadSettings(): ClaudeSettings {
  if (!fs.existsSync(CLAUDE_SETTINGS)) return {}
  try {
    return JSON.parse(fs.readFileSync(CLAUDE_SETTINGS, 'utf-8')) as ClaudeSettings
  } catch {
    return {}
  }
}

function saveSettings(s: ClaudeSettings): void {
  fs.mkdirSync(CLAUDE_DIR, { recursive: true })
  fs.writeFileSync(CLAUDE_SETTINGS, JSON.stringify(s, null, 2))
}

function backupSettings(): void {
  if (fs.existsSync(CLAUDE_SETTINGS) && !fs.existsSync(BACKUP)) {
    fs.copyFileSync(CLAUDE_SETTINGS, BACKUP)
  }
}

export type InstallResult = { installed: boolean; reason?: string }

export function areHooksInstalled(): boolean {
  const s = loadSettings()
  const hooks = s.hooks ?? {}
  for (const evt of HOOK_EVENTS) {
    const groups = hooks[evt] ?? []
    const found = groups.some((g) => g.hooks.some((h) => h.description === DIGICODA_HOOK_MARK))
    if (!found) return false
  }
  return true
}

export function installHooks(): InstallResult {
  if (!isClaudeCodePresent()) {
    return { installed: false, reason: 'Claude Code not detected (~/.claude/ missing)' }
  }
  fs.mkdirSync(PATHS.hooksDir, { recursive: true })
  fs.writeFileSync(PATHS.recordJs, RECORD_JS)
  fs.chmodSync(PATHS.recordJs, 0o755)

  backupSettings()
  const node = resolveNodeBinary()
  const s = loadSettings()
  s.hooks ??= {}

  for (const evt of HOOK_EVENTS) {
    const kind = HOOK_KIND_MAP[evt]
    s.hooks[evt] ??= []
    // Remove any prior digicoda entries to keep idempotent
    s.hooks[evt] = s.hooks[evt]!.map((g) => ({
      ...g,
      hooks: g.hooks.filter((h) => h.description !== DIGICODA_HOOK_MARK),
    })).filter((g) => g.hooks.length > 0)
    s.hooks[evt]!.push({
      hooks: [
        {
          type: 'command',
          command: buildCommand(node, kind),
          description: DIGICODA_HOOK_MARK,
        },
      ],
    })
  }

  saveSettings(s)
  return { installed: true }
}

export function uninstallHooks(): void {
  const s = loadSettings()
  if (!s.hooks) return
  for (const evt of HOOK_EVENTS) {
    if (!s.hooks[evt]) continue
    s.hooks[evt] = s.hooks[evt]!
      .map((g) => ({ ...g, hooks: g.hooks.filter((h) => h.description !== DIGICODA_HOOK_MARK) }))
      .filter((g) => g.hooks.length > 0)
    if (s.hooks[evt]!.length === 0) delete s.hooks[evt]
  }
  saveSettings(s)
}
```

- [ ] **Step 3: typecheck 통과**

Run: `pnpm --filter digicoda typecheck`
Expected: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add packages/extension/src/hooks/
git commit -m "feat(extension): Claude Code hook installer/uninstaller (idempotent)"
```

---

## Phase 9 — UI: Status Bar

### Task 18: StatusBarItem

**Files:**
- Create: `packages/extension/src/ui/statusbar.ts`

- [ ] **Step 1: statusbar.ts 작성**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/extension/src/ui/statusbar.ts`:

```ts
import * as vscode from 'vscode'
import type { PetState } from '@digicoda/core'
import { loadConfig } from '../state/io.js'

export class StatusBar {
  private item: vscode.StatusBarItem

  constructor() {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100)
    this.item.command = 'digicoda.showSidebar'
  }

  update(state: PetState) {
    const cfg = loadConfig()
    if (!cfg.ui.statusBar) {
      this.item.hide()
      return
    }
    this.item.text = formatStatusText(state)
    this.item.tooltip = buildTooltip(state)
    this.item.show()
  }

  dispose() {
    this.item.dispose()
  }
}

function formatStatusText(state: PetState): string {
  if (state.rip) return '$(person) ⚰ R.I.P.'
  if (state.stage === 'egg') return '$(person) 🥚 Egg'
  const level = 1 + Math.floor(state.xp.totalActiveSec / 3600)
  const careWarn = state.careMiss.inStageCount >= 3 ? ' ⚠' : ''
  return `$(person) ${state.digimonId} L${level}${careWarn}`
}

function buildTooltip(state: PetState): string {
  const hoursActive = (state.xp.totalActiveSec / 3600).toFixed(1)
  return [
    `Stage: ${state.stage}`,
    `Digimon: ${state.digimonId}`,
    `Total active: ${hoursActive}h`,
    `Care miss (in-stage): ${state.careMiss.inStageCount}`,
  ].join('\n')
}
```

- [ ] **Step 2: typecheck 통과**

Run: `pnpm --filter digicoda typecheck`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add packages/extension/src/ui/statusbar.ts
git commit -m "feat(extension): status bar mini indicator"
```

---

## Phase 10 — UI: Webview (Panel + Sidebar)

### Task 19: Webview 공통 HTML 생성기

**Files:**
- Create: `packages/extension/src/ui/webview-html.ts`

- [ ] **Step 1: webview-html.ts 작성**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/extension/src/ui/webview-html.ts`:

```ts
import * as vscode from 'vscode'
import * as path from 'node:path'

export type WebviewMode = 'panel' | 'sidebar'

export function renderWebviewHtml(opts: {
  webview: vscode.Webview
  mode: WebviewMode
  spritesRoot: vscode.Uri
}): string {
  const { webview, mode, spritesRoot } = opts
  const spriteBase = webview.asWebviewUri(spritesRoot).toString()
  const csp = webview.cspSource
  const nonce = randomNonce()

  return /* html */ `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none';
                 img-src ${csp} https: data:;
                 script-src 'nonce-${nonce}';
                 style-src ${csp} 'unsafe-inline';
                 font-src ${csp};">
  <style>
    html, body {
      margin: 0; padding: 0;
      width: 100%; height: 100%;
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      font-family: var(--vscode-font-family);
      overflow: hidden;
    }
    #stage {
      position: relative;
      width: 100%;
      height: ${mode === 'sidebar' ? '160px' : '180px'};
      background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
      border-bottom: 1px solid var(--vscode-panel-border);
      overflow: hidden;
    }
    #stage::after {
      content: '';
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 16px;
      background: rgba(0,0,0,0.4);
    }
    #pet {
      position: absolute;
      bottom: 16px;
      width: 96px; height: 96px;
      image-rendering: pixelated;
      transform: translateX(-50%);
      transition: transform 0.05s linear;
    }
    #pet.flip {
      transform: translateX(-50%) scaleX(-1);
    }
    #pet.flip-only {
      transform: scaleX(-1);
    }
    #info {
      padding: 12px;
      display: flex;
      flex-direction: ${mode === 'sidebar' ? 'column' : 'row'};
      gap: 12px;
      font-size: 12px;
    }
    .info-block { flex: 1; }
    .info-title { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
    .info-sub { opacity: 0.7; margin-bottom: 8px; }
    .bar {
      height: 6px; background: var(--vscode-progressBar-background, #444);
      border-radius: 3px; overflow: hidden;
    }
    .bar-fill {
      height: 100%; background: var(--vscode-progressBar-foreground, #6fc);
      transition: width 0.3s ease;
    }
    .care-dots { display: flex; gap: 4px; margin-top: 4px; }
    .care-dot { width: 8px; height: 8px; border-radius: 50%; background: #444; }
    .care-dot.filled { background: #f66; }
    .row { display: flex; justify-content: space-between; margin-top: 4px; }
    .row span:first-child { opacity: 0.6; }
    #evolve-overlay {
      position: absolute;
      inset: 0;
      display: none;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0);
      pointer-events: none;
      transition: background 0.3s;
    }
    #evolve-overlay.active { display: flex; background: rgba(255,255,255,0.6); }
    #evolve-text {
      color: #fff;
      font-size: 18px;
      font-weight: 700;
      text-shadow: 0 0 8px #000;
    }
  </style>
</head>
<body>
  <div id="stage">
    <img id="pet" src="" />
    <div id="evolve-overlay"><div id="evolve-text"></div></div>
  </div>
  <div id="info">
    <div class="info-block">
      <div class="info-title" id="name">—</div>
      <div class="info-sub" id="stage-text">—</div>
      <div class="row"><span>XP</span><span id="xp-text">0%</span></div>
      <div class="bar"><div class="bar-fill" id="xp-bar" style="width:0%"></div></div>
      <div class="row" style="margin-top:8px"><span>Care</span><span id="care-text">0/12</span></div>
      <div class="care-dots" id="care-dots"></div>
    </div>
  </div>

  <script nonce="${nonce}">
    const SPRITE_BASE = ${JSON.stringify(spriteBase)};
    const MODE = ${JSON.stringify(mode)};

    const vscode = acquireVsCodeApi();
    const pet = document.getElementById('pet');
    const evolveOverlay = document.getElementById('evolve-overlay');
    const evolveText = document.getElementById('evolve-text');

    const STATE = { x: 50, dir: 1, action: 'IDLE', ticksLeft: 50, frame: 0, sprite: null };

    const STAGE_W = () => document.getElementById('stage').clientWidth;
    const PET_W = 96;

    function petUri(digimonId, key) {
      return SPRITE_BASE + '/' + digimonId + '/' + key + '.png';
    }

    function chooseNextAction() {
      const r = Math.random();
      if (r < 0.6) {
        STATE.action = 'WALK';
        STATE.dir = Math.random() < 0.5 ? -1 : 1;
        STATE.ticksLeft = 30 + Math.floor(Math.random() * 50);
      } else if (r < 0.8) {
        STATE.action = 'GLANCE';
        STATE.ticksLeft = 10 + Math.floor(Math.random() * 10);
      } else {
        STATE.action = 'IDLE';
        STATE.ticksLeft = 50 + Math.floor(Math.random() * 100);
      }
    }

    function tick() {
      STATE.frame = (STATE.frame + 1) % 1000;
      const w = STAGE_W();
      if (STATE.action === 'WALK') {
        STATE.x += STATE.dir * 1.2;
        if (STATE.x <= PET_W / 2) { STATE.x = PET_W / 2; STATE.dir = 1; }
        if (STATE.x >= w - PET_W / 2) { STATE.x = w - PET_W / 2; STATE.dir = -1; }
        pet.style.left = STATE.x + 'px';
        pet.classList.toggle('flip', STATE.dir === -1);
      } else {
        pet.style.left = STATE.x + 'px';
      }
      if (--STATE.ticksLeft <= 0) chooseNextAction();
    }

    setInterval(tick, 100);

    function applyState(s) {
      STATE.sprite = s.digimonId;
      const digimonId = s.rip ? null : s.digimonId;
      pet.src = digimonId ? petUri(digimonId, 'idle') : '';
      document.getElementById('name').textContent = s.rip
        ? 'R.I.P.'
        : prettify(s.digimonId);
      document.getElementById('stage-text').textContent = s.rip
        ? ('Died: ' + (s.rip.cause || 'unknown'))
        : (s.stage + ' · L' + (1 + Math.floor(s.xp.totalActiveSec / 3600)));

      // XP bar: progress within current stage
      const pct = s.rip ? 0 : Math.min(100, Math.floor(
        100 * s.xp.inStageActiveSec / Math.max(1, s.xpRequiredForStage || 1)
      ));
      document.getElementById('xp-bar').style.width = pct + '%';
      document.getElementById('xp-text').textContent = pct + '%';

      // Care dots
      const max = 12;
      const filled = Math.min(max, s.careMiss.inStageCount);
      document.getElementById('care-text').textContent = filled + '/' + max;
      const dots = document.getElementById('care-dots');
      dots.innerHTML = '';
      for (let i = 0; i < max; i++) {
        const d = document.createElement('div');
        d.className = 'care-dot' + (i < filled ? ' filled' : '');
        dots.appendChild(d);
      }
    }

    function flashEvolve(toName) {
      evolveText.textContent = toName + '!';
      evolveOverlay.classList.add('active');
      setTimeout(() => evolveOverlay.classList.remove('active'), 1800);
    }

    function prettify(id) {
      return id.replace(/(^|-)(\\w)/g, (_, sep, c) => (sep === '-' ? ' ' : '') + c.toUpperCase());
    }

    window.addEventListener('message', (e) => {
      const msg = e.data;
      if (msg.type === 'state') applyState(msg.state);
      if (msg.type === 'init') {
        applyState(msg.state);
        STATE.x = STAGE_W() / 2;
        pet.style.left = STATE.x + 'px';
      }
      if (msg.type === 'trigger' && msg.event === 'evolve') flashEvolve(prettify(msg.toName));
    });

    vscode.postMessage({ type: 'ready' });
  </script>
</body>
</html>`
}

function randomNonce(): string {
  let s = ''
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  for (let i = 0; i < 24; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}
```

- [ ] **Step 2: typecheck 통과**

Run: `pnpm --filter digicoda typecheck`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add packages/extension/src/ui/webview-html.ts
git commit -m "feat(extension): unified webview HTML with pet behavior loop"
```

---

### Task 20: Panel Webview Host

**Files:**
- Create: `packages/extension/src/ui/panel.ts`

- [ ] **Step 1: panel.ts 작성**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/extension/src/ui/panel.ts`:

```ts
import * as vscode from 'vscode'
import * as path from 'node:path'
import type { PetState } from '@digicoda/core'
import { renderWebviewHtml } from './webview-html.js'

let current: vscode.WebviewPanel | null = null

export function getSpritesRoot(): vscode.Uri {
  // @digicoda/data is a workspace dep, resolve its package root from CommonJS.
  const dataPkg = require.resolve('@digicoda/data/package.json')
  return vscode.Uri.file(path.join(path.dirname(dataPkg), 'sprites'))
}

export function showPanel(context: vscode.ExtensionContext, initialState: PetState): vscode.WebviewPanel {
  if (current) {
    current.reveal(vscode.ViewColumn.Beside)
    return current
  }
  const spritesRoot = getSpritesRoot()
  const panel = vscode.window.createWebviewPanel(
    'digicoda.panel',
    'DigiCoda',
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [spritesRoot],
    },
  )
  panel.webview.html = renderWebviewHtml({ webview: panel.webview, mode: 'panel', spritesRoot })
  panel.onDidDispose(() => {
    current = null
  })
  panel.webview.onDidReceiveMessage((msg) => {
    if (msg.type === 'ready') {
      panel.webview.postMessage({ type: 'init', state: initialState })
    }
  })
  current = panel
  return panel
}

export function postPanelState(state: PetState) {
  current?.webview.postMessage({ type: 'state', state })
}

export function postPanelEvolve(toName: string) {
  current?.webview.postMessage({ type: 'trigger', event: 'evolve', toName })
}
```

- [ ] **Step 2: typecheck 통과**

Run: `pnpm --filter digicoda typecheck`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add packages/extension/src/ui/panel.ts
git commit -m "feat(extension): Panel webview host"
```

---

### Task 21: Sidebar WebviewView Provider

**Files:**
- Create: `packages/extension/src/ui/sidebar.ts`

- [ ] **Step 1: sidebar.ts 작성**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/extension/src/ui/sidebar.ts`:

```ts
import * as vscode from 'vscode'
import type { PetState } from '@digicoda/core'
import { renderWebviewHtml } from './webview-html.js'
import { getSpritesRoot } from './panel.js'

export class SidebarProvider implements vscode.WebviewViewProvider {
  static viewType = 'digicoda.sidebar'
  private view?: vscode.WebviewView
  private latestState: PetState | null = null

  constructor(private context: vscode.ExtensionContext) {}

  setLatestState(state: PetState) {
    this.latestState = state
  }

  resolveWebviewView(view: vscode.WebviewView) {
    this.view = view
    const spritesRoot = getSpritesRoot()
    view.webview.options = { enableScripts: true, localResourceRoots: [spritesRoot] }
    view.webview.html = renderWebviewHtml({ webview: view.webview, mode: 'sidebar', spritesRoot })
    view.webview.onDidReceiveMessage((msg) => {
      if (msg.type === 'ready' && this.latestState) {
        view.webview.postMessage({ type: 'init', state: this.latestState })
      }
    })
  }

  postState(state: PetState) {
    this.latestState = state
    this.view?.webview.postMessage({ type: 'state', state })
  }

  postEvolve(toName: string) {
    this.view?.webview.postMessage({ type: 'trigger', event: 'evolve', toName })
  }
}
```

- [ ] **Step 2: typecheck 통과**

Run: `pnpm --filter digicoda typecheck`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add packages/extension/src/ui/sidebar.ts
git commit -m "feat(extension): Sidebar WebviewView provider"
```

---

## Phase 11 — XP Required Lookup (UI helper)

### Task 22: 현재 스테이지 XP requirement 헬퍼

**Files:**
- Create: `packages/extension/src/state/xp-required.ts`

- [ ] **Step 1: xp-required.ts 작성**

Write `/Users/hendrix/Desktop/private/DigiCoda/packages/extension/src/state/xp-required.ts`:

```ts
import * as fs from 'node:fs'
import * as path from 'node:path'
import type { EvolutionRule, PetState } from '@digicoda/core'

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
```

- [ ] **Step 2: typecheck 통과**

Run: `pnpm --filter digicoda typecheck`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add packages/extension/src/state/xp-required.ts
git commit -m "feat(extension): xp-required lookup helper for UI"
```

---

## Phase 12 — Extension Glue

### Task 23: extension.ts 최종 통합

**Files:**
- Modify: `packages/extension/src/extension.ts`

- [ ] **Step 1: extension.ts 작성**

Replace `/Users/hendrix/Desktop/private/DigiCoda/packages/extension/src/extension.ts`:

```ts
import * as vscode from 'vscode'
import * as fs from 'node:fs'
import chokidar from 'chokidar'
import { PATHS } from './state/paths.js'
import { loadState, ensureDirs } from './state/io.js'
import { runReducerOnce } from './state/runner.js'
import { enrichStateForView } from './state/xp-required.js'
import { startActivityRecorder } from './activity/recorder.js'
import * as path from 'node:path'
import {
  installHooks,
  uninstallHooks,
  areHooksInstalled,
  isClaudeCodePresent,
} from './hooks/installer.js'
import { StatusBar } from './ui/statusbar.js'
import { showPanel, postPanelState, postPanelEvolve } from './ui/panel.js'
import { SidebarProvider } from './ui/sidebar.js'

let statusBar: StatusBar | undefined
let sidebar: SidebarProvider | undefined
const REDUCER_TICK_MS = 5 * 60 * 1000
let lastEvolutionLen = 0

export function activate(context: vscode.ExtensionContext) {
  ensureDirs()

  statusBar = new StatusBar()
  sidebar = new SidebarProvider(context)
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, sidebar),
    statusBar,
  )

  startActivityRecorder(context)

  // Initial reduce + UI sync
  syncOnce(context)

  // events.jsonl watcher (debounced)
  let debounceTimer: NodeJS.Timeout | undefined
  const watcher = chokidar.watch(PATHS.events, {
    persistent: true,
    awaitWriteFinish: { stabilityThreshold: 50, pollInterval: 25 },
  })
  watcher.on('add', schedule)
  watcher.on('change', schedule)
  context.subscriptions.push({ dispose: () => watcher.close() })

  function schedule() {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => syncOnce(context), 100)
  }

  // Periodic tick to advance care-miss timers even without events
  const interval = setInterval(() => syncOnce(context), REDUCER_TICK_MS)
  context.subscriptions.push({ dispose: () => clearInterval(interval) })

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('digicoda.showPanel', () => {
      const enriched = enrichStateForView(loadState())
      showPanel(context, enriched)
    }),
    vscode.commands.registerCommand('digicoda.showSidebar', () => {
      vscode.commands.executeCommand('digicoda.sidebar.focus')
    }),
    vscode.commands.registerCommand('digicoda.installHooks', async () => {
      const res = installHooks()
      if (res.installed) vscode.window.showInformationMessage('DigiCoda: Claude Code hooks installed.')
      else vscode.window.showWarningMessage(`DigiCoda: ${res.reason ?? 'install failed'}`)
    }),
    vscode.commands.registerCommand('digicoda.uninstallHooks', () => {
      uninstallHooks()
      vscode.window.showInformationMessage('DigiCoda: Claude Code hooks removed.')
    }),
    vscode.commands.registerCommand('digicoda.resetPet', async () => {
      const yes = await vscode.window.showWarningMessage(
        'Reset pet? Current pet will be moved to graveyard.',
        { modal: true },
        'Reset',
      )
      if (yes !== 'Reset') return
      try {
        if (fs.existsSync(PATHS.events)) fs.rmSync(PATHS.events)
        if (fs.existsSync(PATHS.state)) fs.rmSync(PATHS.state)
      } catch (e) {
        console.error('[digicoda] reset error:', e)
      }
      syncOnce(context)
    }),
  )

  // First-run: offer hook installation
  if (isClaudeCodePresent() && !areHooksInstalled() && !isPromptSuppressed()) {
    promptHookInstall()
  }
}

function isPromptSuppressed(): boolean {
  return fs.existsSync(path.join(PATHS.hooksDir, '.suppress-prompt'))
}

async function promptHookInstall() {
  const action = await vscode.window.showInformationMessage(
    'DigiCoda can track Claude Code activity by installing 4 hooks in ~/.claude/settings.json. Install now?',
    'Install',
    'Later',
    "Don't ask again",
  )
  if (action === 'Install') {
    const res = installHooks()
    if (res.installed) vscode.window.showInformationMessage('DigiCoda: Hooks installed.')
    else vscode.window.showWarningMessage(`DigiCoda: ${res.reason ?? 'install failed'}`)
  } else if (action === "Don't ask again") {
    // Persist in workspace state
    // (Globally suppressing for now via a marker file)
    fs.writeFileSync(PATHS.hooksDir + '/.suppress-prompt', '1')
  }
}

function syncOnce(_context?: vscode.ExtensionContext) {
  try {
    const result = runReducerOnce()
    const enriched = enrichStateForView(result.state)

    statusBar?.update(result.state)
    sidebar?.postState(enriched)
    postPanelState(enriched)

    if (result.evolved) {
      const last = result.state.evolutionHistory[result.state.evolutionHistory.length - 1]!
      if (lastEvolutionLen !== result.state.evolutionHistory.length) {
        lastEvolutionLen = result.state.evolutionHistory.length
        const toName = last.to
        sidebar?.postEvolve(toName)
        postPanelEvolve(toName)
        vscode.window.showInformationMessage(
          `${last.from} evolved into ${toName}!`,
        )
      }
    }
    if (result.ripped) {
      vscode.window
        .showWarningMessage(
          'Your DigiCoda passed away from neglect. Start a new egg?',
          'Yes, new pet',
          'No, keep memorial',
        )
        .then((c) => {
          if (c === 'Yes, new pet') {
            vscode.commands.executeCommand('digicoda.resetPet')
          }
        })
    }
  } catch (e) {
    console.error('[digicoda] sync error:', e)
  }
}

export function deactivate() {
  statusBar?.dispose()
}
```

- [ ] **Step 2: 빌드 통과**

```bash
pnpm --filter digicoda build
```

Expected: `dist/extension.js` 생성, 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add packages/extension/src/extension.ts
git commit -m "feat(extension): wire everything in extension.ts"
```

---

## Phase 13 — Sanity Manual Check

### Task 24: VS Code Extension Host 매뉴얼 실행

이 단계는 자동화 없이 사용자가 직접 실행해보는 단계. 검수 체크리스트.

- [ ] **Step 1: VS Code에서 워크스페이스 열기**

VS Code에서 `/Users/hendrix/Desktop/private/DigiCoda/packages/extension`을 폴더로 열고, F5 (Run Extension)로 Extension Development Host 띄움.

- [ ] **Step 2: 시작 동작 확인**

- 상태바 좌측에 "$(person) 🥚 Egg" 표시 확인
- (Claude Code 설치 환경에서) "Install hooks" 모달 등장 확인 → "Install" 선택 → `~/.claude/settings.json` 갱신 확인
- `cat ~/.digicoda/state.json` → schemaVersion 1, stage=egg

- [ ] **Step 3: Sidebar 표시**

- Activity Bar의 DigiCoda 아이콘 클릭 → 사이드바에 펫이 보이는 placeholder 색상으로 표시
- 펫이 움직이는지 확인

- [ ] **Step 4: Panel 표시**

- Command Palette → `DigiCoda: Show Panel` → 별도 패널에 동일 펫 표시

- [ ] **Step 5: 활동 기록 검증**

- VS Code에서 파일 열고 30초+ 간격으로 편집
- `cat ~/.digicoda/events.jsonl` → `vscode` src 이벤트 라인 누적 확인

- [ ] **Step 6: Claude Code 활동 검증**

- 별도 터미널에서 `claude-code` 실행, 짧은 대화
- `cat ~/.digicoda/events.jsonl` → `claude-code` src 이벤트 (session-start, prompt-submit, tool-use, session-quiet) 확인

- [ ] **Step 7: 진화 강제 테스트**

```bash
# 활동 시뮬레이션: 1분 간격 이벤트 20개로 5분 active 채우기
node -e '
const fs=require("fs"),path=require("path"),os=require("os");
const file=path.join(os.homedir(),".digicoda","events.jsonl");
const now=Math.floor(Date.now()/1000);
for (let i=0;i<20;i++) {
  const ts=now-(20-i)*60;
  fs.appendFileSync(file, JSON.stringify({ts,src:"vscode",kind:"text-change"})+"\n");
}
'
```

5분 이내 (또는 즉시 Command: `DigiCoda: Show Sidebar` 등 액션) reducer가 돌아 stage가 `baby`로 진화 확인 + 알림 모달 표시.

- [ ] **Step 8: 결과 기록**

문제 발견 시 별도 이슈로 정리. 통과 시:

```bash
git commit --allow-empty -m "test(manual): MVP sanity walk-through passed"
```

---

## Phase 14 — README & Packaging

### Task 25: README 작성

**Files:**
- Create: `README.md`

- [ ] **Step 1: README 작성**

Write `/Users/hendrix/Desktop/private/DigiCoda/README.md`:

```markdown
# DigiCoda

Digimon-themed virtual pet for VS Code / Cursor. Grows with your coding activity — including Claude Code sessions.

## Features

- Pet hatches from a Digi-Egg and evolves through 5 stages (egg → baby → child → adult → perfect)
- Evolution branches by **care miss count**: light / standard / dark
- Tracks **active time** from VS Code editing AND Claude Code session activity
- Pet wanders the panel/sidebar autonomously (idle, walk, glance, sleep)
- Configurable display: Panel, Sidebar, or status bar mini indicator

## Installation

Install from the VSIX:

```bash
code --install-extension digicoda-0.1.0-dev.vsix
```

## Claude Code Integration

On first activation, DigiCoda offers to install 4 hooks into `~/.claude/settings.json`:
- `SessionStart`, `UserPromptSubmit`, `PostToolUse`, `Stop`

These hooks record activity to `~/.digicoda/events.jsonl` via a small `record.js` script. Your existing hooks are preserved (merged, not replaced). Run `DigiCoda: Uninstall Claude Code Hooks` to remove.

## File Locations

- `~/.digicoda/state.json` — current pet state
- `~/.digicoda/events.jsonl` — activity log
- `~/.digicoda/config.json` — user config
- `~/.digicoda/graveyard.jsonl` — pets that passed away

## Credits & License

- Codachi by [@blairjordan](https://github.com/blairjordan/codachi) for the inspiration
- Sprites adapted from With the Will community full-color digimon sprite sheet
- This is a non-commercial fan project. Digimon is a trademark of Bandai Namco.
- License: MIT
```

- [ ] **Step 2: 커밋**

```bash
git add README.md
git commit -m "docs: add README"
```

---

### Task 26: VSIX 패키징

- [ ] **Step 1: data 패키지 빌드 (스프라이트 생성)**

```bash
pnpm --filter @digicoda/data build
```

- [ ] **Step 2: core 빌드**

```bash
pnpm --filter @digicoda/core build
```

- [ ] **Step 3: extension 빌드**

```bash
pnpm --filter digicoda build
```

- [ ] **Step 4: VSIX 패키지 생성**

```bash
pnpm --filter digicoda package
```

Expected: `packages/extension/digicoda-0.1.0-dev.vsix` 생성.

- [ ] **Step 5: 로컬 설치 (선택)**

```bash
code --install-extension packages/extension/digicoda-0.1.0-dev.vsix
```

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "build: produce v0.1.0-dev VSIX"
```

---

## Self-Review Notes (작성자 메모)

스펙 §1~§13 항목 대비:

| 스펙 항목 | 구현 위치 |
|---|---|
| §5 Architecture (모노레포) | Task 1~3, 4, 13 |
| §6.1 PetState | Task 5 |
| §6.2 Event | Task 5 (ActivityEvent) |
| §6.3 Digimon, §6.4 EvolutionRule, §6.5 Config | Task 5, 11 |
| §7.1 Active time | Task 6 |
| §7.2 Care miss | Task 7 |
| §7.3 Level (파생) | statusbar.ts, webview-html.ts에서 inline 계산 |
| §7.4 Evolution | Task 8 |
| §7.5 튜닝 기본값 | core types.ts DEFAULT_TUNABLES + data/evolution.json |
| §8.1 Claude Code 훅 | Task 17 |
| §8.2 VS Code activity | Task 16 |
| §8.3 다중 쓰기 안전성 | io.ts에서 appendFileSync (O_APPEND) |
| §9.1~9.5 Webview UI | Task 19~21 |
| §9.6 진화 연출 | webview-html.ts evolve-overlay + extension.ts 트리거 |
| §9.7 메시지 프로토콜 | webview-html.ts + panel.ts + sidebar.ts |
| §9.8 Versioning | state.json schemaVersion: 1, MVP에서 단일 버전 |
| §10 Error handling | io.ts (corrupted state 복구), reducer (time-regression skip), recorder (try/catch) |
| §11 Testing | Task 6~10 단위, Task 24 매뉴얼 |
| §12 Open Questions | TBD — 콘텐츠 PR, 베타 튜닝 |

**미커버 항목**:
- 진화 연출의 상세 시퀀스(흰 실루엣 깜박임)는 단순화된 flash로 구현 — 추후 폴리시
- HAPPY/SAD 액션 발화는 reducer 결과만으로는 부족, 후속 PR에서 reducer가 변화량을 함께 반환하도록 확장 필요. MVP에서는 진화 연출만 발화.
- Pet 클릭 인터랙션은 webview-html.ts에 핸들러 미배치 — 후속 PR.

이 부분은 v0.1.x 패치에서 보강.

---

**플랜 끝.** 실행 시 phase 단위로 체크포인트를 권장합니다.
