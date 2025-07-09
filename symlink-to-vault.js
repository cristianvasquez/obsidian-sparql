// symlink-to-vault.js
import fs from 'fs'
import path from 'path'
import os from 'os'
import readline from 'readline'

const HOME = os.homedir()

// You may need to adjust these default vault base paths per OS
const defaultVaultPaths = [
  path.join(HOME, 'obsidian'),
  // Add more common locations if needed
]

function listVaults (basePaths) {
  let vaults = []
  for (const basePath of basePaths) {
    if (fs.existsSync(basePath)) {
      const entries = fs.readdirSync(basePath, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory()) {
          vaults.push(
            { name: entry.name, fullPath: path.join(basePath, entry.name) })
        }
      }
    }
  }
  return vaults
}

function askQuestion (query) {
  const rl = readline.createInterface(
    { input: process.stdin, output: process.stdout })
  return new Promise(resolve => rl.question(query, ans => {
    rl.close()
    resolve(ans)
  }))
}

async function main () {
  const vaults = listVaults(defaultVaultPaths)
  if (vaults.length === 0) {
    console.error('No vaults found in default locations.')
    process.exit(1)
  }

  console.log('Select your Obsidian vault to link plugin into:')
  vaults.forEach(({ name }, i) => console.log(`[${i + 1}] ${name}`))

  let choice = await askQuestion('Enter number: ')
  const idx = parseInt(choice, 10) - 1
  if (idx < 0 || idx >= vaults.length) {
    console.error('Invalid choice')
    process.exit(1)
  }

  const selectedVault = vaults[idx]
  const pluginSource = process.cwd()
  const pluginsDir = path.join(selectedVault.fullPath, '.obsidian', 'plugins')

  if (!fs.existsSync(pluginsDir)) {
    console.error(`Vault plugins folder does not exist: ${pluginsDir}`)
    process.exit(1)
  }

  const linkName = path.join(pluginsDir, 'obsidian-sparql')

  if (fs.existsSync(linkName)) {
    fs.rmSync(linkName, { recursive: true, force: true })
    console.log(`Removed existing symlink/folder: ${linkName}`)
  }

  fs.symlinkSync(pluginSource, linkName, 'junction')
  console.log(`Symlink created:\n${linkName} -> ${pluginSource}`)
}

await main()
