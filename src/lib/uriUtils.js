import { nameFromUri } from 'vault-triplifier'
import { normalizePath } from 'obsidian'

export function getNameFromPath (filePath) {
  const fileName = filePath.split('/').pop() || ''
  return fileName.endsWith('.md')
    ? fileName.slice(0, -3)
    : fileName
}

export function isFileUri (term) {
  return term?.termType === 'NamedNode' &&
    term.value?.startsWith('file://')
}

export function isNameUri (term) {
  return term?.termType === 'NamedNode' && nameFromUri(term) !== null
}

/**
 * Get human-readable title from any URI
 */
export function getTitleFromUri (term) {
  if (!term) return 'Unknown'

  // Try name URI first
  const name = nameFromUri(term)
  if (name) return name

  // Try file URI
  const path = getPathFromFileUri(term)
  if (path) return getNameFromPath(path)

  // Fallback
  return term.value || 'Unknown'
}

function getPathFromFileUri (term) {
  const url = new URL(term.value)
  return decodeURIComponent(url.pathname)  // <-- this gives correct file path
}

function peekTerm (term, app) {
  if (isNameUri(term)) {
    const name = nameFromUri(term)
    const sourcePath = app.workspace.getActiveFile().path
    const absPath = app.metadataCache.getFirstLinkpathDest(name,
      sourcePath).path
    const normalized = normalizePath(absPath)
    return {
      term,
      normalized,
      absPath,
    }
  }

  if (isFileUri(term)) {
    const absPath = getPathFromFileUri(term)
    const vaultBase = app.vault.adapter?.basePath ||
      app.vault.adapter?.getBasePath?.()

    if (vaultBase && absPath.startsWith(vaultBase)) {
      let relPath = absPath.slice(vaultBase.length)
      if (relPath.startsWith('/') || relPath.startsWith('\\')) {
        relPath = relPath.slice(1)
      }

      const normalized = normalizePath(relPath)
      return {
        term,
        normalized,
        absPath,
        vaultBase,
      }
    }
  }
  return undefined
}

export { peekTerm }
