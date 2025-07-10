import { nameToUri, fileUri } from 'vault-triplifier'

function getTemplate () {
  return `SELECT * WHERE {
  GRAPH ?g {
\t  __THIS__ ?p ?o  
  }
} LIMIT 10`
}

const THIS = '__THIS__'

const THIS_DOC = '__THIS_DOC__'

export function replaceInternalLinks (text, replacer) {
  // Simple regex to find [[link]] patterns
  return text.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
    return replacer(linkText)
  })
}

function replaceSPARQL (sparql, fileName, absolutePath) {

  if (sparql.includes(THIS)) {
    sparql = sparql.replaceAll(THIS, `<${nameToUri(fileName)}>`)
  }

  if (sparql.includes(THIS_DOC)) {
    sparql = sparql.replaceAll(THIS_DOC, `<${fileUri(absolutePath)}>`)
  }

  const replacer = (str) => {
    return `<${nameToUri(str)}>`
  }

  return replaceInternalLinks(sparql, replacer)
}

export { getTemplate, replaceSPARQL }
