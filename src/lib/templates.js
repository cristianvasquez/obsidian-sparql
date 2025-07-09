import { fileUri, nameFromUri, nameToUri } from 'vault-triplifier'

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

function replaceSPARQL (sparql, activeFile) {

  if (sparql.includes(THIS)) {
    const name = activeFile.basename
    sparql = sparql.replaceAll(THIS, `<${nameToUri(name)}>`)
  }

  if (sparql.includes(THIS_DOC)) {
    sparql = sparql.replaceAll(THIS_DOC, `<${fileUri(activeFile)}>`)
  }

  const replacer = (str) => {
    return `<${nameToUri(str)}>`
  }

  return replaceInternalLinks(sparql, replacer)
}

export { getTemplate, replaceSPARQL }
