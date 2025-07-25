import { refreshPanelQueries } from '../views/MainPanel.js'
import { getOSGQueryTemplate, getTemplate } from './templates.js'

export class CommandManager {
  constructor (plugin, syncManager) {
    this.plugin = plugin
    this.syncManager = syncManager
  }

  registerCommands () {
    this.plugin.addCommand({
      id: 'open-obsidian-sparql',
      name: 'Open debug panel',
      checkCallback: (checking) => {
        if (this.plugin.app.workspace.activeLeaf) {
          if (!checking) this.plugin.activateSidePanel()
          return true
        }
        return false
      },
    })

    this.plugin.addCommand({
      id: 'insert-sparql-template',
      name: 'Insert SPARQL template',
      editorCallback: (editor) => {
        editor.replaceRange(getTemplate(), editor.getCursor())
      },
    })

    this.plugin.addCommand({
      id: 'insert-osg-template',
      name: 'Insert OSG query template',
      editorCallback: (editor) => {
        editor.replaceRange(getOSGQueryTemplate(), editor.getCursor())
      },
    })

    this.plugin.addCommand({
      id: 'sync-current-file',
      name: 'Sync current file',
      checkCallback: (checking) => {
        const activeFile = this.plugin.app.workspace.getActiveFile()
        if (activeFile) {
          if (!checking) this.syncManager.syncCurrentFile()
          return true
        }
        return false
      },
    })

    this.plugin.addCommand({
      id: 'sync-with-triplestore',
      name: 'Sync with triplestore',
      callback: () => this.syncManager.syncWithTriplestore(),
    })

    this.plugin.addCommand({
      id: 'refresh-panel-queries',
      name: 'Refresh debug panel queries',
      callback: async () => {
        if (this.plugin.debugView) {
          await refreshPanelQueries(this.plugin.appContext)
        }
      },
    })
  }

  registerEvents () {

    this.plugin.registerEvent(
      this.plugin.app.vault.on('modify', async (file) => {
        // Always sync when file is modified/saved
        await this.syncManager.syncFile(file)
        // Update debug panel if open
        if (file && this.plugin.debugView) {
          await this.plugin.debugView.updateForFile()
        }
      }),
    )

    this.plugin.registerEvent(
      this.plugin.app.vault.on('rename', async (file, oldPath) => {
        await this.syncManager.deleteIndex(oldPath)
        // Always sync when file is modified/saved
        await this.syncManager.syncFile(file)
        // Update debug panel if open
        if (file && this.plugin.debugView) {
          await this.plugin.debugView.updateForFile()
        }

      }),
    )

    this.plugin.registerEvent(
      this.plugin.app.vault.on('delete', async (file) => {
        await this.syncManager.deleteIndex(file.path)

      }),
    )

    // Update debug panel when switching files
    this.plugin.registerEvent(
      this.plugin.app.workspace.on('file-open', async (file) => {
        if (file && this.plugin.debugView) {
          await this.plugin.debugView.updateForFile()
        }
      }),
    )

  }
}
