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
