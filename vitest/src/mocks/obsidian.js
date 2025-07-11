// vitest/src/mocks/obsidian.js

export class Plugin {
  constructor(app, manifest) {
    this.app = app
    this.manifest = manifest
  }

  onload() {}
  onunload() {}
  addCommand() {}
  addSettingTab() {}
  registerMarkdownCodeBlockProcessor() {}
  registerView() {}
  registerEvent() {}
  loadData() { return Promise.resolve({}) }
  saveData() { return Promise.resolve() }
}

export class PluginSettingTab {
  constructor(app, plugin) {
    this.app = app
    this.plugin = plugin
  }
  display() {}
}

export class ItemView {
  constructor(leaf) {
    this.leaf = leaf
  }
  getViewType() { return '' }
  getDisplayText() { return '' }
  async onOpen() {}
  async onClose() {}
}

export class TFile {
  constructor(path) {
    this.path = path
  }
}

export class Notice {
  constructor(message) {
    console.log('Notice:', message)
  }
}

export class Setting {
  constructor(containerEl) {
    this.containerEl = containerEl
  }
  setName(name) { return this }
  setDesc(desc) { return this }
  addText(cb) {
    cb({
      setValue: () => ({ setPlaceholder: () => ({ onChange: () => {} }) }),
      inputEl: { style: {} }
    })
    return this
  }
  addToggle(cb) {
    cb({
      setValue: () => ({ onChange: () => {} })
    })
    return this
  }
}

// Utility functions
export function normalizePath(path) {
  // Normalize path separators and remove trailing slashes
  return path
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '')
    .replace(/^\//, '')
}

// Export all needed classes and functions
export default {
  Plugin,
  PluginSettingTab,
  ItemView,
  TFile,
  Notice,
  Setting,
  normalizePath
}
