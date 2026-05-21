# DigiCoda — Design Spec

- **Date:** 2026-05-21
- **Status:** Draft (awaiting user review)
- **Author:** hendrix (브레인스토밍 협업: Claude Code)

---

## 1. Overview

DigiCoda는 VS Code / Cursor용 가상 펫 확장으로, [Codachi](https://github.com/blairjordan/codachi)의 디지몬(Digimon) 테마 변형이다. 사용자가 코딩(VS Code 활동 + Claude Code 사용)을 하면 펫이 활동량에 비례해 성장하고, 일정 임계치에 도달하면 V-Pet 방식으로 진화한다. 진화 분기는 **케어 미스(care miss) 누적량**에 의해 결정된다.

기존 Codachi와의 결정적 차이:
- **Claude Code 활동도 성장에 반영** — VS Code 타이핑 의존도가 낮은 사용자(거의 Claude Code로만 작업하는 경우)도 펫이 자라남
- **분기 진화** — 같은 단계 안에서도 활동 패턴에 따라 다른 디지몬으로 진화
- **케어 미스 메커닉** — 방치 시 어둠 계열로 진화하는 V-Pet 시그니처 시스템

## 2. Goals & Non-Goals

### Goals (MVP)
- ✅ VS Code 확장으로 동작 (Cursor 포함 — VS Code 포크이므로 별도 작업 없이 호환) (Panel + Sidebar + Status Bar 미니)
- ✅ Claude Code 훅 통합으로 Claude Code 세션 활동을 active time에 반영
- ✅ VS Code 활동(타이핑·포커스·파일 전환)도 active time에 반영
- ✅ 활동 기반 active time 산출 (5분 이내 갭만 누적)
- ✅ 5단계 진화 (egg → baby → child → adult → perfect)
- ✅ 케어 미스 기반 3분기 (light · standard · dark)
- ✅ 펫이 무대 위에서 자율적으로 돌아다님 (idle/walk/glance/happy/sad/sleep)
- ✅ 머신 전역 상태 저장 (`~/.digicoda/`)
- ✅ 15마리 규모의 로스터

### Non-Goals (v0.4+로 보류)
- ❌ 디지몬 간 배틀
- ❌ 트레이닝 미니게임
- ❌ 클라우드 동기화 (multi-device)
- ❌ 소셜·친구 보기 기능
- ❌ 디지몬 도감(역대 펫 목록) — graveyard.jsonl은 보존하나 UI 없음
- ❌ IntelliJ 등 타 에디터 지원

### Out of Scope (영구)
- 상업 배포 / VS Code Marketplace 공식 발행 (IP 정책상)

## 3. License / IP Posture

- 팬 프로젝트, 비상업, 오픈소스(MIT 또는 동등 라이선스)
- GitHub VSIX 직접 배포
- 디지몬 명칭·시각 디자인 차용. 스프라이트 출처: With the Will 커뮤니티 풀컬러 시트. README에 출처와 비상업/팬 프로젝트임을 명시
- DMCA 등 권리자 요청 시 즉시 대응 가능한 구조 유지

## 4. Roadmap (Phased Build)

| 단계 | 포함 | 결과물 |
|---|---|---|
| **MVP (v0.1~0.3 통합)** | 본 문서 전체 범위 — 진화 분기 + 케어 미스 + Claude Code/VS Code 통합 | 첫 사용 가능 릴리즈 |
| **v0.4** | 트레이닝 미니게임 | |
| **v0.5** | 배틀 (PvE / PvP) | |
| **v0.6** | 클라우드 동기화 | |

## 5. Architecture

### 5.1 디렉토리 구조 (모노레포)

```
DigiCoda/
├─ packages/
│   ├─ extension/          VS Code 확장 본체
│   │   └─ src/
│   │       ├─ extension.ts            진입점
│   │       ├─ state/                  상태 파일 I/O
│   │       ├─ activity/               VS Code 이벤트 → events.jsonl
│   │       ├─ mechanics/              core 위임 어댑터
│   │       ├─ ui/
│   │       │   ├─ panel.ts            Panel Webview
│   │       │   ├─ sidebar.ts          Sidebar Webview (WebviewViewProvider)
│   │       │   └─ statusbar.ts        StatusBarItem
│   │       ├─ hooks/                  Claude Code 훅 설치·검증·제거
│   │       └─ webview/                Webview 클라이언트 (HTML/JS/CSS)
│   ├─ core/               순수 도메인 로직 (VS Code 비의존)
│   │   └─ src/
│   │       ├─ types.ts                State, Event, Digimon 등
│   │       ├─ reducer.ts              events.jsonl → state
│   │       ├─ evolution.ts            진화 규칙 평가
│   │       ├─ care-miss.ts            케어 미스 누적 계산
│   │       └─ xp.ts                   active time 계산
│   └─ data/               런타임 데이터
│       ├─ roster.json
│       ├─ evolution.json
│       └─ sprites/        png 파일들
├─ docs/superpowers/specs/
└─ ...
```

### 5.2 핵심 분리 원칙

- `core`: **VS Code API에 의존하지 않는 순수 함수 모듈.** Node 단독으로 vitest 검증 가능. 향후 다른 에디터/CLI 뷰어로 재사용.
- `extension`: VS Code 통합 어댑터. 이벤트를 받아 core에 위임하고, core의 출력 state를 렌더링.
- `data`: 게임 콘텐츠. 코드 변경 없이 데이터만 교체해도 진화 트리·로스터 확장 가능.

### 5.3 상태 디렉토리

```
~/.digicoda/
├─ state.json           현재 펫 상태 (derived from events.jsonl)
├─ events.jsonl         활동 이벤트 append-only
├─ config.json          사용자 설정
├─ graveyard.jsonl      사망한 과거 펫 기록
├─ hooks/
│   └─ record.js        Claude Code 훅이 호출하는 작은 Node 스크립트
└─ logs/                디버그 로그 (선택, 환경변수로 활성화)
```

`state.json`은 `events.jsonl`의 파생 상태. 손상 시 events.jsonl로 cold rebuild 가능.

### 5.4 데이터 흐름

```
Claude Code Hooks  ─append──┐
                            │
                            ▼
                ~/.digicoda/events.jsonl
                            │
                            │ watch (chokidar, 100ms debounce)
                            ▼
              Reducer (core, 순수 함수)
                            │
                            ▼
                ~/.digicoda/state.json
                            │
                            ▼
            StateBus.emit('change')
                            │
                ┌───────────┼───────────┐
                ▼           ▼           ▼
            Panel       Sidebar     StatusBar
           Webview      Webview      Item
                ▲           ▲
                │           │
                └─postMessage(state)
```

추가로, VS Code Activity Recorder는 같은 events.jsonl에 자기 이벤트를 append.

## 6. Data Models

### 6.1 PetState (`state.json`)

```ts
type PetState = {
  schemaVersion: 1
  petId: string                  // UUID v4
  bornAt: number                 // unix epoch seconds

  digimonId: string              // roster.json 키
  stage: 'egg' | 'baby' | 'child' | 'adult' | 'perfect'

  xp: {
    totalActiveSec: number       // 평생 누적
    inStageActiveSec: number     // 현재 스테이지 진입 후
  }

  careMiss: {
    inStageCount: number         // 현재 스테이지 안에서의 카운트
    lifetimeCount: number        // 통계용
  }

  lastActiveAt: number           // 마지막 활동 ts
  lastReducedEventTs: number     // reducer가 마지막으로 처리한 ts

  evolutionHistory: Array<{
    at: number
    from: string
    to: string
    careMissAtEvolve: number
    branch: 'light' | 'standard' | 'dark'
  }>

  rip?: { at: number; cause: string }
}
```

### 6.2 Event (`events.jsonl`, 한 줄 = 한 이벤트)

```json
{"ts":1779326197,"src":"claude-code","kind":"prompt-submit"}
{"ts":1779326201,"src":"claude-code","kind":"tool-use"}
{"ts":1779326260,"src":"vscode","kind":"text-change"}
{"ts":1779326315,"src":"vscode","kind":"focus"}
```

- `ts`: unix epoch seconds (정수)
- `src`: `'claude-code' | 'vscode'`
- `kind`: 이벤트 종류 — MVP에서는 모든 kind를 동일 가중치로 처리. 향후 행동 시그니처 확장 여지.

### 6.3 Digimon (`roster.json`)

```ts
type Digimon = {
  id: string                     // 'agumon'
  name: string                   // 표시명, '아구몬'
  stage: 'egg' | 'baby' | 'child' | 'adult' | 'perfect'
  sprite: {
    idle: string                 // 'agumon/idle-{0,1,...}.png' 등 패턴
    walk?: string
    happy?: string
    sad?: string
    sleep?: string
  }
  attribute?: 'vaccine' | 'data' | 'virus' | 'free'
}
```

15마리 구성 골격(세부 캐스팅은 콘텐츠 PR로 분리):
- egg ×1 (공용)
- baby ×3
- child ×3
- adult ×6 (각 child의 light/standard/dark 분기)
- perfect ×2

총 15. 캐스팅 예시:
- Child: agumon, gabumon, patamon
- Adult-light: angemon, lekismon, holyangemon-line
- Adult-standard: greymon, garurumon, ...
- Adult-dark: devimon, devidramon, ...
- Perfect: metalgreymon, weregarurumon

(*최종 캐스팅은 구현 단계에서 결정. 본 스펙은 스키마만 확정.*)

### 6.4 EvolutionRule (`evolution.json`)

```ts
type EvolutionRule = {
  from: string                   // 'agumon'
  xpRequiredSec: number          // 이 단계에서 다음 단계로 가는 데 필요한 active seconds
  branches: Array<{
    branch: 'light' | 'standard' | 'dark'
    careMissMin: number          // 포함
    careMissMax: number          // 포함. 상한 없음을 의미할 때는 충분히 큰 정수(예: 999)
                                 //   JSON 표준에 Infinity가 없으므로 sentinel로 사용
    to: string                   // 다음 디지몬 id
  }>
}
```

예시:
```json
{
  "from": "agumon",
  "xpRequiredSec": 28800,
  "branches": [
    { "branch": "light",    "careMissMin": 0, "careMissMax": 1, "to": "angemon" },
    { "branch": "standard", "careMissMin": 2, "careMissMax": 4, "to": "greymon" },
    { "branch": "dark",     "careMissMin": 5, "careMissMax": 999, "to": "devimon" }
  ]
}
```

### 6.5 Config (`config.json`)

```ts
type Config = {
  schemaVersion: 1
  ui: {
    primary: 'panel' | 'sidebar'
    statusBar: boolean
  }
  audio?: { enabled: boolean }
  notifications: { evolveAlert: boolean }
  debug?: { logEvents: boolean }
}
```

## 7. Core Mechanics

### 7.1 Active Time 누적

상수 (튜닝 가능):
- `ACTIVE_GAP_SEC = 300` (5분)
- `SEED_SEC = 30` (세션 첫 이벤트의 단독 가산)

알고리즘:
```
events를 ts 오름차순으로 처리
prev = null
for e in events:
  if prev is null:
    activeSec += SEED_SEC
  else:
    gap = e.ts - prev.ts
    if gap <= ACTIVE_GAP_SEC:
      activeSec += gap
    # else: idle 구간, 가산하지 않음
  prev = e
```

### 7.2 Care Miss 누적

상수:
- `CARE_MISS_WINDOW_SEC = 86400` (24시간)
- `CARE_MISS_RIP_LIMIT = 12` (예: 12회 누적 시 RIP. 튜닝 대상)

매번 reducer 동작 시:
```
elapsedSinceLastActive = now - state.lastActiveAt
missesAccrued = floor(elapsedSinceLastActive / CARE_MISS_WINDOW_SEC)
  - 단, 이전 reducer 실행 시점 대비 새로 누적된 분만 적용 (멱등성)
state.careMiss.inStageCount += newMisses
state.careMiss.lifetimeCount += newMisses

if state.careMiss.inStageCount >= CARE_MISS_RIP_LIMIT:
  state.rip = { at: now, cause: 'neglect' }
```

### 7.3 Level (파생값)

`level`은 state에 저장하지 않는 **파생값**:

```
level = 1 + floor(state.xp.totalActiveSec / 3600)
```

한 시간 active할 때마다 1레벨. UI 표시 전용이며 게임 메커니즘(진화 등)에는 영향 없음.

### 7.4 진화 판정

```
if state.stage != 'perfect' and not state.rip:
  rule = lookup(evolution.json, from = state.digimonId)
  if state.xp.inStageActiveSec >= rule.xpRequiredSec:
    branch = matchBranch(rule.branches, state.careMiss.inStageCount)
    evolve(state, branch.to)
    -- evolve() 내부:
       state.evolutionHistory.push({...})
       state.digimonId = branch.to
       state.stage = nextStage(state.stage)
       state.xp.inStageActiveSec = 0
       state.careMiss.inStageCount = 0
```

진화 직후 UI는 진화 연출 트리거 후 새 상태 렌더링.

### 7.5 튜닝 기본값 (MVP)

| 변수 | 기본값 | 메모 |
|---|---|---|
| `ACTIVE_GAP_SEC` | 300 (5분) | |
| `SEED_SEC` | 30 | |
| `CARE_MISS_WINDOW_SEC` | 86400 (24h) | |
| `CARE_MISS_RIP_LIMIT` | 12 | 약 2주 무활동 |
| egg → baby `xpRequiredSec` | 300 (5분 active) | 빠른 초기 만족감 |
| baby → child | 3600 (1h active) | |
| child → adult | 28800 (8h active) | |
| adult → perfect | 86400 (24h active) | |
| Reducer cron tick | 300s (5분) | 이벤트 없이도 시간 반영 |

이 값들은 모두 `config.json` 또는 컴파일 타임 상수로 조정 가능. 베타 기간에 데이터 기반 튜닝.

## 8. Integration Points

### 8.1 Claude Code Hooks

설치 대상: `~/.claude/settings.json`

| 훅 | 발화 시점 | record kind |
|---|---|---|
| `SessionStart` | 세션 시작 | `session-start` |
| `UserPromptSubmit` | 프롬프트 제출 | `prompt-submit` |
| `PostToolUse` | 도구 호출 완료 | `tool-use` |
| `Stop` | 응답 완료 | `session-quiet` |

설치 시 `~/.claude/settings.json`을 머지 패치(기존 훅 보존). 사전에 `settings.json.digicoda-backup` 백업.

훅 명령 예:
```bash
node ~/.digicoda/hooks/record.js claude-code prompt-submit
```

`record.js`:
```js
const fs = require('fs')
const path = require('path')
const os = require('os')

const [, , src, kind] = process.argv
const ts = Math.floor(Date.now() / 1000)
const line = JSON.stringify({ts, src, kind}) + '\n'

const dir = path.join(os.homedir(), '.digicoda')
fs.mkdirSync(dir, {recursive: true})
fs.appendFileSync(path.join(dir, 'events.jsonl'), line)
process.exit(0)
```

설치 플로우:
1. 확장 첫 활성화 시 `~/.claude/` 존재 확인
2. 존재하면 settings.json의 hooks에 digicoda 훅 있는지 검사
3. 없으면 사용자 동의 모달:
   ```
   "DigiCoda가 Claude Code 활동을 추적하려면 훅 설치가 필요합니다.
    ~/.claude/settings.json에 4개 훅을 추가하고
    ~/.digicoda/hooks/record.js를 생성합니다.
    [지금 설치] [나중에] [다시 묻지 않기]"
   ```
4. 설치 명령 제공: `DigiCoda: Install Claude Code Hooks`
5. 제거 명령 제공: `DigiCoda: Uninstall Claude Code Hooks`

훅 설치 시 `which node` 결과를 캐시해 settings.json에 **node의 절대 경로**를 명시 (PATH 변동 대비).

### 8.2 VS Code Activity Recorder

구독 이벤트:
- `vscode.workspace.onDidChangeTextDocument`
- `vscode.window.onDidChangeWindowState`
- `vscode.window.onDidChangeActiveTextEditor`

디바운싱: kind별로 30초당 최대 1건.

```ts
const DEBOUNCE_SEC = 30
const lastWritten: Record<string, number> = {}

function record(kind: string) {
  const now = Date.now() / 1000
  if (now - (lastWritten[kind] ?? 0) < DEBOUNCE_SEC) return
  lastWritten[kind] = now
  appendEvent({ts: Math.floor(now), src: 'vscode', kind})
}
```

윈도우가 unfocused (`windowState.focused === false`)일 때는 기록 생략.

### 8.3 다중 동시 쓰기 안전성

- POSIX `O_APPEND`는 PIPE_BUF(=4096+) 미만 단일 write에 대해 원자적
- 각 이벤트 라인은 100바이트 이하 → 안전
- Windows: `fs.appendFileSync`는 내부적으로 별도 처리. 단일 라인 append는 실제로는 충돌 가능성 매우 낮음. 발생 시에도 손상 라인 스킵으로 복구

## 9. UI / Rendering

### 9.1 호스트 구조

Panel과 Sidebar는 **동일 콘텐츠**를 다른 위치에 렌더링.

```ts
function renderHtml(state: PetState, mode: 'panel' | 'sidebar', webview: Webview): string
```

mode에 따라 무대 크기·정보 밀도만 조정.

### 9.2 레이아웃

**Panel** (가로):
```
┌────────────────────────────────────────────────┐
│                            Greymon              │
│   ┌──────────┐             Adult · Lv. 12       │
│   │   🦖     │             XP   ▰▰▰▰▰▰▰▱▱▱      │
│   │  walking │             Active today  2h 13m │
│   └──────────┘             Care   ●●○○ (2/4)    │
│                            Born   5 days ago    │
└────────────────────────────────────────────────┘
```

**Sidebar** (세로):
```
┌──────────────┐
│    🦖        │
│              │
│   Greymon    │
│  Adult · L12 │
│  XP ▰▰▰▰▰▰▰▱ │
│  Care ●●○○   │
│ [Details ▾]  │
└──────────────┘
```

**Status Bar mini**:
```
$(person)  Greymon ▰▰▰▰▰▰▰▱▱ L12
$(person)  Greymon ⚠ Care!
$(person)  💖 Egg
$(person)  ⚰ R.I.P.
```

클릭 시 주 표시 위치 토글.

### 9.3 펫 행동 상태 머신

```
       ┌──────┐
       │ IDLE │ ←──┐
       └─┬─┬──┘    │
         │ │       │
   walk │ │ glance│
   60%  │ │ 20%   │
         ▼ ▼
      ┌──────┐    ┌────────┐
      │ WALK │    │ GLANCE │
      └───┬──┘    └────┬───┘
          │            │
          └────────────┴───→ IDLE

  Event-driven trigger:
    HAPPY  (XP 급증 시, 3초)
    SAD    (care miss 누적 시, 3초)
    SLEEP  (장시간 무활동 + 야간, 활동 재개 시까지)
```

| 상태 | 진입 | 지속 |
|---|---|---|
| IDLE | 기본 | 5~15초 |
| WALK | IDLE 종료 시 60% | 무대 끝까지 또는 3~8초 |
| GLANCE | IDLE 종료 시 20% | 1~2초 |
| HAPPY | XP 급증 즉시 | 3초 |
| SAD | care miss 누적 즉시 | 3초 |
| SLEEP | 마지막 활동 30분+ AND 22:00~07:00 | 활동 재개 시까지 |

### 9.4 자율 동작 루프

매 100ms tick (webview 클라이언트 측 setInterval):
- 현재 액션에 따라 좌표 갱신·프레임 전환
- WALK 시 좌우 끝 도달하면 방향 반전
- ticksLeft 카운트다운, 0 도달 시 액션 전환 결정

### 9.5 스프라이트 렌더링

- 프레임 스왑 방식: `<img>` src를 JS로 200~500ms마다 교체
- 픽셀아트 보존: `image-rendering: pixelated` + 정수배 스케일링 (32×32 → 96×96)

### 9.6 진화 연출

```
[기존 펫] ─fade out 0.5s─> [흰 실루엣 깜박임 0.6s] ─flash─> [새 펫]
~ 2초. 끝나면 VS Code notification:
  "Agumon이(가) Greymon(으)로 진화했습니다!"
```

진화 시 펫은 무대 중앙으로 이동 후 시퀀스 재생.

### 9.7 Webview 메시지 프로토콜

```ts
// Extension → Webview
type ToWebview =
  | { type: 'init'; state: PetState; assetBase: string; mode: 'panel' | 'sidebar' }
  | { type: 'state'; state: PetState }
  | { type: 'trigger'; event: 'happy' | 'sad' | 'evolve' }

// Webview → Extension
type FromWebview =
  | { type: 'ready' }
  | { type: 'click'; target: 'pet' | 'background' }
```

펫 클릭 시 짧은 HAPPY 연출 + 활동 이벤트 1건 기록.

## 9.8 Versioning / Migration

각 파일에 `schemaVersion: number` 필드 보유. 확장 시작 시:
- 모든 파일의 schemaVersion이 현재 코드의 기대값과 일치 → 정상 로드
- 더 낮은 버전 → `state/migrations/v{N→N+1}.ts` 체인 실행
- 더 높은 버전 → "최신 버전 확장으로 업데이트하세요" 안내 + 읽기 전용 모드

MVP에서는 schemaVersion=1 단일. 마이그레이션 체인은 v0.4 이후 첫 변경 시 추가.

## 10. Error Handling / Edge Cases

| 상황 | 처리 |
|---|---|
| events.jsonl 손상 라인 | 해당 라인 스킵 + warn 로그. 다음 라인 계속 처리. |
| state.json 손상/version mismatch | events.jsonl로 cold rebuild. 빈 events면 새 알. |
| `~/.claude/` 미존재 | 훅 설치 스킵, VS Code 활동만으로 동작. |
| `~/.claude/settings.json` 권한 거부 | 사용자에게 안내 + 훅 설치 스킵. |
| 다중 VS Code 동시 쓰기 | O_APPEND 원자성 + reducer `lastReducedEventTs`로 멱등성 보장. |
| 시각 역행 | events의 ts < 직전 ts인 라인은 직전 ts로 보정. |
| 스프라이트 파일 없음 | fallback 스프라이트로 표시 + 로그. |
| 매우 긴 휴면 후 RIP | "새 알로 시작하시겠습니까?" 모달. 이전 펫은 graveyard.jsonl로 이관. |
| Node가 PATH에 없음 | 훅 설치 시 `which node` 절대 경로 캐시. |

## 11. Testing Strategy

### 11.1 core 패키지 (vitest)
- `reducer.ts` 단위 — 빈 events / active time 누적 / gap 처리 / 멱등성
- `care-miss.ts` 단위 — 윈도우 경과·재개 시 리셋·RIP 발화
- `xp.ts` 단위 — 다양한 이벤트 시퀀스
- `evolution.ts` 단위 — 각 careMiss 범위에서 올바른 분기 선택

### 11.2 extension 패키지 (vscode-test)
- Activation 라이프사이클
- Webview 메시지 송수신 (mock webview)
- Status Bar 상태별 텍스트
- 설정 변경 시 UI 모드 전환

### 11.3 통합 시나리오
`scripts/scenario-test.ts` — 합성 events.jsonl 입력 → 기대 state.json 비교.
- "1주일 매일 4시간 코딩, 한 번 24시간 방치" → 예상 stage/digimonId/careMiss
- "30분 폭발적 코딩 후 즉시 종료" → baby II 진화 직전

### 11.4 매뉴얼 검증 (릴리즈 체크리스트)
- 펫 움직임 자연스러움
- 진화 연출 매끄러움
- Panel ↔ Sidebar 전환
- Claude Code 훅 실제 발화 → events.jsonl append 확인

## 12. Open Questions / TBD

콘텐츠·튜닝 영역으로 구현 단계에서 결정:

1. **15마리 정확한 캐스팅** — 어떤 디지몬을 어느 분기에 배치할지. 골격(egg×1 + baby×3 + child×3 + adult×6 + perfect×2 = 15)은 확정. 단, 진화 분기상 3 children × 3 branches = 9 adult slot에 6 adult를 매핑하려면 일부 adult가 여러 child의 분기로 공유됨(예: Devimon은 여러 다크 분기의 종착점). 캐스팅 표는 별도 콘텐츠 PR로 결정.
2. **XP 임계치 최종 튜닝** — 베타 사용자 데이터로 조정
3. **Care miss RIP 한도** — 12회가 적절한지, 사용자 피드백 필요
4. **Sound 효과** — 진화 시 효과음 여부 (현재 옵션으로만)
5. **다국어** — 한국어/영어 동시 지원할지, 영어만 할지
6. **펫 이름 커스터마이즈** — 사용자가 펫에 이름을 붙일 수 있게 할지 (도구·메뉴 부담 vs 애착감)

## 13. References

- Codachi: <https://github.com/blairjordan/codachi>
- With the Will sprite resource: 커뮤니티 풀컬러 디지몬 스프라이트 시트
- VS Code API: Webview / WebviewView / StatusBarItem 공식 문서
- Claude Code Hooks: `~/.claude/settings.json` hooks 스키마
