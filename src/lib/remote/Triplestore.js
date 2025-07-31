import rdf from 'rdf-ext'

class Triplestore {
  constructor (client) {
    this.client = client
  }

  async getDataset (graphUri) {
    const constructQuery = `
      CONSTRUCT {
        ?s ?p ?o
      } WHERE {
        GRAPH <${graphUri.value}> {
          ?s ?p ?o
        }
      }
      `
    return rdf.dataset(await this.client.query.construct(constructQuery))
  }

  async insertDataset (graphUri, dataset) {
    const insertQuery = `
      INSERT DATA {
        GRAPH <${graphUri.value}> {
          ${dataset.toString()}
        }
      }
      `
    return await this.client.query.update(insertQuery)
  }

  async deleteDataset (graphUri) {
    const insertQuery = `
    DELETE {
      GRAPH <${graphUri.value}> {
       ?s ?p ?o
      }
    }
    WHERE {      
      GRAPH <${graphUri.value}> {
         ?s ?p ?o
      }
    } 
      `
    return await this.client.query.update(insertQuery)
  }

  async construct (query) {
    return rdf.dataset(await this.client.query.construct(query))
  }

  async select (query) {
    return this.client.query.select(query)
  }
}

export default Triplestore
