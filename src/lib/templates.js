import { nameToUri, fileURLToPath, pathToFileURL } from 'vault-triplifier'
import { getNameFromPath } from './uriUtils.js'

function getTemplate () {
  return `SELECT * WHERE {
  GRAPH ?g {
\t  __THIS__ ?p ?o  
  }
} LIMIT 10`
}

const THIS = '__THIS__'
const DOC = '__DOC__'

export function replaceInternalLinks (text, replacer) {
  // Simple regex to find [[link]] patterns
  return text.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
    return replacer(linkText)
  })
}

function replaceSPARQL (sparql, absolutePath) {

  if (absolutePath) {
    if (sparql.includes(THIS)) {
      const name = getNameFromPath(absolutePath)
      sparql = sparql.replaceAll(THIS, `<${nameToUri(name)}>`)
    }

    if (sparql.includes(DOC)) {
      sparql = sparql.replaceAll(DOC, `<${pathToFileURL(absolutePath).value}>`)
    }
  }

  const replacer = (str) => {
    return `<${nameToUri(str)}>`
  }

  return replaceInternalLinks(sparql, replacer)
}

export { getTemplate, replaceSPARQL }
