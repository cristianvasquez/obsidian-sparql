import { nameFromUri, propertyFromUri, fileURLToPath } from 'vault-triplifier'
import {
  getNameFromPath, isFileUri, isPropertyUri,
} from '../lib/uriUtils.js'
import { pathToFileURL } from 'vault-triplifier'
import { prefixes } from '../namespaces.js'

function shrink (uriStr) {

  for (const [namespace, prefix] of Object.entries(prefixes)) {
    if (uriStr.startsWith(namespace)) {
      return uriStr.replace(namespace, prefix)
    }
  }
  return uriStr
}

// TODO use Obsidian URLs when the vault is known
// obsidian://open?vault=experiments&file=SomeNote
function namedAsMarkdown (term, basePath) {
  const name = nameFromUri(term)
  if (name) {
    return `[[${name}]]`
  }

  if (isPropertyUri(term)) {
    const propertyLiteral = propertyFromUri(term)
    return `\`${propertyLiteral}\``
  }

  if (isFileUri(term)) {
    const absolutePath = fileURLToPath(term)

    const name = getNameFromPath(absolutePath)
    return (absolutePath.startsWith(basePath) && absolutePath.endsWith('.md'))
      ? `[[${name}.md]]`
      : `[${name}](${pathToFileURL(absolutePath)})`
  }
  return `[${shrink(term.value)}](${term.value})`
}

function termAsMarkdown (term, basePath) {

  if (term.termType === 'NamedNode') {
    return namedAsMarkdown(term, basePath)
  }

  if (term.termType === 'BlankNode') {
    return `_:${term.value.substring(0, 15)}`
  }

  if (term.termType === 'Literal') {
    let literal = `"${safe(term.value)}"`
    if (term.language) {
      literal += `@${term.language}`
    }
    // else if (term.datatype && term.datatype.value !==
    //   'http://www.w3.org/2001/XMLSchema#string') {
    //   console.log(term.datatype.value, shrink(term.datatype.value))
    //   literal += `^^<${shrink(term.datatype.value)}>`
    // }
    return literal
  }
  term.value
}

function safe (value) {
  return value.replaceAll('```osg', '```').
    replaceAll('|', '\\|').
    replaceAll('\n', ' ').
    replaceAll('\r', '').
    replaceAll('```', '`').
    replaceAll('[', '').
    replaceAll(']', '').
    replaceAll('(', '').
    replaceAll(')', '')

}

export { termAsMarkdown, safe }
