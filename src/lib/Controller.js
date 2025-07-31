export class Controller {
  constructor(app, settings) {
    this.app = app
    this.settings = settings
  }

  async select(sparqlQuery) {
    throw new Error('select method must be implemented by subclass')
  }

  async construct(sparqlQuery) {
    throw new Error('construct method must be implemented by subclass')
  }

  async syncFile(file, content, showNotifications = false) {
    throw new Error('syncFile method must be implemented by subclass')
  }

  async rebuildIndex() {
    throw new Error('rebuildIndex method must be implemented by subclass')
  }

  async deleteNamedGraph(path, showNotifications = false) {
    throw new Error('deleteNamedGraph method must be implemented by subclass')
  }
}