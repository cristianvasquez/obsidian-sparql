import { pathToFileURL } from 'vault-triplifier'
import { TriplifierService } from './TriplifierService.js'

/**
 * Triplifier service that uses external OSG command-line tool
 */
export class ExternalTriplifierService extends TriplifierService {
  constructor(app, settings) {
    super(app, settings)
  }

  async executeCommand(command, options = {}) {
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execAsync = promisify(exec)

    return await execAsync(command, options)
  }

  async triplify(absolutePath, content) {
    // For external triplifier, we don't convert locally
    // Instead, we return metadata that indicates external processing is needed
    const graphUri = pathToFileURL(absolutePath)
    
    return {
      dataset: null, // No local dataset - will be handled externally
      graphUri,
      requiresExternalSync: true
    }
  }

  canProcess(absolutePath) {
    // External triplifier can process any file type that OSG supports
    // For now, assume markdown files (could be extended based on OSG capabilities)
    return absolutePath.endsWith('.md')
  }

  /**
   * Sync file using external OSG command
   * @param {string} absolutePath - Absolute path to the file
   * @returns {Promise<boolean>} Success status
   */
  async syncFile(absolutePath) {
    const command = `${this.settings.osgPath} sync --file "${absolutePath}"`

    try {
      const { stdout, stderr } = await this.executeCommand(command)

      if (stderr) {
        console.error('External triplifier sync stderr:', stderr)
      }
      return true
    } catch (error) {
      console.error('External triplifier sync error:', error)
      return false
    }
  }

  /**
   * Remove file using external OSG command
   * @param {string} absolutePath - Absolute path to the file
   * @returns {Promise<boolean>} Success status
   */
  async removeFile(absolutePath) {
    const command = `${this.settings.osgPath} sync --remove --file "${absolutePath}"`

    try {
      await this.executeCommand(command)
      return true
    } catch (error) {
      console.error('External triplifier remove error:', error)
      return false
    }
  }
}