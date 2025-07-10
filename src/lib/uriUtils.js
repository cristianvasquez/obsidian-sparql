import {
  pathFromUri,
  nameFromUri,
  fileUri,
  nameToUri,
  pathToUri,
} from 'vault-triplifier'
import rdf from 'rdf-ext'
import { isFileInVault } from './obsidianUtils.js'

/**
 * Check if a Term represents an internal vault file
 * @param {Term} term - The RDF term to check
 * @param {App} app - Obsidian app instance for vault checking
 * @returns {boolean} True if the term represents a vault file
 */
export function isInternalUri (term, app) {
  if (!term || term.termType !== 'NamedNode') return false

  // First try vault-triplifier's pathFromUri for urn:resource: URIs
  const path = pathFromUri(term)
  if (path !== null && path !== undefined) {
    return app ? isFileInVault(path, app) : true
  }

  // Also check for file:// URIs that point to vault files
  if (term.value.startsWith('file://')) {
    if (app) {
      const url = new URL(term.value)
      return isFileInVault(url.pathname, app)
    }
    return true
  }

  return false
}

/**
 * Check if a Term represents an internal vault note (by name)
 * @param {Term} term - The RDF term to check
 * @returns {boolean} True if the term represents a vault note
 */
export function isInternalNoteUri (term) {
  if (!term || term.termType !== 'NamedNode') return false

  const name = nameFromUri(term)
  return name !== null && name !== undefined
}

/**
 * Get the file path from an internal term
 * @param {Term} term - The internal term
 * @param {App} app - Obsidian app instance for vault checking
 * @returns {string|null} The file path or null if not internal
 */
export function getPathFromInternalUri (term, app) {
  if (!isInternalUri(term, app)) return null

  // First try vault-triplifier's pathFromUri for urn:resource: URIs
  const path = pathFromUri(term)
  if (path !== null && path !== undefined) {
    return path
  }

  // Handle file:// URIs by extracting the path
  if (term.value.startsWith('file://')) {
    const url = new URL(term.value)
    return url.pathname
  }

  return null
}

/**
 * Get the note name from an internal term
 * @param {Term} term - The internal term
 * @returns {string|null} The note name or null if not internal
 */
export function getNameFromInternalUri (term) {
  if (!isInternalNoteUri(term)) return null
  return nameFromUri(term)
}

/**
 * Get a display title from an internal term
 * @param {Term} term - The internal term
 * @returns {string} A human-readable title
 */
export function getTitleFromInternalUri (term) {
  // Try name first (for note URIs like urn:name:NoteName)
  const name = getNameFromInternalUri(term)
  if (name) return name

  // Try path (for file URIs like urn:resource: or file://)
  const path = getPathFromInternalUri(term)
  if (path) {
    // Extract filename from path
    const filename = path.includes('/') ? path.substring(
      path.lastIndexOf('/') + 1) : path
    // Remove .md extension if present
    return filename.endsWith('.md')
      ? filename.substring(0, filename.length - 3)
      : filename
  }

  // Fallback to the term value itself
  return term.value || 'Unknown'
}

/**
 * Check if a Term represents a property that should be rendered as text
 * @param {Term} term - The term to check
 * @returns {boolean} True if the term represents a property
 */
export function isPropertyUri (term) {
  if (!term || term.termType !== 'NamedNode') return false
  return term.value.startsWith('urn:property:')
}

/**
 * Get the property name from a property term
 * @param {Term} term - The property term
 * @returns {string|null} The property name or null if not a property term
 */
export function getPropertyFromUri (term) {
  if (!isPropertyUri(term)) return null
  return term.value.replace('urn:property:', '')
}

/**
 * Check if a Term should be rendered as an internal link (clickable)
 * @param {Term} term - The term to check
 * @param {App} app - Obsidian app instance for vault checking
 * @returns {boolean} True if the term should be an internal link
 */
export function isClickableInternalUri (term, app) {
  return isInternalUri(term, app) || isInternalNoteUri(term)
}

/**
 * Check if a Term represents any kind of vault resource (file, note, or property)
 * @param {Term} term - The term to check
 * @returns {boolean} True if the term represents any vault resource
 */
export function isVaultUri (term) {
  return isInternalUri(term) || isInternalNoteUri(term) || isPropertyUri(term)
}
