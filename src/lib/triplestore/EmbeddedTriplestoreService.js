import init, { Store } from 'oxigraph'
import { TriplestoreService } from './TriplestoreService.js'

/**
 * Embedded triplestore service using oxigraph
 */
export class EmbeddedTriplestoreService extends TriplestoreService {
  constructor(app, settings) {
    super(app, settings)
    
    // Store will be initialized asynchronously
    this.store = null
    this.isInitialized = false
    this.initPromise = null
  }

  async initializeStore() {
    // Initialize WASM first (critical for browser environment)
    await init()
    
    // Create the store directly
    this.store = new Store()
    this.isInitialized = true

    // Configure query options for union default graph
    this.queryOptions = {
      use_default_graph_as_union: true,
    }
  }

  async ensureInitialized() {
    if (!this.isInitialized) {
      if (!this.initPromise) {
        this.initPromise = this.initializeStore()
      }
      await this.initPromise
    }
  }

  async select(sparqlQuery) {
    await this.ensureInitialized()
    const results = this.store.query(sparqlQuery, this.queryOptions)
    
    // Convert Map objects to plain objects for consistent interface
    return Array.from(results).map(binding => {
      if (binding instanceof Map) {
        return Object.fromEntries(binding)
      }
      return binding
    })
  }

  async construct(sparqlQuery) {
    await this.ensureInitialized()
    const results = this.store.query(sparqlQuery, this.queryOptions)
    
    // CONSTRUCT queries return quads/triples, convert to array for consistency
    return Array.from(results)
  }

  async addTriples(dataset, graphUri) {
    await this.ensureInitialized()

    // Add all triples from the dataset to the store
    // Ensure all quads are stored in the file's named graph
    for (const quad of dataset) {
      // Create a new quad ensuring it has the correct graph URI
      const graphedQuad = {
        subject: quad.subject,
        predicate: quad.predicate,
        object: quad.object,
        graph: graphUri,  // Always use the specified graph URI
      }
      this.store.add(graphedQuad)
    }

    return true
  }

  async clearGraph(graphUri) {
    await this.ensureInitialized()

    // Delete all quads in the specific named graph efficiently
    const quadsInGraph = this.store.match(null, null, null, graphUri)
    let deletedCount = 0
    
    for (const quad of quadsInGraph) {
      this.store.delete(quad)
      deletedCount++
    }

    return true
  }

  async clearAll(vaultBaseUri) {
    await this.ensureInitialized()

    // Clear only graphs that belong to this vault
    // Match all quads where the graph URI starts with the vault base URI
    let deletedCount = 0
    
    for (const quad of this.store.match()) {
      if (quad.graph && quad.graph.value && quad.graph.value.startsWith(vaultBaseUri)) {
        this.store.delete(quad)
        deletedCount++
      }
    }

    console.log(`[Embedded] Cleared ${deletedCount} triples from vault: ${vaultBaseUri}`)
    return true
  }

  /**
   * Get the number of triples in the store
   * @returns {number} Number of triples
   */
  get size() {
    if (!this.store || !this.isInitialized) {
      return 0
    }
    return this.store.size
  }
}