import rdf from 'rdf-ext'

const VAULT_NAMESPACE = 'http://notes/'

// Create rdf-ext namespace objects
const ns = {
  rdf: rdf.namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#'),
  rdfs: rdf.namespace('http://www.w3.org/2000/01/rdf-schema#'),
  xsd: rdf.namespace('http://www.w3.org/2001/XMLSchema#'),
  owl: rdf.namespace('http://www.w3.org/2002/07/owl#'),
  skos: rdf.namespace('http://www.w3.org/2004/02/skos/core#'),
  schema: rdf.namespace('http://schema.org/'),
  foaf: rdf.namespace('http://xmlns.com/foaf/0.1/'),
  dc: rdf.namespace('http://purl.org/dc/elements/1.1/'),
  dct: rdf.namespace('http://purl.org/dc/terms/'),
  dcam: rdf.namespace('http://purl.org/dc/dcam/'),
  bibo: rdf.namespace('http://purl.org/ontology/bibo/'),
  vcard: rdf.namespace('http://www.w3.org/2006/vcard/ns#'),
  void: rdf.namespace('http://rdfs.org/ns/void#'),
  prov: rdf.namespace('http://www.w3.org/ns/prov#'),
  oa: rdf.namespace('http://www.w3.org/ns/oa#'),
  as: rdf.namespace('https://www.w3.org/ns/activitystreams#'),
  ldp: rdf.namespace('http://www.w3.org/ns/ldp#'),
  solid: rdf.namespace('http://www.w3.org/ns/solid/terms#'),
  acl: rdf.namespace('http://www.w3.org/ns/auth/acl#'),
  vault: rdf.namespace('http://vault.org/'),
  this: rdf.namespace(VAULT_NAMESPACE)
}

// Build prefixes from namespace objects for shrinking URIs
const prefixes = {}
for (const [prefix, namespace] of Object.entries(ns)) {
  prefixes[namespace.value] = prefix + ':'
}
prefixes['file://'] = ''

export { ns, prefixes }