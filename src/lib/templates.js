// src/lib/templates.js
import {
  nameToUri,
  pathToFileURL,
  propertyToUri,
} from 'vault-triplifier'
import { getNameFromPath } from './uriUtils.js'

function getTemplate () {
  return `SELECT * WHERE {
  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  PREFIX prov: <http://www.w3.org/ns/prov#>
  PREFIX dot: <http://pkm-united.org/>
  
    GRAPH ?g {
      __THIS__ ?p ?o
    }
  } LIMIT 10`
}

const THIS = '__THIS__'
const DOC = '__DOC__'

/**
 * Replace [[link]] patterns with URIs
 */
export function replaceInternalLinks (text, replacer) {
  return text.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
    return replacer(linkText)
  })
}

/**
 * Replace property references like {{property:value}}
 */
export function replacePropertyReferences (text) {
  return text.replace(/\{\{([^:]+):([^}]+)\}\}/g, (match, property, value) => {
    // Convert property to URI using vault-triplifier
    const propUri = propertyToUri(property.trim())
    // For values, we'll use nameToUri as a fallback since valueToUri doesn't exist
    const valueUri = nameToUri(value.trim())
    return `<${propUri}> <${valueUri}>`
  })
}

/**
 * Replace all template variables in SPARQL query
 */
function replaceSPARQL (sparql, absolutePath) {
  if (absolutePath) {
    // Replace __THIS__ with name URI
    if (sparql.includes(THIS)) {
      const name = getNameFromPath(absolutePath)
      const nameUri = nameToUri(name)
      sparql = sparql.replaceAll(THIS, `<${nameUri}>`)
    }

    // Replace __DOC__ with file URI
    if (sparql.includes(DOC)) {
      const fileUri = pathToFileURL(absolutePath)
      sparql = sparql.replaceAll(DOC, `<${fileUri.value}>`)
    }
  }

  // Replace [[WikiLinks]] with name URIs
  sparql = replaceInternalLinks(sparql, (linkText) => {
    const nameUri = nameToUri(linkText.trim())
    return `<${nameUri}>`
  })

  // Replace {{property:value}} patterns
  sparql = replacePropertyReferences(sparql)

  return sparql
}

export { getTemplate, replaceSPARQL }
