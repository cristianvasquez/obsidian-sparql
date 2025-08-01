import Client from 'sparql-http-client/ParsingClient'
import rdf from 'rdf-ext'
import { TriplestoreService } from './TriplestoreService.js'

/**
 * Remote triplestore service using SPARQL HTTP client
 */
export class RemoteTriplestoreService extends TriplestoreService {
  constructor(app, settings) {
    super(app, settings)
    this.client = new Client(settings.clientSettings)
  }

  async initialize() {
    // Remote triplestore doesn't need initialization
    return Promise.resolve()
  }

  async select(sparqlQuery) {
    const results = []
    const stream = await this.client.query.select(sparqlQuery)
    
    for await (const row of stream) {
      results.push(row)
    }
    
    return results
  }

  async construct(sparqlQuery) {
    const stream = await this.client.query.construct(sparqlQuery)
    const results = []
    
    for await (const quad of stream) {
      results.push(quad)
    }
    
    return results
  }

  async addTriples(dataset, graphUri) {
    const insertQuery = `
      INSERT DATA {
        GRAPH <${graphUri.value || graphUri}> {
          ${dataset.toString()}
        }
      }
    `
    await this.client.query.update(insertQuery)
    return true
  }

  async clearGraph(graphUri) {
    const deleteQuery = `
      DELETE {
        GRAPH <${graphUri.value || graphUri}> {
         ?s ?p ?o
        }
      }
      WHERE {      
        GRAPH <${graphUri.value || graphUri}> {
           ?s ?p ?o
        }
      } 
    `
    await this.client.query.update(deleteQuery)
    return true
  }

  async clearAll(vaultBaseUri) {
    // Clear only graphs that belong to this vault
    const deleteQuery = `
      DELETE {
        GRAPH ?g {
          ?s ?p ?o
        }
      }
      WHERE {
        GRAPH ?g {
          ?s ?p ?o
        }
        FILTER(STRSTARTS(STR(?g), "${vaultBaseUri}"))
      }
    `
    await this.client.query.update(deleteQuery)
    console.log(`[Remote] Cleared all graphs starting with: ${vaultBaseUri}`)
    return true
  }
}