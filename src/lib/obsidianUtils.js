/**
 * Get the absolute filesystem path for a file
 * @param {TFile} file - Obsidian file object
 * @param {App} app - Obsidian app instance
 * @returns {string} Absolute filesystem path
 */
export function getAbsolutePath(file, app) {
  if (!file || !app || !app.vault || !app.vault.adapter) {
    throw new Error('Invalid file or app provided to getAbsolutePath')
  }
  
  const vaultBasePath = app.vault.adapter.path
  if (!vaultBasePath || !file.path) {
    throw new Error('Unable to determine vault path or file path')
  }
  
  return `${vaultBasePath}/${file.path}`
}

/**
 * Check if a file path belongs to the current vault
 * @param {string} filePath - Absolute or relative file path
 * @param {App} app - Obsidian app instance
 * @returns {boolean} True if the file path is within the current vault
 */
export function isFileInVault(filePath, app) {
  const vaultBasePath = app.vault.adapter.path
  
  // Handle absolute paths
  if (filePath.startsWith('/')) {
    return filePath.startsWith(vaultBasePath)
  }
  
  // For relative paths, check if the file exists in the vault
  return app.vault.getAbstractFileByPath(filePath) !== null
}

/**
 * Check if a note name exists in the current vault (resolved)
 * @param {string} noteName - The note name to check
 * @param {App} app - Obsidian app instance
 * @returns {boolean} True if the note exists in the vault
 */
export function isNoteInVault(noteName, app) {
  // Try with .md extension first
  const mdFile = app.vault.getAbstractFileByPath(`${noteName}.md`)
  if (mdFile) return true
  
  // Try without extension
  const plainFile = app.vault.getAbstractFileByPath(noteName)
  if (plainFile) return true
  
  // Search through all files for a match
  const files = app.vault.getFiles()
  return files.some(file => {
    const fileName = file.basename
    return fileName === noteName
  })
}