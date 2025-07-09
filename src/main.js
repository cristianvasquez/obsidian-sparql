import {
  ItemView,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
} from 'obsidian'
import { createApp } from 'vue'
import { fileUri } from 'vault-triplifier'

import TriplesView from './components/App.vue'
import SparqlView from './components/SparqlView.vue'
import SparqlViewDebug from './components/SparqlViewDebug.vue'
import Client from 'sparql-http-client/ParsingClient'
import { getTemplate, replaceSPARQL } from './lib/templates.js'
import Triplestore from './lib/Triplestore.js'
import { ns } from './namespaces.js'
import { EventEmitter } from './lib/EventEmitter.js'

const PLUGIN_NAME = 'obsidian-sparql'

export const SIDE_VIEW_ID = `obsidian-sparql-sideview`

const DEFAULT_SETTINGS = {
  clientSettings: {
    endpointUrl: 'http://localhost:7878/query',
    updateUrl: 'http://localhost:7878/update',
    user: '',
    password: '',
  },
  indexOnOpen: false,
  indexOnSave: true,
  allowUpdate: false,
}

export default class Prototype_11 extends Plugin {
  async onload () {
    console.log(`loading ${PLUGIN_NAME}`)
    await this.loadSettings()

    this.events = new EventEmitter()
    this.triplestore = new Triplestore(new Client(this.settings.clientSettings))

    this.addCommands()
    this.addSettingTab(new SampleSettingTab(this.app, this))
    this.registerEvents()

    const appContext = {
      app: this.app,
      triplestore: this.triplestore,
      events: this.events,
      ns,
      plugin: this,
    }

    const debugApp = createApp(TriplesView)
    debugApp.provide('context', appContext)
    this.vueApp = debugApp
    this.registerView(SIDE_VIEW_ID,
      (leaf) => new CurrentFileView(leaf, this.vueApp))

    this.registerMarkdownCodeBlockProcessor('osg', (source, el) => {
      const sparqlApp = createApp(SparqlView)
      sparqlApp.provide('context', appContext)
      sparqlApp.provide('text', source)
      sparqlApp.mount(el)
    })

    this.registerMarkdownCodeBlockProcessor('debug', (source, el) => {
      const sparqlApp = createApp(SparqlViewDebug)
      sparqlApp.provide('context', appContext)
      sparqlApp.provide('text', source)
      sparqlApp.mount(el)
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
      this.app.workspace.getLeavesOfType(SIDE_VIEW_ID)[0])
  }

  async loadSettings () {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings () {
    await this.saveData(this.settings)
  }

  addCommands () {
    this.addCommand({
      id: 'open-obsidian-sparql',
      name: 'Open sparql',
      checkCallback: (checking) => {
        if (this.app.workspace.activeLeaf) {
          if (!checking) this.activateSidePanel()
          return true
        }
        return false
      },
    })

    this.addCommand({
      id: 'insert-sparql-template',
      name: 'Insert SPARQL template',
      editorCallback: (editor) => {
        editor.replaceRange(getTemplate(), editor.getCursor())
      },
    })

    const saveCommand = this.app.commands?.commands?.['editor:save-file']
    if (saveCommand?.callback) {
      const originalCallback = saveCommand.callback
      saveCommand.callback = async () => {
        const file = this.app.workspace.getActiveFile()
        this.events.emit('index', file)
        originalCallback()
      }
    }

  }

  registerEvents () {
    const deleteIndex = async (path) => {
      const uri = fileUri(path)
      await this.triplestore.deleteDataset(uri)
    }

    this.registerEvent(
      this.app.metadataCache.on('changed', (file) => {
        this.events.emit('update', file)
      }),
    )

    this.registerEvent(
      this.app.vault.on('rename', async (file, oldPath) => {
        if (!(file instanceof TFile)) return
        await deleteIndex(oldPath)
        this.events.emit('update', file)
      }),
    )

    this.registerEvent(
      this.app.vault.on('delete', async (file) => {
        if (!(file instanceof TFile)) return
        await deleteIndex(file.path)
        this.events.emit('update', undefined)
      }),
    )

    this.registerEvent(
      this.app.workspace.on('file-open', (file) => {
        if (this.settings.indexOnOpen) {
          this.events.emit('update', file)
        }
      }),
    )
  }
}

class SampleSettingTab extends PluginSettingTab {
  constructor (app, plugin) {
    super(app, plugin)
    this.plugin = plugin
  }

  display () {
    const { containerEl } = this
    containerEl.empty()
    containerEl.createEl('h2', { text: 'Settings for obsidian SPARQL' })

    const client = this.plugin.settings.clientSettings

    const addTextSetting = (name, desc, key) => {
      new Setting(containerEl).setName(name).setDesc(desc).addText((text) =>
        text.setValue(client[key]).
          setPlaceholder('').
          onChange(async (value) => {
            client[key] = value
            await this.plugin.saveSettings()
          }),
      )
    }

    addTextSetting('Endpoint URL', 'The query endpoint URL', 'endpointUrl')
    addTextSetting('Update URL', 'The update endpoint URL', 'updateUrl')
    addTextSetting('User', 'Endpoint user (if applicable)', 'user')
    addTextSetting('Password', 'Endpoint password (if applicable)', 'password')

    new Setting(containerEl).setName('Index on open').
      setDesc('Index a note each time you open it').
      addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.indexOnOpen)
        toggle.onChange(async (value) => {
          this.plugin.settings.indexOnOpen = value
          await this.plugin.saveSettings()
        })
      })

    new Setting(containerEl).setName('Index on save').
      setDesc('Index a note each time you save it').
      addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.indexOnSave)
        toggle.onChange(async (value) => {
          this.plugin.settings.indexOnSave = value
          await this.plugin.saveSettings()
        })
      })

    new Setting(containerEl).setName('Allow updates').
      setDesc('Enable SPARQL updates in code snippets').
      addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.allowUpdate)
        toggle.onChange(async (value) => {
          this.plugin.settings.allowUpdate = value
          await this.plugin.saveSettings()
        })
      })
  }
}

export class CurrentFileView extends ItemView {
  constructor (leaf, vueApp) {
    super(leaf)
    this.vueApp = vueApp
  }

  getViewType () {
    return SIDE_VIEW_ID
  }

  getDisplayText () {
    return PLUGIN_NAME
  }

  async onOpen () {
    this.vueApp.mount(this.containerEl.children[1])
  }

  async onClose () {
    this.vueApp.unmount()
  }
}
