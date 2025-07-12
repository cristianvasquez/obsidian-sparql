import {
  ItemView,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  Notice,
} from 'obsidian'
import { createApp } from 'vue'

import DebugPanel from './components/DebugPanel.vue'
import SparqlView from './components/SparqlView.vue'
import Client from 'sparql-http-client/ParsingClient'
import { getTemplate } from './lib/templates.js'
import Triplestore from './lib/Triplestore.js'
import { ns } from './namespaces.js'
import { EventEmitter } from './lib/EventEmitter.js'

import './rdf-tree.css'

const PLUGIN_NAME = 'obsidian-sparql'

export const SIDE_VIEW_ID = `obsidian-sparql-sideview`

const OSG_PATH = `/home/cvasquez/.local/share/pnpm/osg`

const DEFAULT_SETTINGS = {
  clientSettings: {
    endpointUrl: 'http://localhost:7878/query',
    updateUrl: 'http://localhost:7878/update',
    user: '',
    password: '',
  },
  allowUpdate: false,
}

export default class Prototype_11 extends Plugin {
  async onload () {
    console.log(`loading ${PLUGIN_NAME}`)
    await this.loadSettings()

    this.events = new EventEmitter()
    this.triplestore = new Triplestore(
      new Client(this.settings.clientSettings),
    )

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

    const debugApp = createApp(DebugPanel)
    debugApp.provide('context', appContext)

    this.vueApp = debugApp
    this.registerView(
      SIDE_VIEW_ID,
      (leaf) => new CurrentFileView(leaf, this.vueApp),
    )

    this.registerMarkdownCodeBlockProcessor('osg', (source, el) => {
      const sparqlApp = createApp(SparqlView)
      sparqlApp.provide('context', appContext)
      sparqlApp.provide('text', source)
      sparqlApp.mount(el)
    })

    this.registerMarkdownCodeBlockProcessor('osg-debug', (source, el) => {
      const sparqlApp = createApp(SparqlView, { debug: true })
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

  async syncCurrentFile () {
    const activeFile = this.app.workspace.getActiveFile()
    if (!activeFile) {
      new Notice('No active file to sync')
      return
    }

    const absolutePath = this.app.vault.adapter.getFullPath(activeFile.path)
    const command = `${OSG_PATH} sync --file "${absolutePath}"`

    new Notice(`Syncing ${activeFile.basename}...`)

    try {
      const { exec } = require('child_process')
      const { promisify } = require('util')
      const execAsync = promisify(exec)

      const { stdout, stderr } = await execAsync(command)

      if (stderr) {
        console.error('Sync stderr:', stderr)
        new Notice(`Sync completed with warnings`)
      } else {
        new Notice(`✓ ${activeFile.basename} synced`)
      }

      console.log('Sync output:', stdout)
    } catch (error) {
      new Notice(`Sync failed: ${error.message}`)
      console.error('Sync error:', error)
    }
  }

  async syncWithTriplestore () {
    try {
      const { exec } = require('child_process')
      const { promisify } = require('util')
      const execAsync = promisify(exec)

      // Get the vault path
      const vaultPath = this.app.vault.adapter.basePath ||
        this.app.vault.adapter.getBasePath?.() || ''

      // Try to get git repository root
      let repoPath = vaultPath
      try {
        const { stdout: gitRoot } = await execAsync(
          'git rev-parse --show-toplevel', {
            cwd: vaultPath,
          })
        repoPath = gitRoot.trim()
      } catch (e) {
        // Not a git repo or git not available, use vault path
        console.log('Not a git repository, using vault path')
      }

      // Get the repository name from the path
      const repoName = repoPath.split('/').pop() || 'vault'

      // Build the sync command
      const command = `${OSG_PATH} sync "${repoPath}"`

      new Notice(`Syncing ${repoName} with triplestore...`)
      console.log('Executing sync command:', command)

      const { stdout, stderr } = await execAsync(command, {
        cwd: repoPath,
      })

      if (stderr && !stdout) {
        // Only stderr, probably an error
        new Notice(`Sync failed: ${stderr}`)
        console.error('Sync error:', stderr)
      } else {
        // Success or warnings
        new Notice(`✓ ${repoName} synced successfully`)
        console.log('Sync output:', stdout)
        if (stderr) {
          console.warn('Sync warnings:', stderr)
        }
      }

    } catch (error) {
      new Notice(`Sync failed: ${error.message}`)
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
      id: 'sync-current-file',
      name: 'Sync current file',
      checkCallback: (checking) => {
        const activeFile = this.app.workspace.getActiveFile()
        if (activeFile) {
          if (!checking) this.syncCurrentFile()
          return true
        }
        return false
      },
    })

    this.addCommand({
      id: 'sync-with-triplestore',
      name: 'Sync with triplestore',
      callback: () => this.syncWithTriplestore(),
    })

    // Hook into save command to emit events
    const saveCommand = this.app.commands?.commands?.['editor:save-file']
    if (saveCommand?.callback) {
      const originalCallback = saveCommand.callback
      saveCommand.callback = async () => {
        const result = await originalCallback()

        // Emit update event after save
        const file = this.app.workspace.getActiveFile()
        if (file) {
          console.log('Save command: emitting update event', file.path)
          this.events.emit('update', file)
        }

        return result
      }
    }
  }

  registerEvents () {
    this.registerEvent(
      this.app.metadataCache.on('changed', (file) => {
        console.log('Metadata changed:', file.path)
        this.events.emit('update', file)
      }),
    )

    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        if (file instanceof TFile) {
          console.log('File modified:', file.path)
          this.events.emit('update', file)
        }
      }),
    )

    this.registerEvent(
      this.app.vault.on('rename', async (file, oldPath) => {
        if (!(file instanceof TFile)) return
        console.log('File renamed:', oldPath, '->', file.path)
        this.events.emit('update', file)
      }),
    )

    this.registerEvent(
      this.app.vault.on('delete', async (file) => {
        if (!(file instanceof TFile)) return
        console.log('File deleted:', file.path)
        this.events.emit('update', undefined)
      }),
    )

    this.registerEvent(
      this.app.workspace.on('file-open', (file) => {
        if (file) {
          console.log('File opened:', file.path)
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
    addTextSetting(
      'Password',
      'Endpoint password (if applicable)',
      'password',
    )

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
