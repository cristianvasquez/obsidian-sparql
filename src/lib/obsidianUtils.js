/**
 * Get the absolute filesystem path for a file
 * @param {TFile} file - Obsidian file object
 * @param {App} app - Obsidian app instance
 * @returns {string} Absolute filesystem path
 */
export function getAbsolutePath(file, app) {
  const vaultBasePath = app.vault.adapter.path
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