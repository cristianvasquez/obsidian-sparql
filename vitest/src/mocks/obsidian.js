// Mock Obsidian API for testing
export class ItemView {
  constructor(leaf) {
    this.leaf = leaf
  }
}

export class Plugin {
  constructor() {
    this.app = null
  }
}

export class PluginSettingTab {
  constructor(app, plugin) {
    this.app = app
    this.plugin = plugin
  }
}

export class Setting {
  constructor(containerEl) {
    this.containerEl = containerEl
  }
  
  setName(name) {
    this.name = name
    return this
  }
  
  setDesc(desc) {
    this.desc = desc
    return this
  }
  
  addText(callback) {
    if (callback) callback({ setValue: () => this, setPlaceholder: () => this, onChange: () => this })
    return this
  }
  
  addToggle(callback) {
    if (callback) callback({ setValue: () => this, onChange: () => this })
    return this
  }
}

export class TFile {
  constructor(path) {
    this.path = path
    this.basename = path.split('/').pop().replace('.md', '')
  }
}

export class Notice {
  constructor(message) {
    this.message = message
  }
}