import { Store } from 'oxigraph'
import rdf from 'rdf-ext'
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
    return this.store.query(sparqlQuery, this.queryOptions)
  }

  async construct (sparqlQuery) {
    await this.ensureInitialized()
    return this.store.query(sparqlQuery, this.queryOptions)
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

    // // Add metadata like the external triplifier does
    // const now = new Date()
    // pointer.node(graphUri).
    //   addOut(dct.modified, toRdf(now.toISOString(), ns.xsd.dateTime))

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

    // Clear the entire store first
    const allQuads = this.store.match()
    for (const quad of allQuads) {
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

    // Find all quads that belong to this file (either as graph or subject/object)
    const quadsToDelete = this.store.match(null, null, null, null).
      filter(quad => {
        // Check if this quad is related to our file URI
        return quad.subject.value === graphUri.value ||
          quad.object.value === graphUri.value ||
          (quad.graph && quad.graph.value === graphUri.value)
      })


    // Delete each quad
    let deletedCount = 0
    for (const quad of quadsToDelete) {
      if (this.store.has(quad)) {
        this.store.delete(quad)
        deletedCount++
      }
    }


    if (showNotifications) {
      this.notifications.success(`[Local] ${path} removed from embedded database (${deletedCount} triples)`)
    }

    return true

  }
}
