const options = {
  // Default partitioning options
  partitionBy: ['headers-all', 'identifier'],

  // Include labels for better readability
  includeLabelsFor: [],

  // Include selectors for debugging
  includeSelectors: false,

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
}

export { options }
