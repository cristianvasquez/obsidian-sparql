import { PluginSettingTab, Setting } from 'obsidian'
import { MarkdownTriplifierOptions } from 'vault-triplifier'

export const DEFAULT_SETTINGS = {
  mode: 'external', // 'embedded' or 'external'
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

    // Mode selection
    new Setting(containerEl).setName('Database Mode').
      setDesc('Choose between embedded database or external triplestore').
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

    // Embedded database settings (only show when mode is 'embedded')
    if (this.plugin.settings.mode === 'embedded') {
      containerEl.createEl('h3', { text: 'Embedded Database Settings' })

      // Triplifier Options
      new Setting(containerEl).setName('Triplifier Options').
        setDesc(
          'JSON configuration for the triplifier. See documentation: https://github.com/cristianvasquez/vault-triplifier/blob/main/docs/configuration.md').
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

          text.inputEl.style.width = '100%'
          text.inputEl.style.height = '120px'
          text.inputEl.style.fontFamily = 'var(--font-monospace)'
          text.inputEl.style.fontSize = '12px'
        })

      // Indexing Settings
      new Setting(containerEl).setName('Index on Save').
        setDesc('Automatically index files when they are saved.').
        addToggle((toggle) => {
          toggle.setValue(this.plugin.settings.indexOnSave).
            onChange(async (value) => {
              this.plugin.settings.indexOnSave = value
              await this.plugin.saveSettings()
            })
        })

      new Setting(containerEl).setName('Index on Open').
        setDesc('Automatically index files when they are opened for the first time.').
        addToggle((toggle) => {
          toggle.setValue(this.plugin.settings.indexOnOpen).
            onChange(async (value) => {
              this.plugin.settings.indexOnOpen = value
              await this.plugin.saveSettings()
            })
        })

    }

    // Panel Discovery Settings (both sources used simultaneously)
    new Setting(containerEl).setName('Panel Tag Search').
      setDesc(
        'Tag to search for in Obsidian vault files to discover panels.').
      addText((text) => {
        text.setValue(this.plugin.settings.panelTag).
          setPlaceholder('panel/query').
          onChange(async (value) => {
            this.plugin.settings.panelTag = value
            await this.plugin.saveSettings()
          })

        text.inputEl.style.width = '100%'
      })

    new Setting(containerEl).setName('Panel SPARQL Query').
      setDesc(
        'SPARQL query used to discover panels from triplestore. Must return ?document, ?title, and ?content variables.').
      addTextArea((text) => {
        text.setValue(this.plugin.settings.panelQuery).
          setPlaceholder('SPARQL query...').
          onChange(async (value) => {
            this.plugin.settings.panelQuery = value
            await this.plugin.saveSettings()
          })

        text.inputEl.style.width = '100%'
        text.inputEl.style.height = '200px'
        text.inputEl.style.fontFamily = 'var(--font-monospace)'
        text.inputEl.style.fontSize = '12px'
      })
  }
}
