import { Notice } from 'obsidian'

/**
 * Simple error handler for triplestore connectivity issues
 */
export function handleTriplestoreError(error, settings) {
  const message = error.message || String(error)
  console.log('handleTriplestoreError called with:', message)

  // Triplestore connection errors  
  if (message.includes('ECONNREFUSED') || message.includes('Failed to fetch')) {
    showActionNotice('❌ Triplestore is down - cannot reach SPARQL endpoint', 'Start Triplestore', () => {
      runOSGCommand('triplestore start', settings)
    })
    return
  }

  // Default error - no action for other errors
  new Notice(`❌ ${message}`)
}

function showActionNotice(errorMsg, actionText, actionFn) {
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

async function runOSGCommand(command, settings) {
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
