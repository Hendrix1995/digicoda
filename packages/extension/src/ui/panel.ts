import * as vscode from 'vscode'
import * as path from 'node:path'
import type { PetState } from '@digicoda/core'
import { renderWebviewHtml } from './webview-html.js'

let current: vscode.WebviewPanel | null = null

export function getSpritesRoot(): vscode.Uri {
  // dist/sprites/ contains the copied sprite assets
  return vscode.Uri.file(path.join(__dirname, 'sprites'))
}

export function showPanel(_context: vscode.ExtensionContext, initialState: PetState): vscode.WebviewPanel {
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
