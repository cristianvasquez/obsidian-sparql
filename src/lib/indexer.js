import VaultTriplifier from '../triplifiers/VaultTriplifier.js'

/**
 * Index a note using the new vault-triplifier system
 * @param {Object} triplestore - Triplestore instance
 * @param {Object} note - Note object with getRawData() and noteUri
 * @param {Object} ns - Namespace object (legacy, may be removed)
 * @param {Object} uriResolvers - URI resolvers (legacy, may be removed)
 * @returns {Promise<number>} Number of triples indexed
 */
async function indexNote(triplestore, note, ns, uriResolvers) {
  const triplifier = new VaultTriplifier()
  const rawData = note.getRawData()
  
  try {
    // Use vault-triplifier to process the note content
    const result = await triplifier.triplifyContent(rawData.text, rawData.path)
    
    // Clear existing triples for this note
    await triplestore.deleteDataset(note.noteUri)
    
    // Insert new triples
    await triplestore.insertDataset(note.noteUri, result.dataset)
    
    return result.triples
  } catch (error) {
    console.error('Error indexing note:', error)
    throw error
  }
}

/**
 * Get all triples for a note (legacy compatibility)
 * @param {Object} data - Raw note data
 * @param {string} uri - Note URI
 * @param {Object} ns - Namespace object
 * @param {Object} uriResolvers - URI resolvers
 * @returns {Promise<Object>} Dataset with triples
 */
async function getAllTriples(data, uri, ns, uriResolvers) {
  const triplifier = new VaultTriplifier()
  const result = await triplifier.triplifyContent(data.text, data.path)
  return result.dataset
}

export { getAllTriples, indexNote }
