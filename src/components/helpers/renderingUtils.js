import { nameFromUri, propertyFromUri, fileURLToPath } from 'vault-triplifier'
import {
  getNameFromPath,
  isFileUri,
  isNameUri,
  isPropertyUri,
} from '../../lib/uriUtils.js'
import { shrink } from './utils.js'

function renderMarkdown (term) {
  if (term.termType === 'NamedNode') {
    const name = nameFromUri(term)
    if (name) {
      return `[[${name}]]`
    }

    if (isPropertyUri(term)) {
      const propertyLiteral = propertyFromUri(term)
      return `[${propertyLiteral}](${term.value})`
    }

    if (isFileUri(term)) {
      const absolutePath = fileURLToPath(term)
      return `[${getNameFromPath(absolutePath)}](${absolutePath})`
    }

    if (term.termType === 'BlankNode') {
      return `_:${term.value}`
    }

    return `[${shrink(term.value)}](${term.value})`
  }

  return escape(term.value) || ''
}

export { renderMarkdown }
