import { getTemplate } from './templates.js'

export class CommandManager {
  constructor(plugin, syncManager) {
    this.plugin = plugin
    this.syncManager = syncManager
  }

  registerCommands() {
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
  }

  registerEvents() {
    // Simple approach: just use file modification events
    this.plugin.registerEvent(
      this.plugin.app.vault.on('modify', async (file) => {
        // Always sync when file is modified/saved
        await this.syncManager.syncFile(file)

        // Update debug panel if open
        if (file && this.plugin.debugView) {
          this.plugin.debugView.updateForFile()
        }
      }),
    )

    // Update debug panel when switching files
    this.plugin.registerEvent(
      this.plugin.app.workspace.on('file-open', (file) => {
        if (file && this.plugin.debugView) {
          this.plugin.debugView.updateForFile()
        }
      }),
    )
  }
}