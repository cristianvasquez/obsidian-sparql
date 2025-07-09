/**
 * Shrink URIs for display purposes
 * @param {string} uri - URI to shrink
 * @returns {string} Shortened URI
 */
function shrink (uri) {
  if (typeof uri !== 'string') return uri

  // Common namespace prefixes for display
  const prefixes = {
    'http://www.w3.org/1999/02/22-rdf-syntax-ns#': 'rdf:',
    'http://www.w3.org/2000/01/rdf-schema#': 'rdfs:',
    'http://schema.org/': 'schema:',
    'http://xmlns.com/foaf/0.1/': 'foaf:',
    'http://purl.org/dc/elements/1.1/': 'dc:',
    'http://purl.org/dc/terms/': 'dct:',
    'http://www.w3.org/ns/oa#':'oa',
    'file://': '',
  }

  for (const [namespace, prefix] of Object.entries(prefixes)) {
    if (uri.startsWith(namespace)) {
      return uri.replace(namespace, prefix)
    }
  }

  return uri
}

export { shrink }
