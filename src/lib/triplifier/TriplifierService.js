/**
 * Base class for triplifier services
 */
export class TriplifierService {
  constructor(app, settings) {
    this.app = app
    this.settings = settings
  }

  /**
   * Convert file content to RDF triples
   * @param {string} absolutePath - Absolute path to the file
   * @param {string} content - File content
   * @returns {Promise<Object>} Object with dataset and graphUri
   */
  async triplify(absolutePath, content) {
    throw new Error(`${this.constructor.name} must implement triplify method`)
  }

  /**
   * Check if this file type can be processed
   * @param {string} absolutePath - Absolute path to the file
   * @returns {boolean} Whether the file can be processed
   */
  canProcess(absolutePath) {
    throw new Error(`${this.constructor.name} must implement canProcess method`)
  }
}