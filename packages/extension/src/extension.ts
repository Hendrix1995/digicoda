import * as vscode from 'vscode'

export function activate(_context: vscode.ExtensionContext) {
  console.log('[digicoda] activated')
}

export function deactivate() {
  console.log('[digicoda] deactivated')
}
