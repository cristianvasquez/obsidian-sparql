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
  panelQueryDiscovery: 'sparql', // 'sparql' or 'obsidian'
  panelObsidianQuery: 'panel/query', // Obsidian search query
  panelDiscoveryQuery: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
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
          'JSON configuration for the triplifier (includeRaw, partitionBy, etc.)').
        addTextArea((text) => {
          text.setValue(JSON.stringify(
            this.plugin.settings.embeddedSettings.triplifierOptions, null, 2)).
            setPlaceholder('{}').
            onChange(async (value) => {
              try {
                this.plugin.settings.embeddedSettings.triplifierOptions = JSON.parse(
                  value)
                await this.plugin.saveSettings()
              } catch (e) {
                console.error('Invalid JSON in triplifier options:', e)
              }
            })

          text.inputEl.style.width = '100%'
          text.inputEl.style.height = '120px'
          text.inputEl.style.fontFamily = 'var(--font-monospace)'
          text.inputEl.style.fontSize = '12px'
        })

    }

    // Panel Query Discovery Method
    new Setting(containerEl).setName('Panel Query Discovery').
      setDesc(
        'Choose how to discover panel queries: SPARQL (query triplestore) or Obsidian (search vault files)').
      addDropdown((dropdown) => {
        dropdown.addOption('sparql', 'SPARQL Query').
          addOption('obsidian', 'Obsidian File Search').
          setValue(this.plugin.settings.panelQueryDiscovery).
          onChange(async (value) => {
            this.plugin.settings.panelQueryDiscovery = value
            await this.plugin.saveSettings()
            this.display() // Refresh to show/hide query textarea
          })
      })

    // Show appropriate query setting based on discovery method
    if (this.plugin.settings.panelQueryDiscovery === 'sparql') {
      new Setting(containerEl).setName('Panel Discovery Query').
        setDesc(
          'SPARQL query used to discover panel queries. Must return ?document, ?title, and ?content variables.').
        addTextArea((text) => {
          text.setValue(this.plugin.settings.panelDiscoveryQuery).
            setPlaceholder('SPARQL query...').
            onChange(async (value) => {
              this.plugin.settings.panelDiscoveryQuery = value
              await this.plugin.saveSettings()
            })

          text.inputEl.style.width = '100%'
          text.inputEl.style.height = '200px'
          text.inputEl.style.fontFamily = 'var(--font-monospace)'
          text.inputEl.style.fontSize = '12px'
        })
    } else if (this.plugin.settings.panelQueryDiscovery === 'obsidian') {
      new Setting(containerEl).setName('Obsidian Search Query').
        setDesc(
          'Obsidian search query used to find panel query files (e.g. "tag:#panel/query", "path:Queries/", etc.)').
        addText((text) => {
          text.setValue(this.plugin.settings.panelObsidianQuery).
            setPlaceholder('tag:#panel/query').
            onChange(async (value) => {
              this.plugin.settings.panelObsidianQuery = value
              await this.plugin.saveSettings()
            })

          text.inputEl.style.width = '100%'
          text.inputEl.style.fontFamily = 'var(--font-monospace)'
          text.inputEl.style.fontSize = '14px'
        })
    }

    // new Setting(containerEl).setName('Allow updates').
    //   setDesc('Enable SPARQL updates in code snippets').
    //   addToggle((toggle) => {
    //     toggle.setValue(this.plugin.settings.allowUpdate)
    //     toggle.onChange(async (value) => {
    //       this.plugin.settings.allowUpdate = value
    //       await this.plugin.saveSettings()
    //     })
    //   })
  }
}
