import * as vscode from 'vscode'
import * as fs from 'node:fs'
import * as path from 'node:path'
import chokidar from 'chokidar'
import { PATHS } from './state/paths.js'
import { loadState, ensureDirs } from './state/io.js'
import { runReducerOnce } from './state/runner.js'
import { enrichStateForView } from './state/xp-required.js'
import { startActivityRecorder } from './activity/recorder.js'
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
  syncOnce()

  // events.jsonl watcher (debounced)
  let debounceTimer: NodeJS.Timeout | undefined
  const watcher = chokidar.watch(PATHS.events, {
    persistent: true,
    awaitWriteFinish: { stabilityThreshold: 50, pollInterval: 25 },
  })
  watcher.on('add', schedule)
  watcher.on('change', schedule)
  context.subscriptions.push({ dispose: () => { void watcher.close() } })

  function schedule() {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => syncOnce(), 100)
  }

  // Periodic tick to advance care-miss timers even without events
  const interval = setInterval(() => syncOnce(), REDUCER_TICK_MS)
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
      syncOnce()
    }),
  )

  // First-run: offer hook installation
  if (isClaudeCodePresent() && !areHooksInstalled() && !isPromptSuppressed()) {
    void promptHookInstall()
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
    try {
      fs.mkdirSync(PATHS.hooksDir, { recursive: true })
      fs.writeFileSync(path.join(PATHS.hooksDir, '.suppress-prompt'), '1')
    } catch (e) {
      console.error('[digicoda] suppress-prompt write failed:', e)
    }
  }
}

function syncOnce() {
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
        void vscode.window.showInformationMessage(
          `${last.from} evolved into ${toName}!`,
        )
      }
    }
    if (result.ripped) {
      void vscode.window
        .showWarningMessage(
          'Your DigiCoda passed away from neglect. Start a new egg?',
          'Yes, new pet',
          'No, keep memorial',
        )
        .then((c) => {
          if (c === 'Yes, new pet') {
            void vscode.commands.executeCommand('digicoda.resetPet')
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
