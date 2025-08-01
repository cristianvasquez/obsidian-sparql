import {
  canProcess,
  getFileExtension,
  pathToFileURL,
  triplify,
} from 'vault-triplifier'
import { TriplifierService } from './TriplifierService.js'

/**
 * Triplifier service that uses the embedded vault-triplifier package
 */
export class EmbeddedTriplifierService extends TriplifierService {
  constructor(app, settings) {
    super(app, settings)
  }

  async triplify(absolutePath, content) {
    const extension = getFileExtension(absolutePath)
    
    if (!canProcess(extension)) {
      return null
    }

    // Use triplifier options from settings
    const triplifierOptions = this.settings.embeddedSettings?.triplifierOptions || {}
    
    const pointer = triplify(absolutePath, content, triplifierOptions)
    const graphUri = pathToFileURL(absolutePath)
    
    return {
      dataset: pointer.dataset,
      graphUri
    }
  }

  canProcess(absolutePath) {
    const extension = getFileExtension(absolutePath)
    return canProcess(extension)
  }
}