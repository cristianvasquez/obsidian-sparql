import {
  nameFromUri,
  fileURLToPath,
  propertyFromUri,
} from 'vault-triplifier'
import { normalizePath } from 'obsidian'
import { shrink } from '../components/helpers/utils.js'

/**
 * Get the display name from a file path
 * @param {string} filePath - The file path
 * @returns {string} The name without .md extension
 */
export function getNameFromPath (filePath) {
  if (!filePath) return ''
  const fileName = filePath.split('/').pop() || ''
  return fileName.endsWith('.md') ? fileName.slice(0, -3) : fileName
}

/**
 * Check if a term is a file URI
 * @param {Object} term - RDF term
 * @returns {boolean}
 */
export function isFileUri (term) {
  return term?.termType === 'NamedNode' &&
    term.value?.startsWith('file://')
}

/**
 * Check if a term is a name URI
 * @param {Object} term - RDF term
 * @returns {boolean}
 */
export function isNameUri (term) {
  return term?.termType === 'NamedNode' &&
    nameFromUri(term) !== null
}

/**
 * Check if a term is a property URI
 * @param {Object} term - RDF term
 * @returns {boolean}
 */
export function isPropertyUri (term) {
  return term?.termType === 'NamedNode' &&
    propertyFromUri(term) !== null
}

/**
 * Get internal link info from a term
 * @param {Object} term - RDF term
 * @param {Object} app - Obsidian app instance
 * @returns {Object|undefined} Link info or undefined
 */
export function getInternalLinkInfo (term, app) {
  if (!term || !app) return undefined

  try {
    // Handle name URIs
    if (isNameUri(term)) {
      const name = nameFromUri(term)
      if (!name) return undefined

      // Try to resolve the name to a file
      const activeFile = app.workspace.getActiveFile()
      const sourcePath = activeFile?.path || ''
      const file = app.metadataCache.getFirstLinkpathDest(name, sourcePath)

      return {
        type: 'name',
        name: name,
        path: file?.path || name, // Use name as path if unresolved
        resolved: !!file,
        displayName: name,
      }
    }

    // Handle file URIs
    if (isFileUri(term)) {
      const absolutePath = fileURLToPath(term)
      if (!absolutePath) return undefined

      // Get vault base path
      const vaultBase = app.vault.adapter?.basePath ||
        app.vault.adapter?.getBasePath?.() || ''

      // Check if file is in vault
      if (!vaultBase || !absolutePath.startsWith(vaultBase)) {
        return undefined
      }

      // Get relative path
      let relativePath = absolutePath.slice(vaultBase.length)
      if (relativePath.startsWith('/') || relativePath.startsWith('\\')) {
        relativePath = relativePath.slice(1)
      }

      const normalized = normalizePath(relativePath)
      const displayName = getNameFromPath(normalized)

      return {
        type: 'file',
        name: displayName,
        path: normalized,
        resolved: true, // File URIs are always resolved
        displayName: displayName,
      }
    }

    return undefined
  } catch (error) {
    console.error('Error getting internal link info:', error)
    return undefined
  }
}
