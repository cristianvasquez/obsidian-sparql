import { triplify } from 'vault-triplifier'

/**
 * Modern triplifier using vault-triplifier library
 * Replaces the old custom triplifier system
 */
class VaultTriplifier {
  constructor (options = {}) {
    this.options = {
      // Default partitioning options
      partitionBy: ['headers-all', 'identifier'],

      // Include labels for better readability
      includeLabelsFor: ['documents', 'sections', 'properties'],

      // Include selectors for debugging
      includeSelectors: true,

      // Don't include raw content by default
      includeRaw: false,

      // Standard namespace prefixes
      prefix: {
        rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
        schema: 'http://schema.org/',
        foaf: 'http://xmlns.com/foaf/0.1/',
        dc: 'http://purl.org/dc/elements/1.1/',
        dct: 'http://purl.org/dc/terms/',
      },

      // Property mappings for common semantic relationships
      mappings: {
        'is a': 'rdf:type',
        'same as': 'rdf:sameAs',
        'knows': 'foaf:knows',
        'name': 'foaf:name',
        'title': 'dct:title',
        'created': 'dct:created',
        'modified': 'dct:modified',
        'author': 'dct:creator',
        'subject': 'dct:subject',
        'description': 'dct:description',
      },

      // Merge with any provided options
      ...options,
    }
  }

  /**
   * Process markdown content and return RDF dataset
   * @param {string} content - Markdown content
   * @param {string} path - File path for URI generation
   * @returns {Promise<Object>} Object with dataset and metadata
   */
  async triplifyContent (content, path) {
    try {
      const result = await triplify(path, content, this.options)

      return {
        dataset: result.dataset,
        pointer: result,
        triples: result.dataset.size,
        uri: result.term,
      }
    } catch (error) {
      console.error('Error triplifying content:', error)
      throw error
    }
  }

  /**
   * Get default template for SPARQL queries
   * @returns {string} SPARQL query template
   */
  getTemplate () {
    return `SELECT ?subject ?predicate ?object WHERE {
  ?subject ?predicate ?object .
  FILTER(STRSTARTS(STR(?subject), "file://"))
} LIMIT 10`
  }

  /**
   * Update triplifier options
   * @param {Object} newOptions - New options to merge
   */
  updateOptions (newOptions) {
    this.options = { ...this.options, ...newOptions }
  }

  /**
   * Get current options
   * @returns {Object} Current options
   */
  getOptions () {
    return { ...this.options }
  }
}

export default VaultTriplifier
