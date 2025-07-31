/**
 * Base controller providing common functionality and interface definition
 */
export class Controller {
  constructor (app, settings) {
    this.app = app
    this.settings = settings
  }

  /**
   * Execute SPARQL SELECT query
   * @param {string} sparqlQuery - SPARQL SELECT query
   * @returns {Promise<Array>} Query results
   */
  async select (sparqlQuery) {
    throw new Error(`${this.constructor.name} must implement select method`)
  }

  /**
   * Execute SPARQL CONSTRUCT query
   * @param {string} sparqlQuery - SPARQL CONSTRUCT query
   * @returns {Promise<Array>} Query results
   */
  async construct (sparqlQuery) {
    throw new Error(`${this.constructor.name} must implement construct method`)
  }

  /**
   * Sync a file to the triplestore
   * @param {Object} file - Obsidian file object
   * @param {string} content - File content
   * @param {boolean} showNotifications - Whether to show notifications
   * @returns {Promise<boolean>} Success status
   */
  async syncFile (file, content, showNotifications = false) {
    throw new Error(`${this.constructor.name} must implement syncFile method`)
  }

  /**
   * Rebuild the entire index/triplestore
   * @returns {Promise<void>}
   */
  async rebuildIndex () {
    throw new Error(`${this.constructor.name} must implement rebuildIndex method`)
  }

  /**
   * Delete a named graph from the triplestore
   * @param {string} path - File path
   * @param {boolean} showNotifications - Whether to show notifications
   * @returns {Promise<boolean>} Success status
   */
  async deleteNamedGraph (path, showNotifications = false) {
    throw new Error(`${this.constructor.name} must implement deleteNamedGraph method`)
  }
}
