import rdf from 'rdf-ext'

const VAULT_NAMESPACE = 'http://notes/'

const ns = {
  schema: rdf.namespace('http://schema.org/'),
  vault: rdf.namespace('http://vault.org/'),
  rdf: rdf.namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#'),
  rdfs: rdf.namespace('http://www.w3.org/2000/01/rdf-schema#'),
  this: rdf.namespace(VAULT_NAMESPACE)
}

export { ns }