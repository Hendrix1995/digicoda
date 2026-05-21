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
