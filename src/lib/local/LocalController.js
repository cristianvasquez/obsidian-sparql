import { Store } from 'oxigraph'
import {
  canProcess,
  getFileExtension,
  ns,
  pathToFileURL,
  triplify,
} from 'vault-triplifier'
import { Controller } from '../Controller.js'
import { NotificationService } from '../NotificationService.js'

export class LocalController extends Controller {
  constructor (app, settings) {
    super(app, settings)

    // Store will be initialized asynchronously
    this.store = null
    this.isInitialized = false
    this.initPromise = this.initializeStore()
    this.notifications = new NotificationService()
  }

  async initializeStore () {
    try {
      // Create the store directly
      this.store = new Store()
      this.isInitialized = true

      // Configure query options for union default graph
      this.queryOptions = {
        use_default_graph_as_union: true,
      }

    } catch (error) {
      console.error('❌ [EMBEDDED] Failed to initialize oxigraph:', error)
      throw error
    }
  }

  async ensureInitialized () {
    if (!this.isInitialized) {
      await this.initPromise
    }
  }

  async select (sparqlQuery) {
    await this.ensureInitialized()
    const results = this.store.query(sparqlQuery, this.queryOptions)
    
    // Convert Map objects to plain objects for consistent interface
    return Array.from(results).map(binding => {
      if (binding instanceof Map) {
        return Object.fromEntries(binding)
      }
      return binding
    })
  }

  async construct (sparqlQuery) {
    await this.ensureInitialized()
    const results = this.store.query(sparqlQuery, this.queryOptions)
    
    // CONSTRUCT queries return quads/triples, convert to array for consistency
    return Array.from(results)
  }

  async syncFile (file, content, showNotifications = false) {
    await this.ensureInitialized()

    if (showNotifications) {
      this.notifications.info(`[Local] Syncing ${file.basename}...`)
    }

    // Get absolute path for triplification
    const absolutePath = this.app.vault.adapter.getFullPath(file.path)
    const extension = getFileExtension(absolutePath)

    // Check if we can process this file type
    if (!canProcess(extension)) {
      return true
    }

    // Use triplifier to convert content to RDF with configured settings
    const triplifierOptions = this.settings.embeddedSettings.triplifierOptions

    const pointer = triplify(absolutePath, content, triplifierOptions)
    const graphUri = pathToFileURL(absolutePath)


    const dataset = pointer.dataset

    // First, remove any existing triples for this file (clear the named graph)
    await this.deleteNamedGraph(file.path)

    // Add all triples from the dataset to the store
    // Ensure all quads are stored in the file's named graph
    for (const quad of dataset) {
      // Create a new quad ensuring it has the correct graph URI
      const graphedQuad = {
        subject: quad.subject,
        predicate: quad.predicate,
        object: quad.object,
        graph: graphUri,  // Always use the file's graph URI
      }
      this.store.add(graphedQuad)
    }


    if (showNotifications) {
      this.notifications.success(`[Local] ${file.basename} synced (${dataset.size} triples)`)
    }

    return true

  }

  async rebuildIndex () {
    await this.ensureInitialized()

    this.notifications.info('[Local] Rebuilding embedded database index...')

    // Clear the entire store by deleting all quads
    for (const quad of this.store.match()) {
      this.store.delete(quad)
    }

    // Process all markdown files in the vault
    const markdownFiles = this.app.vault.getMarkdownFiles()
    let processedFiles = 0

    for (const file of markdownFiles) {
      try {
        const content = await this.app.vault.read(file)

        // Process with embedded triplifier and add to store
        const success = await this.syncFile(file, content, false)
        if (success) {
          processedFiles++
        }
      } catch (error) {
        console.error('❌ [EMBEDDED] Error processing file', file.path, ':',
          error)
      }
    }

    const totalTriples = this.store.size

    this.notifications.success(`[Local] Index rebuilt: ${processedFiles} files, ${totalTriples} triples`)

  }

  async deleteNamedGraph (path, showNotifications = false) {
    await this.ensureInitialized()

    if (showNotifications) {
      this.notifications.info(`[Local] Removing ${path} from embedded database...`)
    }

    // Get the absolute path and create the graph URI
    const absolutePath = this.app.vault.adapter.getFullPath(path)
    const graphUri = pathToFileURL(absolutePath)

    // Delete all quads in the specific named graph efficiently
    const quadsInGraph = this.store.match(null, null, null, graphUri)
    let deletedCount = 0
    
    for (const quad of quadsInGraph) {
      this.store.delete(quad)
      deletedCount++
    }


    if (showNotifications) {
      this.notifications.success(`[Local] ${path} removed from embedded database (${deletedCount} triples)`)
    }

    return true

  }
}
