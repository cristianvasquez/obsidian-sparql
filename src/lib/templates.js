// src/lib/templates.js
import {
  nameToUri,
  pathToFileURL,
  propertyToUri,
} from 'vault-triplifier'
import { getNameFromPath } from './uriUtils.js'

const THIS = '__THIS__' // The URI of the main concept corresponding to the active file
const DOC = '__DOC__' // The URI corresponding to the active file
const DATE = '__DATE__' // The current date
const REPO = '__REPO__' // The URI corresponding to the active repository

/**
 * Replace [[link]] patterns with URIs
 */
export function replaceInternalLinks (text, replacer) {
  return text.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
    return replacer(linkText)
  })
}

/**
 * Replace property placeholders like __label__, __type__, __some property__, __prefixed:value__ etc.
 */
export function replacePropertyPlaceholders (text) {
  return text.replace(/__([a-zA-Z][a-zA-Z0-9_\s:]*?)__/g, (match, property) => {
    // Convert property name to URI using vault-triplifier
    const propUri = propertyToUri(property.trim())
    return `<${propUri}>`
  })
}

/**
 * Replace all template variables in text (both markdown and SPARQL)
 */
function replaceAllTokens (text, absolutePath, activeFile, repoPath) {
  let processed = text

  if (absolutePath) {
    // Replace __THIS__ with name URI
    if (processed.includes(THIS)) {
      const name = getNameFromPath(absolutePath)
      const nameUri = nameToUri(name)
      processed = processed.replaceAll(THIS, `<${nameUri}>`)
    }

    // Replace __DOC__ with file URI
    if (processed.includes(DOC)) {
      const fileUri = pathToFileURL(absolutePath)
      processed = processed.replaceAll(DOC, `<${fileUri.value}>`)
    }
  }

  // Replace __REPO__ with repository URI
  if (processed.includes(REPO) && repoPath) {
    const repoUri = pathToFileURL(repoPath)
    processed = processed.replaceAll(REPO, `<${repoUri.value}>`)
  }

  // Replace __DATE__ with current timestamp
  if (processed.includes(DATE)) {
    const currentTime = new Date().toLocaleTimeString()
    processed = processed.replaceAll(DATE, currentTime)
  }

  // Replace property placeholders like __label__, __type__, etc.
  processed = replacePropertyPlaceholders(processed)

  // Replace [[WikiLinks]] with name URIs
  processed = replaceInternalLinks(processed, (linkText) => {
    const nameUri = nameToUri(linkText.trim())
    return `<${nameUri}>`
  })

  return processed
}

/**
 * Remove YAML frontmatter from markdown content
 */
function removeFrontmatter (content) {
  // Check if content starts with frontmatter
  if (content.trimStart().startsWith('---')) {
    const lines = content.split('\n')
    let frontmatterEnd = -1

    // Find the closing --- after the first line
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        frontmatterEnd = i
        break
      }
    }

    // If we found closing ---, remove frontmatter
    if (frontmatterEnd > 0) {
      return lines.slice(frontmatterEnd + 1).join('\n').trimStart()
    }
  }

  return content
}

function getOSGQueryTemplate () {
  return `

## Named Query

is a :: osg:Query

osg:description :: DESCRIPTION to the agent

osg:instruction :: INSTRUCTION after query

\`\`\`osg
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX dot: <http://pending.org/dot/>
PREFIX oa: <http://www.w3.org/ns/oa#>
PREFIX schema: <http://schema.org/>
PREFIX dct: <http://purl.org/dc/terms/>

SELECT * WHERE {  
    GRAPH __DOC__ {
      ?s ?p ?o
    }
  }
\`\`\`
`
}

function getTemplate () {
  return `
\`\`\`osg
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX dot: <http://pending.org/dot/>
PREFIX oa: <http://www.w3.org/ns/oa#>
PREFIX schema: <http://schema.org/>
PREFIX dct: <http://purl.org/dc/terms/>

SELECT * WHERE {  
    GRAPH ?g {
      __THIS__ ?p ?o
    }
    FILTER (?p!=dot:raw)
    FILTER (?p!=dot:contents)
  } LIMIT 10
\`\`\`
`
}

export {
  replaceAllTokens,
  removeFrontmatter,
  getOSGQueryTemplate,
  getTemplate,
}
