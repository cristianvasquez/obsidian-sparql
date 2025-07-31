import { Controller } from '../Controller.js'
import { handleTriplestoreError } from '../simpleErrorHandler.js'
import { NotificationService } from '../NotificationService.js'
import Client from 'sparql-http-client/ParsingClient'
import Triplestore from './Triplestore.js'

export class RemoteController extends Controller {
  constructor (app, settings) {
    super(app, settings)
    this.client = new Client(settings.clientSettings)
    this.triplestore = new Triplestore(this.client)
    this.notifications = new NotificationService()
  }

  async executeCommand (command, options = {}) {
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execAsync = promisify(exec)

    return await execAsync(command, options)
  }

  async select (sparqlQuery) {
    try {
      return await this.triplestore.select(sparqlQuery)
    } catch (error) {
      console.error('Remote SELECT query error:', error)
      throw error
    }
  }

  async construct (sparqlQuery) {
    try {
      return await this.triplestore.construct(sparqlQuery)
    } catch (error) {
      console.error('Remote CONSTRUCT query error:', error)
      throw error
    }
  }

  async syncFile (file, content) {
    const absolutePath = this.app.vault.adapter.getFullPath(file.path)
    const command = `${this.settings.osgPath} sync --file "${absolutePath}"`

    try {
      const { stdout, stderr } = await this.executeCommand(command)

      if (stderr) {
        console.error('Sync stderr:', stderr)
      }
      return true
    } catch (error) {

      console.error('Sync error:', error)
      return false
    }
  }

  async rebuildIndex () {
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
      }

      // Get the repository name from the path
      const repoName = repoPath.split('/').pop() || 'vault'

      // Build the sync command
      const command = `${this.settings.osgPath} sync "${repoPath}" --force`

      this.notifications.info(`[Remote] Syncing ${repoName} with triplestore...`)

      const { stdout, stderr } = await this.executeCommand(command, {
        cwd: repoPath,
      })

      if (stderr && !stdout) {
        // Only stderr, probably an error
        this.notifications.error(`[Remote] Sync failed: ${stderr}`)
        console.error('Sync error:', stderr)
      } else {
        // Success or warnings
        this.notifications.success(`[Remote] ${repoName} synced successfully`)
        if (stderr) {
          console.warn('Sync warnings:', stderr)
        }
      }

    } catch (error) {
      handleTriplestoreError(error, this.settings)
      console.error('Sync error:', error)
    }
  }

  async deleteNamedGraph (path) {
    const absolutePath = this.app.vault.adapter.getFullPath(path)
    const command = `${this.settings.osgPath} sync --remove --file "${absolutePath}"`

    try {
      await this.executeCommand(command)
      return true
    } catch (error) {
      console.error('Delete named graph error:', error)
      return false
    }
  }
}
