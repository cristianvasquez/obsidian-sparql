import {
  canProcess,
  getFileExtension,
  pathToFileURL,
  triplify,
  ns,
} from 'vault-triplifier'
import { toRdf } from 'rdf-literal'
import rdf from 'rdf-ext'

import { TriplifierService } from './TriplifierService.js'
import { getBasePath, getVaultBaseUri } from '../utils.js'

const dct = rdf.namespace('http://purl.org/dc/terms/')

/**
 * Triplifier service that uses the embedded vault-triplifier package
 */
export class EmbeddedTriplifierService extends TriplifierService {
  constructor (app, settings) {
    super(app, settings)
  }

  // Create Dublin Core Terms namespace locally

  async triplify (absolutePath, content) {
    const extension = getFileExtension(absolutePath)

    if (!canProcess(extension)) {
      return null
    }

    // Use triplifier options from settings
    const triplifierOptions = this.settings.embeddedSettings?.triplifierOptions ||
      {}

    const pointer = triplify(absolutePath, content, triplifierOptions)
    const graphUri = pathToFileURL(absolutePath)

    // Get vault base URI using centralized function
    const repoUri = getVaultBaseUri(this.app)
    const vaultBasePath = getBasePath(this.app)

    // Get file timestamps from Obsidian
    const file = this.app.vault.getAbstractFileByPath(
      absolutePath.replace(vaultBasePath + '/', ''))
    if (file && file.stat) {
      // Add repository and timestamp metadata to the graph
      pointer.node(graphUri).
        addOut(ns.dot.inRepository, repoUri).
        addOut(dct.created,
          toRdf(new Date(file.stat.ctime).toISOString(), ns.xsd.dateTime)).
        addOut(dct.modified,
          toRdf(new Date(file.stat.mtime).toISOString(), ns.xsd.dateTime))
    }

    return {
      dataset: pointer.dataset,
      graphUri,
    }
  }

  canProcess (absolutePath) {
    const extension = getFileExtension(absolutePath)
    return canProcess(extension)
  }
}
