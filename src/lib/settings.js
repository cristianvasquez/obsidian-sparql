import { PluginSettingTab, Setting } from 'obsidian'
import { MarkdownTriplifierOptions } from 'vault-triplifier'

export const DEFAULT_SETTINGS = {
  mode: 'external', // 'embedded' or 'external' - triplestore mode
  triplifierMode: 'external', // 'embedded' or 'external' - triplifier mode
  clientSettings: {
    endpointUrl: 'http://localhost:7878/query?union-default-graph',
    updateUrl: 'http://localhost:7878/update?union-default-graph',
    user: '',
    password: '',
  },
  allowUpdate: false,
  osgPath: '/home/cvasquez/.local/share/pnpm/osg',
  embeddedSettings: {
    triplifierOptions: {
      partitionBy: [
        'headers-h2-h3',
        'identifier',
      ],
      includeLabelsFor: [
        'documents',
        'sections',
        'anchors',
      ],
      includeSelectors: true,
      includeRaw: true,
      prefix: {
        rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
        schema: 'http://schema.org/',
        foaf: 'http://xmlns.com/foaf/0.1/',
        dc: 'http://purl.org/dc/elements/1.1/',
        dct: 'http://purl.org/dc/terms/',
        osg: 'http://pending.org/osg/',
        dot: 'http://pending.org/dot/',
      },
      mappings: {
        'is a': 'rdf:type',
        'domain': 'rdfs:domain',
        'range': 'rdfs:range',
        'see also': 'rdfs:seeAlso',
        'same as': 'rdf:sameAs',
        'knows': 'foaf:knows',
        'title': 'dct:title',
        'created': 'dct:created',
        'modified': 'dct:modified',
        'description': 'dct:description',
      },
    },
  },
  rebuildOnStartup: false, // Rebuild entire index when plugin starts
  indexOnSave: true, // Index files when they are saved
  indexOnOpen: false, // Index files when they are opened for the first time
  panelTag: 'panel/query', // Tag to search for in Obsidian
  panelQuery: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX dot: <http://pending.org/dot/>
PREFIX dcterms: <http://purl.org/dc/terms/>

SELECT ?document ?title ?content WHERE {    
    GRAPH ?g {  
        ?document a dot:MarkdownDocument .        
        ?document dot:tag "panel/query" .        
        ?document dot:raw ?content .        
        OPTIONAL { ?document dcterms:title ?title }    
        OPTIONAL { ?document <urn:property:order> ?order }
    }
} ORDER BY ?order`,
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

    // Create main sections with visual separation
    this.createTriplestoreSection(containerEl)
    this.createTriplifierSection(containerEl)
    this.createPanelDiscoverySection(containerEl)
  }

  createTriplestoreSection(containerEl) {
    // Triplestore section header
    const triplestoreSection = containerEl.createEl('div', { cls: 'setting-section' })
    triplestoreSection.createEl('h3', { text: '🗄️ Triplestore Configuration' })
    triplestoreSection.createEl('p', { 
      text: 'Choose how and where to store RDF triples from your notes.',
      cls: 'setting-section-desc'
    })

    // Triplestore Mode selection
    new Setting(triplestoreSection).setName('Triplestore Mode').
      setDesc('Embedded: Local database in your vault. External: Remote SPARQL endpoint.').
      addDropdown((dropdown) => {
        dropdown.addOption('embedded', 'Embedded Database (oxygraph-js)').
          addOption('external', 'External Triplestore').
          setValue(this.plugin.settings.mode).
          onChange(async (value) => {
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
      this.addExternalTriplestoreSettings(triplestoreSection)
    }

    // Embedded database settings (only show when mode is 'embedded')
    if (this.plugin.settings.mode === 'embedded') {
      this.addEmbeddedTriplestoreSettings(triplestoreSection)
    }
  }

  createTriplifierSection(containerEl) {
    // Triplifier section header
    const triplifierSection = containerEl.createEl('div', { cls: 'setting-section' })
    triplifierSection.createEl('h3', { text: '⚙️ Triplifier Configuration' })
    triplifierSection.createEl('p', { 
      text: 'Choose how to convert your markdown notes into RDF triples.',
      cls: 'setting-section-desc'
    })

    // Triplification triggers at the top
    this.addTriplificationTriggers(triplifierSection)

    // Triplifier Mode selection
    new Setting(triplifierSection).setName('Triplifier Mode').
      setDesc('Embedded: Built-in vault-triplifier. External: OSG command-line tool.').
      addDropdown((dropdown) => {
        // Show different options based on triplestore mode
        if (this.plugin.settings.mode === 'embedded') {
          // For embedded triplestore, only embedded triplifier is valid
          dropdown.addOption('embedded', 'Embedded (vault-triplifier)')
        } else {
          // For external triplestore, both embedded and external are valid
          dropdown.addOption('embedded', 'Embedded (vault-triplifier)').
            addOption('external', 'External (OSG triplifier)')
        }
        
        // Ensure current value is valid for the triplestore mode
        let currentValue = this.plugin.settings.triplifierMode
        if (this.plugin.settings.mode === 'embedded' && (currentValue === 'external' || currentValue === 'none')) {
          // Invalid combination - default to embedded
          currentValue = 'embedded'
          this.plugin.settings.triplifierMode = currentValue
          this.plugin.saveSettings()
        } else if (currentValue === 'none') {
          // 'none' option removed - default to appropriate option
          currentValue = this.plugin.settings.mode === 'embedded' ? 'embedded' : 'external'
          this.plugin.settings.triplifierMode = currentValue
          this.plugin.saveSettings()
        }
        
        dropdown.setValue(currentValue).
          onChange(async (value) => {
            const oldTriplifierMode = this.plugin.settings.triplifierMode
            this.plugin.settings.triplifierMode = value
            await this.plugin.saveSettings()

            // Reinitialize controller if triplifier mode changed
            if (oldTriplifierMode !== value) {
              this.plugin.reinitializeController()
            }

            this.display() // Refresh the settings panel
          })
      })

    // External triplifier settings (show when using external triplifier)
    if (this.plugin.settings.triplifierMode === 'external') {
      this.addExternalTriplifierSettings(triplifierSection)
    }

    // Embedded triplifier settings (only show when triplifierMode is 'embedded')
    if (this.plugin.settings.triplifierMode === 'embedded') {
      this.addEmbeddedTriplifierSettings(triplifierSection)
    }
  }

  createPanelDiscoverySection(containerEl) {
    // Panel Discovery section header
    const panelSection = containerEl.createEl('div', { cls: 'setting-section' })
    panelSection.createEl('h3', { text: '🔍 Panel Discovery' })
    panelSection.createEl('p', { 
      text: 'Configure how to discover SPARQL query panels in your vault.',
      cls: 'setting-section-desc'
    })
    
    // Add link to examples
    const examplesDiv = panelSection.createEl('div', { cls: 'setting-item-description' })
    examplesDiv.innerHTML = '💡 <strong>Examples:</strong> See <a href="https://github.com/cristianvasquez/obsidian-sparql/tree/main/example-panels" target="_blank">example-panels/</a> for ready-to-use SPARQL query panels you can copy to your vault.'

    // Panel Discovery Settings (both sources used simultaneously)
    new Setting(panelSection).setName('Panel Tag Search').
      setDesc('Tag to search for in Obsidian vault files to discover panels.').
      addText((text) => {
        text.setValue(this.plugin.settings.panelTag).
          setPlaceholder('panel/query').
          onChange(async (value) => {
            this.plugin.settings.panelTag = value
            await this.plugin.saveSettings()
          })

        text.inputEl.style.width = '100%'
        text.inputEl.style.fontFamily = 'var(--font-monospace)'
      })

    new Setting(panelSection).setName('Panel SPARQL Query').
      setDesc('SPARQL query used to discover panels from triplestore. Must return ?document, ?title, and ?content variables.').
      addTextArea((text) => {
        text.setValue(this.plugin.settings.panelQuery).
          setPlaceholder('SPARQL query...').
          onChange(async (value) => {
            this.plugin.settings.panelQuery = value
            await this.plugin.saveSettings()
          })

        // Make text area much larger and more readable
        text.inputEl.style.width = '100%'
        text.inputEl.style.height = '300px'
        text.inputEl.style.fontFamily = 'var(--font-monospace)'
        text.inputEl.style.fontSize = '13px'
        text.inputEl.style.lineHeight = '1.4'
        text.inputEl.style.resize = 'vertical'
      })
  }

  addExternalTriplestoreSettings(container) {
    container.createEl('h4', { text: 'External Triplestore Connection' })

    const client = this.plugin.settings.clientSettings

    const addTextSetting = (name, desc, key) => {
        new Setting(container).setName(name).setDesc(desc).addText((text) => {
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
      addTextSetting('Password', 'Endpoint password (if applicable)', 'password')
  }

  addEmbeddedTriplestoreSettings(container) {
    container.createEl('h4', { text: 'Embedded Database Options' })
    
    // Add any embedded triplestore specific settings here in the future
    container.createEl('p', { 
      text: 'The embedded database stores triples locally using oxigraph-js.',
      cls: 'setting-item-description'
    })
  }

  addExternalTriplifierSettings(container) {
    container.createEl('h4', { text: 'OSG External Triplifier' })
    
    new Setting(container).setName('OSG Path').
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

  addEmbeddedTriplifierSettings(container) {
    container.createEl('h4', { text: 'Vault-Triplifier Configuration' })

    // Triplifier Options
    new Setting(container).setName('Triplifier Options').
      setDesc('JSON configuration for the triplifier. See documentation: https://github.com/cristianvasquez/vault-triplifier/blob/main/docs/configuration.md').
      addTextArea((text) => {
        text.setValue(JSON.stringify(
          this.plugin.settings.embeddedSettings.triplifierOptions, null, 2)).
          setPlaceholder('{}').
          onChange(async (value) => {
            try {
              // First parse the JSON
              const parsedValue = JSON.parse(value)
              
              // Then validate against the schema
              const validatedOptions = MarkdownTriplifierOptions.parse(parsedValue)
              
              // Only save if validation succeeds
              this.plugin.settings.embeddedSettings.triplifierOptions = validatedOptions
              await this.plugin.saveSettings()
              
              // Clear any previous error styling
              text.inputEl.style.borderColor = ''
              text.inputEl.style.backgroundColor = ''
            } catch (e) {
              // Show error styling
              text.inputEl.style.borderColor = 'var(--text-error)'
              text.inputEl.style.backgroundColor = 'var(--background-modifier-error)'
              
              let errorMessage = 'Invalid configuration: '
              if (e instanceof SyntaxError) {
                errorMessage += 'Invalid JSON syntax'
              } else if (e.errors) {
                // Zod validation errors
                errorMessage += e.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
              } else {
                errorMessage += e.message
              }
              
              console.error('Triplifier options validation error:', errorMessage)
              
              // Show error message to user (you could also use a Notice here)
              text.inputEl.title = errorMessage
            }
          })

        // Make text area much larger and more readable
        text.inputEl.style.width = '100%'
        text.inputEl.style.height = '400px'
        text.inputEl.style.fontFamily = 'var(--font-monospace)'
        text.inputEl.style.fontSize = '13px'
        text.inputEl.style.lineHeight = '1.4'
        text.inputEl.style.resize = 'vertical'
      })
  }

  addTriplificationTriggers(container) {
    container.createEl('h5', { text: 'Triplification Triggers' })
    container.createEl('p', { 
      text: 'Configure when to automatically convert your markdown files to RDF triples.',
      cls: 'setting-item-description'
    })
    
    // Startup indexing
    new Setting(container).setName('Rebuild Index on Startup').
      setDesc('Completely rebuild the RDF index when the plugin starts (reprocesses all vault files).').
      addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.rebuildOnStartup || false).
          onChange(async (value) => {
            this.plugin.settings.rebuildOnStartup = value
            await this.plugin.saveSettings()
          })
      })

    // File save indexing
    new Setting(container).setName('Index on Save').
      setDesc('Automatically convert files to RDF when they are saved.').
      addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.indexOnSave).
          onChange(async (value) => {
            this.plugin.settings.indexOnSave = value
            await this.plugin.saveSettings()
          })
      })

    // File open indexing
    new Setting(container).setName('Index on Open').
      setDesc('Automatically convert files to RDF when they are opened for the first time.').
      addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.indexOnOpen).
          onChange(async (value) => {
            this.plugin.settings.indexOnOpen = value
            await this.plugin.saveSettings()
          })
      })
  }
}
