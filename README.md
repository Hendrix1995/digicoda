# DigiCoda

> A Digimon-themed virtual pet for VS Code / Cursor / Antigravity.
> Hatches from a Digi-Egg, lives in your Explorer sidebar, and **evolves with your coding** — including every Claude Code session.

---

## Highlights

| | |
|---|---|
| **6 stages** | egg → fresh → baby → child → adult → perfect → mega |
| **40 Digimon** | one playthrough only sees a slice — replayable |
| **11 egg variants** | the egg you hatch decides which of 3 lineages you start on |
| **5 personalities** | random at birth (`calm` / `gentle` / `holy` / `mischief` / `savage`) — biases evolution outcomes |
| **Lucky roll** | 12% chance per evolution to swerve onto an alternate branch |
| **Claude Code aware** | hooks auto-install; every prompt and tool use counts |
| **Care system** | neglect for ~3 days straight and your pet dies |

---

## Evolution Tree

```
          egg (11 variants)
            ↓ (variant decides lineage)
   Botamon ─┬─ Kuramon ─┬─ Poyomon          [fresh]
            ↓           ↓        ↓
       Koromon      Tsunomon   Tokomon      [baby]
            ↓           ↓        ↓
        Agumon      Gabumon   Patamon       [child]
            ↓           ↓        ↓
   ┌────────┴───────┐  …5 outcomes each based on care…
   ↓                ↓
 Greymon ··· Numemon                       [adult]
   ↓
 MetalGreymon / SkullGreymon …              [perfect]
   ↓
 WarGreymon / BlackWarGreymon …             [mega]
```

Each transition picks a branch from your **effective careMiss count**, modified by your personality and an occasional lucky roll. So two pets with the same play style still drift apart.

### Branching example (Agumon → Adult)

| careMiss | Outcome |
|:---:|---|
| 0–1 | Greymon  *(light)* |
| 2–3 | Monochromon |
| 4–5 | DarkTyrannomon |
| 6–8 | Devimon |
| 9+ | Numemon *(extreme neglect)* |

Personality shifts the careMiss used for matching by **−2 to +2** before this lookup. Lucky roll then has a 12% chance to ignore it and pick a different branch.

---

## Care System

DigiCoda tracks **active coding time** and **idle gaps**:

- Active time accumulates from VS Code editing AND Claude Code hook events
- Going **6 hours** without any activity = 1 careMiss
- **12 careMisses** = R.I.P. (pet goes to the graveyard)
- careMiss persists across stages until evolution, where it influences the branch

Reset anytime via Command Palette → **`DigiCoda: Reset Pet`**.

---

## Installation

```bash
# Replace with your editor's CLI path
code --install-extension digicoda-0.1.0-dev.vsix --force
```

Or from the GUI: Extensions panel → `...` menu → **Install from VSIX**.

After install: **`Cmd+Shift+P` → `Developer: Reload Window`**.

The pet lives in the **Explorer sidebar** as a compact `DigiCoda` section (no separate Activity Bar icon).

---

## Claude Code Integration

When DigiCoda activates and detects `~/.claude/`, it **auto-installs 4 hooks** into `~/.claude/settings.json`:

| Hook | Event recorded |
|---|---|
| `SessionStart` | `session-start` |
| `UserPromptSubmit` | `prompt-submit` |
| `PostToolUse` | `tool-use` |
| `Stop` | `session-quiet` |

Hooks are non-destructive — they're merged with your existing settings, not replaced. Each appends one line to `~/.digicoda/events.jsonl` via a tiny `record.js` script. Remove via **`DigiCoda: Uninstall Claude Code Hooks`**.

---

## File Locations

| Path | Purpose |
|---|---|
| `~/.digicoda/state.json` | current pet (id, stage, xp, careMiss, personality, eggVariant) |
| `~/.digicoda/events.jsonl` | append-only activity log |
| `~/.digicoda/config.json` | user preferences |
| `~/.digicoda/graveyard.jsonl` | pets that have passed |
| `~/.digicoda/hooks/record.js` | the tiny script Claude Code hooks call |

---

## Commands

| Command | Action |
|---|---|
| `DigiCoda: Show Panel` | open the full-size pet panel |
| `DigiCoda: Show Sidebar` | focus the Explorer sidebar pet view |
| `DigiCoda: Reset Pet` | bury the current pet and start a fresh egg |
| `DigiCoda: Install Claude Code Hooks` | manual hook install |
| `DigiCoda: Uninstall Claude Code Hooks` | remove hooks |

---

## Development

```bash
pnpm install
pnpm -r build
pnpm -r test
cd packages/extension && pnpm package   # produces .vsix
```

Local sprites (under `packages/data/sprites/*/`) are `.gitignore`d — only the placeholder generator script is committed. Real sprites live on your machine after running the extraction script locally.

---

## Credits

### Sprites

| Asset | Source |
|---|---|
| Digimon character animations *(Fresh → Mega)* | [With the Will — Digimon Sprite Animation Thread](https://withthewill.net/threads/digimon-sprite-animation-thread-read-first-post-fully-working.10472/) |
| Digi-Egg item icons *(11 variants)* | [*Digimon Digital Monsters: D-Project*](https://digimon.fandom.com/wiki/Digimon_Digital_Monsters:_D-Project) — Bandai Namco, Nintendo DS (2008) |

### Tools

- [ImageMagick](https://imagemagick.org/) — sprite extraction
- [esbuild](https://esbuild.github.io/) — extension bundling
- [Vitest](https://vitest.dev/) — tests

### Trademarks

*Digimon* and all related characters are trademarks of Bandai Namco Entertainment / Toei Animation. DigiCoda is a fan project and is **not affiliated with, endorsed by, or sponsored by** Bandai Namco or Toei.

### Takedown Notice

If you are a rights holder and have concerns about any asset referenced here, please open an [issue](../../issues) and the relevant content will be removed promptly.

### License

Code: [MIT](./LICENSE)

---
---

# DigiCoda (한국어)

> VS Code / Cursor / Antigravity에서 사는 **디지몬 가상 펫**.
> 디지타마에서 부화해서 Explorer 사이드바에 살면서 **당신이 코딩한 만큼 진화**합니다 — Claude Code 세션도 같이 카운트.

---

## 한눈에

| | |
|---|---|
| **6단계 진화** | egg → fresh → baby → child → adult → perfect → mega |
| **40종 디지몬** | 한 펫이 모든 종을 보긴 어렵습니다 — 리셋해서 다시 키워보세요 |
| **알 11종** | 어떤 알에서 부화하느냐가 3개 lineage 중 하나를 결정 |
| **성격 5종** | 출생 시 랜덤 — `calm` / `gentle` / `holy` / `mischief` / `savage` |
| **운빨 (Lucky Roll)** | 진화마다 12% 확률로 옆가지로 빠짐 |
| **Claude Code 연동** | 훅 자동 설치, 프롬프트·도구사용 전부 활동시간으로 |
| **돌봄 시스템** | 약 3일 완전 방치 → 사망(R.I.P.) |

---

## 진화 트리

```
            egg (11 variants)
              ↓ (variant이 lineage 결정)
    Botamon ─┬─ Kuramon ─┬─ Poyomon          [fresh]
              ↓           ↓        ↓
         Koromon      Tsunomon   Tokomon      [baby]
              ↓           ↓        ↓
          Agumon      Gabumon   Patamon       [child]
              ↓           ↓        ↓
     ┌────────┴───────┐  …careMiss 따라 5갈래…
     ↓                ↓
   Greymon ··· Numemon                       [adult]
     ↓
   MetalGreymon / SkullGreymon …              [perfect]
     ↓
   WarGreymon / BlackWarGreymon …             [mega]
```

각 진화는 **실효 careMiss 값**으로 분기를 결정합니다. 성격이 careMiss에 ±2 보정을 주고, 그 후 12% 확률로 운빨이 다른 가지로 끌고 가요. 같은 패턴으로 키워도 펫마다 결과가 미묘하게 달라집니다.

### 분기 예시 (Agumon → Adult)

| careMiss | 결과 |
|:---:|---|
| 0–1 | Greymon  *(light)* |
| 2–3 | Monochromon |
| 4–5 | DarkTyrannomon |
| 6–8 | Devimon |
| 9+ | Numemon *(극단 방치)* |

---

## 돌봄 시스템

DigiCoda는 **활동 시간**과 **무활동 시간**을 같이 추적합니다:

- VS Code 편집 + Claude Code 훅 이벤트 → 활동 시간 누적
- **6시간** 동안 활동 0건 → careMiss +1
- **careMiss 12개** → R.I.P. (graveyard로 이동)
- careMiss는 진화 분기 결정에 사용됨

언제든 `Cmd+Shift+P` → **`DigiCoda: Reset Pet`** 으로 새 알 시작 가능.

---

## 설치

```bash
# 본인 에디터 CLI 경로로 바꿔서 실행
code --install-extension digicoda-0.1.0-dev.vsix --force
```

또는 Extensions 패널 → `...` 메뉴 → **Install from VSIX**.

설치 후 **`Cmd+Shift+P` → `Developer: Reload Window`**.

펫은 **Explorer 사이드바**의 `DigiCoda` 섹션에 살아요 (Activity Bar에 별도 아이콘 없음).

---

## Claude Code 연동

DigiCoda가 활성화되면서 `~/.claude/`를 감지하면 **자동으로 훅 4개**를 `~/.claude/settings.json`에 설치합니다:

| 훅 | 기록되는 이벤트 |
|---|---|
| `SessionStart` | `session-start` |
| `UserPromptSubmit` | `prompt-submit` |
| `PostToolUse` | `tool-use` |
| `Stop` | `session-quiet` |

기존 설정은 덮어쓰지 않고 병합합니다. 각 훅은 작은 `record.js` 스크립트로 `~/.digicoda/events.jsonl`에 한 줄씩 append 합니다. 제거는 **`DigiCoda: Uninstall Claude Code Hooks`**.

---

## 파일 위치

| 경로 | 용도 |
|---|---|
| `~/.digicoda/state.json` | 현재 펫 상태 (id·stage·xp·careMiss·personality·eggVariant) |
| `~/.digicoda/events.jsonl` | append-only 활동 로그 |
| `~/.digicoda/config.json` | 사용자 설정 |
| `~/.digicoda/graveyard.jsonl` | 죽은 펫 묘비 |
| `~/.digicoda/hooks/record.js` | Claude Code 훅이 호출하는 작은 기록 스크립트 |

---

## 커맨드

| 커맨드 | 동작 |
|---|---|
| `DigiCoda: Show Panel` | 큰 패널 보기 |
| `DigiCoda: Show Sidebar` | Explorer 사이드바 펫에 포커스 |
| `DigiCoda: Reset Pet` | 현재 펫을 graveyard로 보내고 새 알 시작 |
| `DigiCoda: Install Claude Code Hooks` | 훅 수동 설치 |
| `DigiCoda: Uninstall Claude Code Hooks` | 훅 제거 |

---

## 개발

```bash
pnpm install
pnpm -r build
pnpm -r test
cd packages/extension && pnpm package   # .vsix 생성
```

로컬 스프라이트(`packages/data/sprites/*/`)는 `.gitignore` 처리되어 있습니다 — placeholder 생성 스크립트만 커밋되고, 실제 스프라이트는 본인 로컬에서 추출 스크립트로 만듭니다.

---

## 크레딧

### 스프라이트

| 자산 | 출처 |
|---|---|
| 디지몬 캐릭터 애니메이션 *(Fresh → Mega)* | [With the Will — Digimon Sprite Animation Thread](https://withthewill.net/threads/digimon-sprite-animation-thread-read-first-post-fully-working.10472/) |
| 디지타마 아이콘 *(11종)* | [*Digimon Digital Monsters: D-Project*](https://digimon.fandom.com/wiki/Digimon_Digital_Monsters:_D-Project) — Bandai Namco, Nintendo DS (2008) |

### 도구

- [ImageMagick](https://imagemagick.org/) — 스프라이트 추출
- [esbuild](https://esbuild.github.io/) — 익스텐션 번들
- [Vitest](https://vitest.dev/) — 테스트

### 상표

*Digimon* 및 관련 캐릭터는 Bandai Namco Entertainment / Toei Animation의 상표입니다. DigiCoda는 팬 프로젝트이며 **Bandai Namco 또는 Toei와 제휴/후원/승인 관계가 없습니다**.

### 삭제 요청

권리자께서 이 프로젝트에서 참조된 자산에 대해 우려가 있으시면 [이슈](../../issues)를 남겨주세요. 해당 콘텐츠는 신속히 제거됩니다.

### 라이선스

코드: [MIT](./LICENSE)
