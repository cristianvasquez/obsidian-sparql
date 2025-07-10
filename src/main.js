import {
  ItemView,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  Notice,
} from 'obsidian'
import { createApp } from 'vue'

import TriplesView from './components/App.vue'
import SparqlView from './components/SparqlView.vue'
import SparqlViewDebug from './components/SparqlViewDebug.vue'
import Client from 'sparql-http-client/ParsingClient'
import { getTemplate } from './lib/templates.js'
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
  allowUpdate: false,
  syncCommand: '/home/cvasquez/.local/share/pnpm/osg global sync your-vault',
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

    this.registerMarkdownCodeBlockProcessor('osg-debug', (source, el) => {
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

  async syncWithTriplestore () {
    const command = this.settings.syncCommand
    if (!command) {
      new Notice('No sync command configured')
      return
    }

    new Notice('Syncing with triplestore...')

    try {
      const { exec } = require('child_process')
      const { promisify } = require('util')
      const execAsync = promisify(exec)

      const { stdout, stderr } = await execAsync(command)

      // Show output in a modal
      const modal = document.createElement('div')
      modal.className = 'modal-bg'
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      `
      modal.innerHTML = `
        <div class="modal" style="padding: 20px; max-width: 80%; max-height: 80%; overflow: auto; background: var(--background-primary); border-radius: 8px;">
          <h3>Sync Output</h3>
          <pre style="background: var(--background-secondary); padding: 10px; border-radius: 4px; max-height: 400px; overflow-y: auto; white-space: pre-wrap;">${stdout}${stderr
        ? '\nSTDERR:\n' + stderr
        : ''}</pre>
          <button class="mod-cta" onclick="this.closest('.modal-bg').remove()">Close</button>
        </div>
      `
      document.body.appendChild(modal)

      new Notice('Sync completed successfully')
    } catch (error) {
      new Notice('Sync failed: ' + error.message)
      console.error('Sync error:', error)
    }
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

    this.addCommand({
      id: 'sync-with-triplestore',
      name: 'Sync with triplestore',
      callback: () => this.syncWithTriplestore(),
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

    this.registerEvent(
      this.app.metadataCache.on('changed', (file) => {
        this.events.emit('update', file)
      }),
    )

    this.registerEvent(
      this.app.vault.on('rename', async (file, oldPath) => {
        if (!(file instanceof TFile)) return
        this.events.emit('update', file)
      }),
    )

    this.registerEvent(
      this.app.vault.on('delete', async (file) => {
        if (!(file instanceof TFile)) return
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
      new Setting(containerEl).setName(name).setDesc(desc).addText((text) => {
        text.setValue(client[key]).
          setPlaceholder('').
          onChange(async (value) => {
            client[key] = value
            await this.plugin.saveSettings()
          })

        // Make the input wider and more user-friendly
        text.inputEl.style.width = '100%'
        text.inputEl.style.fontFamily = 'var(--font-monospace)'
        text.inputEl.style.fontSize = '14px'
      })
    }

    addTextSetting('Endpoint URL', 'The query endpoint URL', 'endpointUrl')
    addTextSetting('Update URL', 'The update endpoint URL', 'updateUrl')
    addTextSetting('User', 'Endpoint user (if applicable)', 'user')
    addTextSetting('Password', 'Endpoint password (if applicable)', 'password')

    new Setting(containerEl).setName('Allow updates').
      setDesc('Enable SPARQL updates in code snippets').
      addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.allowUpdate)
        toggle.onChange(async (value) => {
          this.plugin.settings.allowUpdate = value
          await this.plugin.saveSettings()
        })
      })

    new Setting(containerEl).setName('Sync command').
      setDesc('Shell command to sync with triplestore').
      addText((text) => {
        text.setValue(this.plugin.settings.syncCommand).
          setPlaceholder('osg global sync experiments-showcase').
          onChange(async (value) => {
            this.plugin.settings.syncCommand = value
            await this.plugin.saveSettings()
          })

        // Make the input wider and more user-friendly
        text.inputEl.style.width = '100%'
        text.inputEl.style.fontFamily = 'var(--font-monospace)'
        text.inputEl.style.fontSize = '14px'
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
