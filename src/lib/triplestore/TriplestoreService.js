/**
 * Base class for triplestore services
 */
export class TriplestoreService {
  constructor(app, settings) {
    this.app = app
    this.settings = settings
  }

  /**
   * Execute SPARQL SELECT query
   * @param {string} sparqlQuery - SPARQL SELECT query
   * @returns {Promise<Array>} Query results
   */
  async select(sparqlQuery) {
    throw new Error(`${this.constructor.name} must implement select method`)
  }

  /**
   * Execute SPARQL CONSTRUCT query
   * @param {string} sparqlQuery - SPARQL CONSTRUCT query
   * @returns {Promise<Array>} Query results
   */
  async construct(sparqlQuery) {
    throw new Error(`${this.constructor.name} must implement construct method`)
  }

  /**
   * Add triples to the triplestore
   * @param {Array} dataset - RDF dataset containing triples
   * @param {string} graphUri - Named graph URI
   * @returns {Promise<boolean>} Success status
   */
  async addTriples(dataset, graphUri) {
    throw new Error(`${this.constructor.name} must implement addTriples method`)
  }

  /**
   * Remove all triples from a named graph
   * @param {string} graphUri - Named graph URI
   * @returns {Promise<boolean>} Success status
   */
  async clearGraph(graphUri) {
    throw new Error(`${this.constructor.name} must implement clearGraph method`)
  }

  /**
   * Clear all data from the current vault in the triplestore
   * @param {string} vaultBaseUri - Base URI of the vault (e.g., "file:///path/to/vault/")
   * @returns {Promise<boolean>} Success status
   */
  async clearAll(vaultBaseUri) {
    throw new Error(`${this.constructor.name} must implement clearAll method`)
  }

  /**
   * Initialize the triplestore service
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error(`${this.constructor.name} must implement initialize method`)
  }
}