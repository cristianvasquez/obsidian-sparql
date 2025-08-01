import { Plugin } from 'obsidian'
import { renderSparqlView } from './views/SparqlView.js'
import { DEFAULT_SETTINGS, SparqlSettingTab } from './lib/settings.js'
import { Controller } from './lib/Controller.js'
import { CommandManager } from './lib/commands.js'
import { CurrentFileView, SIDE_VIEW_ID } from './views/CurrentFileView.js'
import { ns } from './namespaces.js'

export default class SparqlPlugin extends Plugin {
  async onload () {
    await this.loadSettings()

    // Initialize the controller (it will choose services based on settings)
    this.controller = new Controller(this.app, this.settings)

    this.commandManager = new CommandManager(this, this.controller)

    this.commandManager.registerCommands()
    this.commandManager.registerEvents()
    this.addSettingTab(new SparqlSettingTab(this.app, this))

    // Add ribbon icon for debug panel on the right
    this.addRibbonIcon('database', 'Open SPARQL debug panel', () => {
      this.activateSidePanel()
    }).addClass('mod-right-split')

    this.appContext = {
      app: this.app,
      controller: this.controller,
      ns,
      plugin: this,
    }

    this.registerView(
      SIDE_VIEW_ID,
      (leaf) => new CurrentFileView(leaf, this.appContext),
    )

    this.registerMarkdownCodeBlockProcessor('osg', async (source, el) => {
      console.log('[OSG] Processing osg code block:', source.substring(0, 50) + '...')
      await renderSparqlView(source, el, this.appContext, false)
    })

    this.registerMarkdownCodeBlockProcessor('osg-debug', async (source, el) => {
      console.log('[OSG] Processing osg-debug code block:', source.substring(0, 50) + '...')
      await renderSparqlView(source, el, this.appContext, true)
    })
  }

  onunload () {
    this.app.workspace.detachLeavesOfType(SIDE_VIEW_ID)
  }

  async activateSidePanel () {
    this.app.workspace.detachLeavesOfType(SIDE_VIEW_ID)
    await this.app.workspace.getRightLeaf(false).setViewState({
      type: SIDE_VIEW_ID,
      active: true,
    })
    this.app.workspace.revealLeaf(
      this.app.workspace.getLeavesOfType(SIDE_VIEW_ID)[0],
    )
  }

  async loadSettings () {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      await this.loadData(),
    )
  }

  async saveSettings () {
    await this.saveData(this.settings)
  }

  // Reinitialize controller when mode changes
  reinitializeController () {
    // Create new controller (it will choose services based on current settings)
    this.controller = new Controller(this.app, this.settings)

    // Update command manager with new controller
    this.commandManager.controller = this.controller

    // Update app context
    this.appContext.controller = this.controller
  }


}

