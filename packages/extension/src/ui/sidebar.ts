import * as vscode from 'vscode'
import type { PetState } from '@digicoda/core'
import { renderWebviewHtml } from './webview-html.js'
import { getSpritesRoot } from './panel.js'

export class SidebarProvider implements vscode.WebviewViewProvider {
  static viewType = 'digicoda.sidebar'
  private view?: vscode.WebviewView
  private latestState: PetState | null = null

  constructor(private _context: vscode.ExtensionContext) {}

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
