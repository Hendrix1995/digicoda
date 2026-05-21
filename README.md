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
