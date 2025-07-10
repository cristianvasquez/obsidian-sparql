import {
  nameFromUri,
  nameToUri
} from 'vault-triplifier'
import rdf from 'rdf-ext'
import { isFileInVault, isNoteInVault } from './obsidianUtils.js'

export const isFileUri = (term) => 
  term?.termType === 'NamedNode' && term.value.startsWith('file://')

export const isNameUri = (term) => 
  term?.termType === 'NamedNode' && nameFromUri(term) !== null

export const isFileInCurrentVault = (term, app) => 
  isFileUri(term) && app && isFileInVault(new URL(term.value).pathname, app)

export const isNameResolved = (term, app) => {
  if (!isNameUri(term) || !app) return false
  const name = nameFromUri(term)
  return name && isNoteInVault(name, app)
}

export const getPathFromFileUri = (term) => 
  isFileUri(term) ? new URL(term.value).pathname : null

export const getNameFromNameUri = (term) => 
  isNameUri(term) ? nameFromUri(term) : null

export const getTitleFromUri = (term, app) => {
  const name = getNameFromNameUri(term)
  if (name) return name
  
  const path = getPathFromFileUri(term)
  if (path) {
    const fileName = path.split('/').pop()
    return fileName.endsWith('.md') ? fileName.replace(/\.md$/, '') : fileName
  }
  
  return term?.value || 'Unknown'
}

export const isPropertyUri = (term) =>
  term?.termType === 'NamedNode' && term.value.startsWith('urn:property:')

export const getPropertyFromUri = (term) =>
  isPropertyUri(term) ? term.value.replace('urn:property:', '') : null

export const isClickableUri = (term, app) => 
  isFileInCurrentVault(term, app) || isNameUri(term)

export const isVaultUri = (term, app) =>
  isFileUri(term) || isNameUri(term) || isPropertyUri(term)
