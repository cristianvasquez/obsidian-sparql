import { describe, it, expect, beforeEach } from 'vitest'
import { triplify } from 'vault-triplifier'

// Mock oxigraph for testing
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
    console.log('🔍 Query:', sparql)
    console.log('📊 Store has', quads.length, 'quads')
    console.log('🔧 Options:', options)
    
    if (sparql.includes('SELECT DISTINCT ?g WHERE { GRAPH ?g')) {
      // Return distinct graphs
      const graphs = [...new Set(quads.filter(q => q.g).map(q => q.g))]
      const results = graphs.map(g => new Map([['g', { value: g, termType: 'NamedNode' }]]))
      console.log('📋 Named graphs found:', results.length)
      return results
    } else if (sparql.includes('SELECT * WHERE { GRAPH ?g { ?s ?p ?o }')) {
      // Return triples from any named graph
      const results = quads.filter(q => q.g).map(q => new Map([
        ['s', { value: q.s, termType: 'NamedNode' }],
        ['p', { value: q.p, termType: 'NamedNode' }], 
        ['o', { value: q.o, termType: q.o.startsWith('"') ? 'Literal' : 'NamedNode' }],
        ['g', { value: q.g, termType: 'NamedNode' }]
      ]))
      console.log('📋 Named graph triples:', results.length)
      return results
    } else if (sparql.includes('SELECT * WHERE { ?s ?p ?o }')) {
      // Default graph or union query
      let targetQuads = quads
      
      if (options.use_default_graph_as_union) {
        // Union: include all quads regardless of graph
        console.log('🔗 Using union default graph - including all quads')
      } else {
        // Default graph only: only quads without explicit graph
        targetQuads = quads.filter(q => !q.g)
        console.log('📄 Using default graph only - filtered to', targetQuads.length, 'quads')
      }
      
      const results = targetQuads.map(q => new Map([
        ['s', { value: q.s, termType: 'NamedNode' }],
        ['p', { value: q.p, termType: 'NamedNode' }],
        ['o', { value: q.o, termType: q.o.startsWith('"') ? 'Literal' : 'NamedNode' }]
      ]))
      
      console.log('📋 Results:', results.length)
      return results
    }
    
    return []
  }
}

describe('Oxigraph Integration Test', () => {
  let store
  
  beforeEach(() => {
    // Clear mock store
    mockQuads.clear()
    mockStore.size = 0
    store = mockStore
  })

  it('should triplify markdown content and store with named graphs', () => {
    const testPath = '/test/example.md'
    const testContent = `# Test Document

This is a test document with some content.

property :: value
author :: John Doe

And some [[linked content]].`

    console.log('🔄 Triplifying content...')
    const pointer = triplify(testPath, testContent)
    const dataset = pointer.dataset
    
    console.log('📋 Generated', dataset.size, 'triples')
    
    // Add all quads to store with file graph URI
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
    
    console.log('📊 Store now contains', store.size, 'triples')
    expect(store.size).toBeGreaterThan(0)
  })

  it('should query named graphs successfully', () => {
    // First add some data
    const testPath = '/test/document.md'
    const testContent = '# My Document\n\ntitle :: "My Test Document"'
    
    const pointer = triplify(testPath, testContent)
    const graphUri = `file://${testPath}`
    
    for (const quad of pointer.dataset) {
      store.add({
        subject: quad.subject,
        predicate: quad.predicate, 
        object: quad.object,
        graph: { value: graphUri }
      })
    }
    
    // Test named graph query
    const query = 'SELECT * WHERE { GRAPH ?g { ?s ?p ?o } } LIMIT 10'
    const results = store.query(query)
    
    console.log('📋 Named graph query returned', results.length, 'results')
    
    if (results.length > 0) {
      const firstResult = results[0]
      console.log('✅ First result is Map:', firstResult instanceof Map)
      console.log('📋 Variables:', Array.from(firstResult.keys()))
      
      for (const [variable, term] of firstResult) {
        console.log(`  ${variable}: ${term.value} (${term.termType})`)
      }
    }
    
    expect(results.length).toBeGreaterThan(0)
  })

  it('should test union default graph behavior', () => {
    // Add test data
    const pointer = triplify('/test/doc.md', '# Test\n\nlabel :: "Test Label"')
    const graphUri = 'file:///test/doc.md'
    
    for (const quad of pointer.dataset) {
      store.add({
        subject: quad.subject,
        predicate: quad.predicate,
        object: quad.object, 
        graph: { value: graphUri }
      })
    }
    
    const query = 'SELECT * WHERE { ?s ?p ?o } LIMIT 10'
    
    // Test without union option
    const resultsWithoutUnion = store.query(query)
    console.log('📊 Without union option:', resultsWithoutUnion.length, 'results')
    
    // Test with union option
    const resultsWithUnion = store.query(query, { use_default_graph_as_union: true })
    console.log('📊 With union option:', resultsWithUnion.length, 'results')
    
    // Union should give us results since all our data is in named graphs
    expect(resultsWithUnion.length).toBeGreaterThan(resultsWithoutUnion.length)
    
    if (resultsWithUnion.length > 0) {
      console.log('✅ Union query successful! Sample result:')
      const firstResult = resultsWithUnion[0]
      for (const [variable, term] of firstResult) {
        console.log(`  ${variable}: ${term.value}`)
      }
    }
  })

  it('should simulate SparqlView result processing', () => {
    // Add test data  
    const pointer = triplify('/test/ui-test.md', '# UI Test\n\ntitle :: "UI Test Document"\nauthor :: "Test Author"')
    const graphUri = 'file:///test/ui-test.md'
    
    for (const quad of pointer.dataset) {
      store.add({
        subject: quad.subject,
        predicate: quad.predicate,
        object: quad.object,
        graph: { value: graphUri }
      })
    }
    
    // Query like the UI does
    const query = 'SELECT * WHERE { ?s ?p ?o } LIMIT 5'
    const results = store.query(query, { use_default_graph_as_union: true })
    
    console.log('🖥️ Simulating SparqlView processing...')
    console.log('📊 Query results:', results.length)
    
    if (results.length > 0) {
      // Simulate what SparqlView does in renderSelectResults
      console.log('🔍 First result:', results[0])
      
      // This is line 81 in SparqlView that was failing
      const header = Object.keys(results[0])
      console.log('❌ Object.keys(results[0]):', header) // This should fail for Map
      
      // Test the correct way to get keys from Map
      if (results[0] instanceof Map) {
        const mapKeys = Array.from(results[0].keys())
        console.log('✅ Array.from(results[0].keys()):', mapKeys)
        
        // Test row mapping like line 82 in SparqlView  
        const rows = results.map(row => {
          if (row instanceof Map) {
            const rowObj = {}
            for (const [key, value] of row) {
              rowObj[key] = value || null
            }
            return mapKeys.map(key => rowObj[key] || null)
          }
          return mapKeys.map(key => row[key] || null)
        })
        
        console.log('✅ Converted rows:', rows.length)
        console.log('✅ First row:', rows[0])
      }
    }
    
    expect(results.length).toBeGreaterThan(0)
  })
})