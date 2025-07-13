import { ItemView } from 'obsidian'
import { renderDebugPanel } from '../components/DebugPanel.js'

export const SIDE_VIEW_ID = `obsidian-sparql-sideview`

export class CurrentFileView extends ItemView {
  constructor (leaf, appContext) {
    super(leaf)
    this.appContext = appContext
    this.container = null
    this.lastUpdateTime = null
  }

  getViewType () {
    return SIDE_VIEW_ID
  }

  getDisplayText () {
    return 'obsidian-sparql'
  }

  async onOpen () {
    this.container = this.containerEl.children[1]
    await renderDebugPanel(this.container, this.appContext)

    // Store reference in plugin for file change updates
    this.appContext.plugin.debugView = this
  }

  async onClose () {
    // Remove reference from plugin
    if (this.appContext.plugin.debugView === this) {
      this.appContext.plugin.debugView = null
    }
  }

  async updateForFile () {
    if (this.container) {
      await renderDebugPanel(this.container, this.appContext)
    }
  }
}