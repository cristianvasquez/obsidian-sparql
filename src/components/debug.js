import { Modal } from 'obsidian'

class DebugModal extends Modal {
  constructor (app, debugData) {
    super(app)
    this.debugData = debugData
  }

  onOpen () {
    const { contentEl } = this
    contentEl.empty()

    contentEl.createEl('h2', { text: 'SPARQL Debug Info' })

    const pre = contentEl.createEl('pre')
    pre.style.whiteSpace = 'pre-wrap'
    pre.style.maxHeight = '60vh'
    pre.style.overflowY = 'auto'
    pre.textContent = JSON.stringify(this.debugData, null, 2)
  }

  onClose () {
    const { contentEl } = this
    contentEl.empty()
  }
}

export { DebugModal }
