import { pathToFileURL } from 'vault-triplifier'

function getBasePath (app) {
  return app.vault.adapter?.basePath || app.vault.adapter?.getBasePath?.() || ''
}

function getVaultBaseUri (app) {
  const vaultBasePath = getBasePath(app)
  return pathToFileURL(vaultBasePath)
}

export { getBasePath, getVaultBaseUri }
