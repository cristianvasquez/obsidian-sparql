import { Notice } from 'obsidian'
import { Controller } from '../Controller.js'
import { handleTriplestoreError } from '../simpleErrorHandler.js'
import Client from 'sparql-http-client/ParsingClient'
import Triplestore from './Triplestore.js'

export class RemoteController extends Controller {
  constructor(app, settings) {
    super(app, settings)
    this.client = new Client(settings.clientSettings)
    this.triplestore = new Triplestore(this.client)
    console.log('RemoteController initialized - using external triplestore')
  }

  async executeCommand(command, options = {}) {
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execAsync = promisify(exec)
    
    return await execAsync(command, options)
  }

  async select(sparqlQuery) {
    console.log('RemoteController.select() called with query:', sparqlQuery)
    
    try {
      return await this.triplestore.select(sparqlQuery)
    } catch (error) {
      console.error('Remote SELECT query error:', error)
      throw error
    }
  }

  async construct(sparqlQuery) {
    console.log('RemoteController.construct() called with query:', sparqlQuery)
    
    try {
      return await this.triplestore.construct(sparqlQuery)
    } catch (error) {
      console.error('Remote CONSTRUCT query error:', error)
      throw error
    }
  }

  async syncFile(file, content, showNotifications = false) {
    const absolutePath = this.app.vault.adapter.getFullPath(file.path)
    const command = `${this.settings.osgPath} sync --file "${absolutePath}"`

    if (showNotifications) {
      new Notice(`[Remote] Syncing ${file.basename}...`)
    }

    try {
      const { stdout, stderr } = await this.executeCommand(command)

      if (stderr) {
        console.error('Sync stderr:', stderr)
        if (showNotifications) {
          new Notice(`[Remote] Sync completed with warnings`)
        }
      } else {
        if (showNotifications) {
          new Notice(`✓ [Remote] ${file.basename} synced`)
        }
      }

      console.log('Sync output:', stdout)
      return true
    } catch (error) {
      if (showNotifications) {
        handleTriplestoreError(error, this.settings)
      }
      console.error('Sync error:', error)
      return false
    }
  }

  async rebuildIndex() {
    try {
      // Get the vault path
      const vaultPath = this.app.vault.adapter.basePath ||
        this.app.vault.adapter.getBasePath?.() || ''

      // Try to get git repository root
      let repoPath = vaultPath
      try {
        const { stdout: gitRoot } = await this.executeCommand(
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
      const command = `${this.settings.osgPath} sync "${repoPath}" --force`

      new Notice(`[Remote] Syncing ${repoName} with triplestore...`)
      console.log('Executing sync command:', command)

      const { stdout, stderr } = await this.executeCommand(command, {
        cwd: repoPath,
      })

      if (stderr && !stdout) {
        // Only stderr, probably an error
        new Notice(`[Remote] Sync failed: ${stderr}`)
        console.error('Sync error:', stderr)
      } else {
        // Success or warnings
        new Notice(`✓ [Remote] ${repoName} synced successfully`)
        console.log('Sync output:', stdout)
        if (stderr) {
          console.warn('Sync warnings:', stderr)
        }
      }

    } catch (error) {
      handleTriplestoreError(error, this.settings)
      console.error('Sync error:', error)
    }
  }

  async deleteNamedGraph(path, showNotifications = false) {
    console.log('🗑️ [REMOTE] RemoteController.deleteNamedGraph() called')
    console.log('🗃️ [REMOTE] Target path:', path)
    
    const absolutePath = this.app.vault.adapter.getFullPath(path)
    const command = `${this.settings.osgPath} sync --remove --file "${absolutePath}"`
    
    console.log('💻 [REMOTE] Executing command:', command)
    
    if (showNotifications) {
      new Notice(`[Remote] Removing ${path} from index...`)
    }

    try {
      const result = await this.executeCommand(command)
      
      if (showNotifications) {
        new Notice(`✓ [Remote] ${path} removed from index`)
      }
      
      console.log('✅ [REMOTE] Delete named graph output:', result.stdout)
      return true
    } catch (error) {
      if (showNotifications) {
        handleTriplestoreError(error, this.settings)
      }
      console.error('❌ [REMOTE] Delete named graph error:', error)
      return false
    }
  }
}