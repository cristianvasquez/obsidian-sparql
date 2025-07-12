import { MarkdownRenderer } from 'obsidian'
import { resultsToMarkdownTurtle } from './MarkdownTurtle.js'
import { TriplifyManager } from '../lib/TriplifyManager.js'

/**
 * Vanilla JS DebugPanel class to replace Vue component
 * Shows turtle output for the current file's named graph
 */
export class DebugPanel {
  constructor(container, context) {
    this.container = container
    this.context = context
    this.currentFile = null
    this.isLoading = false
    this.error = null
    this.version = 0
    this.tripleCount = undefined
    this.hasTriples = false

    // Use TriplifyManager for all triplify operations
    this.triplifyManager = new TriplifyManager(context)

    this.init()
  }

  async init() {
    await this.render()

    // Load current file on startup
    const activeFile = this.context.app.workspace.getActiveFile()
    if (activeFile) {
      this.updateFile(activeFile)
    }
  }

  /**
   * Update the debug panel for a specific file
   */
  async updateFile(file) {
    if (!file) {
      this.currentFile = null
      await this.render()
      return
    }

    this.currentFile = file
    this.isLoading = true
    this.error = null
    await this.render()

    try {
      const result = await this.triplifyManager.processFile(file)
      this.tripleCount = result.tripleCount
      this.hasTriples = result.hasTriples
      this.version++

    } catch (error) {
      console.error('DebugPanel update error:', error)
      this.error = error.message || 'Failed to update debug panel'
    } finally {
      this.isLoading = false
      await this.render()
    }
  }


  /**
   * Render the debug panel UI using pure markdown
   */
  async render() {
    let markdown = ''
    
    // File info section
    if (this.currentFile) {
      markdown += `**File:** ${this.currentFile.path} (v${this.version})\n\n`
    }
    
    // Error section
    if (this.error) {
      markdown += `**Error:** \n\n\`\`\`\n${this.error}\n\`\`\`\n\n`
    }
    
    // Content section
    if (!this.currentFile) {
      markdown += 'No file open\n'
    } else if (this.isLoading) {
      markdown += 'Loading...\n'
    } else if (!this.error && this.tripleCount !== undefined) {
      // Results section
      markdown += await this.buildResultsMarkdown()
    }
    
    // Render single markdown string
    await MarkdownRenderer.render(
      this.context.app,
      markdown,
      this.container,
      '',
      this.context.plugin,
    )
  }

  /**
   * Build results markdown section
   */
  async buildResultsMarkdown() {
    let markdown = ''
    
    if (this.tripleCount) {
      markdown += `Triples found: **${this.tripleCount}**\n\n`
      
      if (this.hasTriples) {
        try {
          const results = await this.triplifyManager.getConstructResults(this.currentFile)
          
          if (results && results.length > 0) {
            const turtleContent = await resultsToMarkdownTurtle(results, this.context.app, 'Named Graph Turtle Output')
            markdown += turtleContent + '\n'
          } else {
            markdown += 'No turtle results returned.\n'
          }
        } catch (error) {
          console.error('CONSTRUCT query failed:', error)
          markdown += `**Query Error:** \n\n\`\`\`\n${error.message}\n\`\`\`\n`
        }
      }
    } else {
      markdown += 'No triples found\n'
    }
    
    return markdown
  }

  /**
   * Cleanup when the panel is destroyed
   */
  destroy() {
    // Cancel any pending triplify operations
    this.triplifyManager.destroy()
  }
}
