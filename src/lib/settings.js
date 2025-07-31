import { PluginSettingTab, Setting } from 'obsidian'

export const DEFAULT_SETTINGS = {
  mode: 'external', // 'embedded' or 'external'
  clientSettings: {
    endpointUrl: 'http://localhost:7878/query',
    updateUrl: 'http://localhost:7878/update',
    headers: {
      'union-default-graph': true,
    },
    user: '',
    password: '',
  },
  allowUpdate: false,
  osgPath: '/home/cvasquez/.local/share/pnpm/osg',
}

export class SparqlSettingTab extends PluginSettingTab {
  constructor (app, plugin) {
    super(app, plugin)
    this.plugin = plugin
  }

  display () {
    const { containerEl } = this
    containerEl.empty()
    containerEl.createEl('h2', { text: 'Settings for obsidian SPARQL' })

    const client = this.plugin.settings.clientSettings

    // Mode selection
    new Setting(containerEl)
      .setName('Database Mode')
      .setDesc('Choose between embedded database or external triplestore')
      .addDropdown((dropdown) => {
        dropdown
          .addOption('embedded', 'Embedded Database (oxygraph-js)')
          .addOption('external', 'External Triplestore')
          .setValue(this.plugin.settings.mode)
          .onChange(async (value) => {
            const oldMode = this.plugin.settings.mode
            this.plugin.settings.mode = value
            await this.plugin.saveSettings()
            
            // Reinitialize controller if mode changed
            if (oldMode !== value) {
              this.plugin.reinitializeController()
            }
            
            this.display() // Refresh the settings panel
          })
      })

    // External triplestore settings (only show when mode is 'external')
    if (this.plugin.settings.mode === 'external') {
      containerEl.createEl('h3', { text: 'External Triplestore Settings' })

      const addTextSetting = (name, desc, key) => {
        new Setting(containerEl).setName(name).setDesc(desc).addText((text) => {
          text.setValue(client[key]).
            setPlaceholder('').
            onChange(async (value) => {
              client[key] = value
              await this.plugin.saveSettings()  
            })

          // Make the input wider and more user-friendly
          text.inputEl.style.width = '100%'
          text.inputEl.style.fontFamily = 'var(--font-monospace)'
          text.inputEl.style.fontSize = '14px'
        })
      }

      addTextSetting('Endpoint URL', 'The query endpoint URL', 'endpointUrl')
      addTextSetting('Update URL', 'The update endpoint URL', 'updateUrl')
      addTextSetting('User', 'Endpoint user (if applicable)', 'user')
      addTextSetting(
        'Password',
        'Endpoint password (if applicable)',
        'password',
      )

      // OSG Path setting
      new Setting(containerEl).setName('OSG Path').
        setDesc('Path to the OSG executable').
        addText((text) => {
          text.setValue(this.plugin.settings.osgPath).
            setPlaceholder('/home/cvasquez/.local/share/pnpm/osg').
            onChange(async (value) => {
              this.plugin.settings.osgPath = value
              await this.plugin.saveSettings()
            })

          text.inputEl.style.width = '100%'
          text.inputEl.style.fontFamily = 'var(--font-monospace)'
          text.inputEl.style.fontSize = '14px'
        })
    }

    new Setting(containerEl).setName('Allow updates').
      setDesc('Enable SPARQL updates in code snippets').
      addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.allowUpdate)
        toggle.onChange(async (value) => {
          this.plugin.settings.allowUpdate = value
          await this.plugin.saveSettings()
        })
      })
  }
}
