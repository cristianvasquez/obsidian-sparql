import { Notice } from 'obsidian'

export class SyncManager {
  constructor(app, settings) {
    this.app = app
    this.settings = settings
  }

  async syncCurrentFile(showNotifications = true) {
    const activeFile = this.app.workspace.getActiveFile()
    if (!activeFile) {
      if (showNotifications) {
        new Notice('No active file to sync')
      }
      return
    }

    await this.syncFile(activeFile, showNotifications)
  }

  async syncFile(file, showNotifications = false) {
    const absolutePath = this.app.vault.adapter.getFullPath(file.path)
    const command = `${this.settings.osgPath} sync --file "${absolutePath}"`

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

  async syncWithTriplestore() {
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
      const command = `${this.settings.osgPath} sync "${repoPath}"`

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
}