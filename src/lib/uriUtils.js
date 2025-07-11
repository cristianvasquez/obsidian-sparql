import { nameFromUri, fileURLToPath } from 'vault-triplifier'
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

function peekTerm (term, app) {

  const vaultBase = app.vault.adapter?.basePath ||
    app.vault.adapter?.getBasePath?.()

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
      vaultBase,
    }
  }

  if (isFileUri(term)) {
    const absPath = fileURLToPath(term)
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
        title: getTitleFromUri(term),
      }
    }
  }
  return undefined
}

export { peekTerm }
