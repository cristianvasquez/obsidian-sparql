import { nameFromUri, propertyFromUri, fileURLToPath } from 'vault-triplifier'
import {
  getNameFromPath, isFileUri, isPropertyUri,
} from '../../lib/uriUtils.js'
import { shrink } from './utils.js'
import { pathToFileURL } from 'vault-triplifier'

function getBasePath (app) {
  return app.vault.adapter?.basePath || app.vault.adapter?.getBasePath?.() || ''
}

function namedAsMarkdown (term) {
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
    // const basePath = app.vault.adapter?.basePath ||
    //   app.vault.adapter?.getBasePath?.() || ''

    const name = getNameFromPath(absolutePath)
    return absolutePath.startsWith(basePath)
      ? `[[${name}]]`
      : `[${name}](${pathToFileURL(absolutePath)})`
  }
  return `[${shrink(term.value)}](${term.value})`
}

function termAsMarkdown (term, basePath) {
  if (term.termType === 'NamedNode') {
    return namedAsMarkdown(term, basePath)
  }

  if (term.termType === 'BlankNode') {
    return `_:${term.value}`
  }
  return safe(term.value)

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

export { termAsMarkdown, getBasePath, namedAsMarkdown }
