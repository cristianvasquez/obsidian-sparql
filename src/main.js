import {
  ItemView,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  Notice,
} from 'obsidian'
import { renderDebugPanel } from './components/DebugPanel.js'
import { renderSparqlView } from './components/SparqlView.js'
import Client from 'sparql-http-client/ParsingClient'
import { getTemplate } from './lib/templates.js'
import Triplestore from './lib/Triplestore.js'
import { ns } from './namespaces.js'


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

    this.triplestore = new Triplestore(
      new Client(this.settings.clientSettings),
    )

    this.addCommands()
    this.addSettingTab(new SampleSettingTab(this.app, this))
    this.registerEvents()

    const appContext = {
      app: this.app,
      triplestore: this.triplestore,
      ns,
      plugin: this,
    }

    this.registerView(
      SIDE_VIEW_ID,
      (leaf) => new CurrentFileView(leaf, appContext),
    )

    this.registerMarkdownCodeBlockProcessor('osg', (source, el) => {
      renderSparqlView(source, el, appContext, false)
    })

    this.registerMarkdownCodeBlockProcessor('osg-debug', (source, el) => {
      renderSparqlView(source, el, appContext, true)
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

    await this.syncCurrentFileSilently(activeFile, true) // true = show notifications
  }

  async syncCurrentFileSilently (file, showNotifications = false) {
    const absolutePath = this.app.vault.adapter.getFullPath(file.path)
    const command = `${OSG_PATH} sync --file "${absolutePath}"`

    if (showNotifications) {
      new Notice(`Syncing ${file.basename}...`)
    }

    try {
      const { exec } = require('child_process')
      const { promisify } = require('util')
      const execAsync = promisify(exec)

      const { stdout, stderr } = await execAsync(command)

      if (stderr) {
        console.error('Sync stderr:', stderr)
        if (showNotifications) {
          new Notice(`Sync completed with warnings`)
        }
      } else {
        if (showNotifications) {
          new Notice(`✓ ${file.basename} synced`)
        }
      }

      console.log('Sync output:', stdout)
      return true
    } catch (error) {
      if (showNotifications) {
        new Notice(`Sync failed: ${error.message}`)
      }
      console.error('Sync error:', error)
      return false
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
      name: 'Open debug panel',
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

    // Simple approach: just use file modification events
    this.registerEvent(
      this.app.vault.on('modify', async (file) => {
        // Always sync when file is modified/saved
        await this.syncCurrentFileSilently(file)
        
        // Update debug panel if open
        if (this.debugView) {
          this.debugView.updateAfterSave()
        }
      })
    )
  }

  registerEvents () {
    // Update debug panel when switching files
    this.registerEvent(
      this.app.workspace.on('file-open', (file) => {
        if (file && this.debugView) {
          this.debugView.updateForFile()
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
    return PLUGIN_NAME
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

  async updateForFile(showTimestamp = false) {
    if (this.container) {
      let timestamp = null
      if (showTimestamp) {
        this.lastUpdateTime = new Date().toLocaleTimeString()
        timestamp = this.lastUpdateTime
      }
      await renderDebugPanel(this.container, this.appContext, timestamp)
    }
  }
}
