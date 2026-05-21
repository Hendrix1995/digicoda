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
