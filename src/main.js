import { Plugin } from 'obsidian'
import { renderSparqlView } from './views/SparqlView.js'
import Client from 'sparql-http-client/ParsingClient'
import Triplestore from './lib/Triplestore.js'
import { DEFAULT_SETTINGS, SparqlSettingTab } from './lib/settings.js'
import { SyncManager } from './lib/sync.js'
import { CommandManager } from './lib/commands.js'
import { CurrentFileView, SIDE_VIEW_ID } from './views/CurrentFileView.js'
import { ns } from './namespaces.js'

const PLUGIN_NAME = 'obsidian-sparql'

export default class Prototype_11 extends Plugin {
  async onload () {
    console.log(`loading ${PLUGIN_NAME}`)
    await this.loadSettings()

    this.triplestore = new Triplestore(
      new Client(this.settings.clientSettings),
    )

    this.syncManager = new SyncManager(this.app, this.settings)
    this.commandManager = new CommandManager(this, this.syncManager)

    this.commandManager.registerCommands()
    this.commandManager.registerEvents()
    this.addSettingTab(new SparqlSettingTab(this.app, this))

    // Add ribbon icon for debug panel on the right
    this.addRibbonIcon('database', 'Open SPARQL debug panel', () => {
      this.activateSidePanel()
    }).addClass('mod-right-split')

    this.appContext = {
      app: this.app,
      triplestore: this.triplestore,
      ns,
      plugin: this,
    }

    this.registerView(
      SIDE_VIEW_ID,
      (leaf) => new CurrentFileView(leaf, this.appContext),
    )

    this.registerMarkdownCodeBlockProcessor('osg', (source, el) => {
      renderSparqlView(source, el, this.appContext, false)
    })

    this.registerMarkdownCodeBlockProcessor('osg-debug', (source, el) => {
      renderSparqlView(source, el, this.appContext, true)
    })
  }

  onunload () {
    this.app.workspace.detachLeavesOfType(SIDE_VIEW_ID)
    console.log('unloading plugin')
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

}

