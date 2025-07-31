import { describe, it, expect, beforeEach } from 'vitest'
import { triplify } from 'vault-triplifier'
import { generateMarkdownTable, generateMarkdownTableRaw } from '../../../components/BindingsTableAsMarkdown.js'

// Mock oxigraph for testing with proper Map object simulation
const mockQuads = new Set()
const mockStore = {
  size: 0,
  add: (quad) => {
    mockQuads.add(JSON.stringify({
      s: quad.subject?.value || quad.subject,
      p: quad.predicate?.value || quad.predicate,
      o: quad.object?.value || quad.object,
      g: quad.graph?.value || quad.graph || null
    }))
    mockStore.size = mockQuads.size
  },
  query: (sparql, options = {}) => {
    const quads = Array.from(mockQuads).map(q => JSON.parse(q))
    
    if (sparql.includes('SELECT ?document ?title ?content WHERE')) {
      // Handle the specific panel query
      
      // Find documents that match the pattern
      const documents = quads.filter(q => 
        q.p === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' && 
        q.o === 'http://pending.org/dot/MarkdownDocument'
      )
      
      
      const results = documents.map(docQuad => {
        const docUri = docQuad.s
        
        // Find the concept this document represents
        const representsQuad = quads.find(q => q.s === docUri && q.p === 'http://pending.org/dot/represents')
        
        if (!representsQuad) return null
        
        const conceptUri = representsQuad.o
        
        // Find tag property on the concept
        const tagQuad = quads.find(q => q.s === conceptUri && q.p === 'urn:property:tag')
        
        // Find raw content on the document
        const rawQuad = quads.find(q => q.s === docUri && q.p === 'http://pending.org/dot/raw')
        
        // Find title on the concept
        const titleQuad = quads.find(q => q.s === conceptUri && q.p === 'urn:property:title')
        
        if (tagQuad && tagQuad.o === '"panel/query"' && rawQuad) {
          const result = new Map([
            ['document', { value: docUri, termType: 'NamedNode' }],
            ['content', { value: rawQuad.o, termType: 'Literal' }]
          ])
          
          // Only add title if it exists
          if (titleQuad) {
            result.set('title', { value: titleQuad.o, termType: 'Literal' })
          }
          
          return result
        }
        
        return null
      }).filter(result => result !== null)
      
      return results
      
    } else if (sparql.includes('SELECT * WHERE { GRAPH ?g { ?s ?p ?o }')) {
      // Return triples from any named graph - simulate what oxigraph actually returns
      const results = quads.filter(q => q.g).map(q => new Map([
        ['s', { value: q.s, termType: 'NamedNode' }],
        ['p', { value: q.p, termType: 'NamedNode' }], 
        ['o', { value: q.o, termType: q.o.startsWith('"') ? 'Literal' : 'NamedNode' }],
        ['g', { value: q.g, termType: 'NamedNode' }]
      ]))
      
      
      return results
    } else if (sparql.includes('SELECT * WHERE { ?s ?p ?o }')) {
      // Default graph or union query
      let targetQuads = quads
      
      if (options.use_default_graph_as_union) {
        // Using union default graph - including all quads
      } else {
        targetQuads = quads.filter(q => !q.g)
      }
      
      const results = targetQuads.map(q => new Map([
        ['s', { value: q.s, termType: 'NamedNode' }],
        ['p', { value: q.p, termType: 'NamedNode' }],
        ['o', { value: q.o, termType: q.o.startsWith('"') ? 'Literal' : 'NamedNode' }]
      ]))
      
      return results
    }
    
    return []
  }
}

// Mock app object for table generation
const mockApp = {
  vault: {
    adapter: {
      basePath: '/test/vault'
    }
  }
}

describe('Full Integration Test - Map Objects to Markdown Table', () => {
  let store
  
  beforeEach(() => {
    // Clear mock store
    mockQuads.clear()
    mockStore.size = 0
    store = mockStore
  })

  it('should generate proper markdown table from Map objects returned by oxigraph', () => {
    // 1. Add test data using triplifier (real data)
    const testPath = '/test/panel-query.md'
    const testContent = `# Panel Query

title :: "Test Panel Query"
order :: "1"
tag :: "panel/query"

This is some test content for the panel query.`

    const triplifierOptions = {
      partitionBy: ["headers-h2-h3", "identifier"],
      includeLabelsFor: ["documents", "sections", "anchors"],
      includeSelectors: true,
      includeRaw: true  // This should generate dot:raw property
    }
    
    const triplifierMappings = {
      prefix: {
        rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
        rdfs: "http://www.w3.org/2000/01/rdf-schema#",
        schema: "http://schema.org/",
        foaf: "http://xmlns.com/foaf/0.1/",
        dc: "http://purl.org/dc/elements/1.1/",
        dct: "http://purl.org/dc/terms/",
        osg: "http://pending.org/osg/",
        dot: "http://pending.org/dot/"
      },
      mappings: {
        "is a": "rdf:type",
        "domain": "rdfs:domain",
        "range": "rdfs:range", 
        "see also": "rdfs:seeAlso",
        "same as": "rdf:sameAs",
        "knows": "foaf:knows",
        "title": "dct:title",
        "created": "dct:created",
        "modified": "dct:modified",
        "description": "dct:description"
      }
    }

    const pointer = triplify(testPath, testContent, triplifierOptions, triplifierMappings)
    const dataset = pointer.dataset
    
    
    // 2. Add all quads to store with file graph URI
    const graphUri = `file://${testPath}`
    for (const quad of dataset) {
      const graphedQuad = {
        subject: quad.subject,
        predicate: quad.predicate,
        object: quad.object,
        graph: { value: graphUri }
      }
      store.add(graphedQuad)
    }
    
    
    // 3. Query the data (corrected query based on actual data structure)
    const query = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX dot: <http://pending.org/dot/>
PREFIX dcterms: <http://purl.org/dc/terms/>

SELECT ?document ?title ?content WHERE {    
    GRAPH ?g {  
        ?document a dot:MarkdownDocument .        
        ?document dot:represents ?concept .
        ?concept <urn:property:tag> "panel/query" .        
        ?document dot:raw ?content .        
        OPTIONAL { ?concept <urn:property:title> ?title }    
        OPTIONAL { ?concept <urn:property:order> ?order }
    }
} ORDER BY ?order`

    const results = store.query(query, { use_default_graph_as_union: true })
    
    // 4. Test the SparqlView logic (this is where the bug was)
    if (results.length > 0) {
      
      // This is the EXACT code from SparqlView.js after our fix
      const header = results[0] instanceof Map 
        ? Array.from(results[0].keys())
        : Object.keys(results[0])
      
      
      const rows = results.map(row => {
        if (row instanceof Map) {
          return header.map(key => row.get(key) || null)
        } else {
          return header.map(key => row[key] || null)
        }
      })
      
      
      // 5. Generate actual markdown table
      const markdownTable = generateMarkdownTable(header, rows, mockApp)
      
      // Test assertions
      expect(header.length).toBeGreaterThan(0)
      expect(header).toContain('document')
      expect(rows.length).toBeGreaterThan(0)
      expect(rows[0].length).toEqual(header.length)
      expect(markdownTable).toContain('|')
      expect(markdownTable).not.toMatch(/\|\s*\|\s*\|\s*\|/) // Should not be empty cells
      
      // Also test raw table generation
      const rawTable = generateMarkdownTableRaw(header, rows, mockApp)
      
      expect(rawTable).toContain('|')
      expect(rawTable).not.toMatch(/\|\s*\|\s*\|\s*\|/) // Should not be empty cells
      
    } else {
      
      // Try simpler query
      const simpleQuery = 'SELECT * WHERE { ?s ?p ?o } LIMIT 5'
      const simpleResults = store.query(simpleQuery, { use_default_graph_as_union: true })
      
      // This should fail the test if no results
      expect(results.length).toBeGreaterThan(0)
    }
  })
})