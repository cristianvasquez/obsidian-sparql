import { MarkdownRenderer, Notice } from 'obsidian'

/**
 * Render error state as HTML/markdown
 * @param {Error|string} error - Error to display
 * @param {HTMLElement} container - Container to render into
 * @param {Object} context - Plugin context with app, settings, etc.
 * @returns {Promise<void>}
 */
export async function renderError (error, container, context) {
  const errorMessage = error instanceof Error ? error.message : String(error)

  // Try to handle triplestore errors with actionable notices
  if (handleTriplestoreError(error, context.plugin.settings)) {
    // Error was handled with notice, still render basic error
    const markdown = `**Error:** \n\n\`\`\`\n${errorMessage}\n\`\`\`\n`
    
    const activeFile = context.app.workspace.getActiveFile()
    const sourcePath = activeFile ? activeFile.path : ''

    await MarkdownRenderer.render(
      context.app,
      markdown,
      container,
      sourcePath,
      context.plugin,
    )
    return
  }

  // Standard error rendering for non-triplestore errors
  const markdown = `**Error:** \n\n\`\`\`\n${errorMessage}\n\`\`\`\n`

  const activeFile = context.app.workspace.getActiveFile()
  const sourcePath = activeFile ? activeFile.path : ''

  await MarkdownRenderer.render(
    context.app,
    markdown,
    container,
    sourcePath,
    context.plugin,
  )
}

/**
 * Handle triplestore connectivity errors with actionable notices
 * @param {Error|string} error - Error to check
 * @param {Object} settings - Plugin settings
 * @returns {boolean} True if error was handled
 */
function handleTriplestoreError (error, settings) {
  const message = error.message || String(error)

  // Triplestore connection errors
  if (message.includes('ECONNREFUSED') || message.includes('Failed to fetch')) {
    showActionNotice('❌ Triplestore is down - cannot reach SPARQL endpoint',
      'Start Triplestore', async () => {
        await runOSGCommand('triplestore start', settings)
      })
    return true // Handled
  }

  return false // Not handled
}

function showActionNotice (errorMsg, actionText, actionFn) {
  const notice = new Notice(`❌ ${errorMsg}`, 0) // Persistent notice

  // Add action button to notice
  const button = document.createElement('button')
  button.textContent = actionText
  button.style.marginLeft = '10px'
  button.style.padding = '2px 8px'
  button.onclick = () => {
    actionFn()
    notice.hide()
  }

  notice.noticeEl.appendChild(button)
}

async function runOSGCommand (command, settings) {
  try {
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execAsync = promisify(exec)

    new Notice(`Running osg ${command}...`)
    const { stdout, stderr } = await execAsync(`${settings.osgPath} ${command}`)

    if (stderr && !stdout) {
      new Notice(`❌ Command failed: ${stderr}`)
    } else {
      new Notice(`✅ Command completed: osg ${command}`)
    }
  } catch (error) {
    new Notice(`❌ Failed to run command: ${error.message}`)
  }
}