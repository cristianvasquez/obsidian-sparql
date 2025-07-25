function getBasePath (app) {
  return app.vault.adapter?.basePath || app.vault.adapter?.getBasePath?.() || ''
}

export { getBasePath }
