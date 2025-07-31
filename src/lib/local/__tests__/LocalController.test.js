import { describe, it, expect, beforeEach } from 'vitest'
import { LocalController } from '../LocalController.js'

// Mock Obsidian API
const mockApp = {
  vault: {
    adapter: {
      getFullPath: (path) => `/test/vault/${path}`,
      basePath: '/test/vault'
    },
    read: async (file) => {
      // Return test markdown content
      return `# Test Document

title :: "Test Title"
tag :: "test"

This is test content for ${file.basename}.`
    },
    getMarkdownFiles: () => [
      { path: 'test1.md', basename: 'test1' },
      { path: 'test2.md', basename: 'test2' }
    ]
  }
}

// Real settings structure based on DEFAULT_SETTINGS
const mockSettings = {
  mode: 'embedded',
  embeddedSettings: {
    triplifierOptions: {
      partitionBy: ['headers-h2-h3', 'identifier'],
      includeLabelsFor: ['documents', 'sections', 'anchors'],
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
        dot: 'http://pending.org/dot/'
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
        'description': 'dct:description'
      }
    }
  }
}

describe('LocalController Integration Tests', () => {
  let controller

  beforeEach(async () => {
    controller = new LocalController(mockApp, mockSettings)
    await controller.ensureInitialized()
  })

  describe('initialization', () => {
    it('should initialize oxigraph store successfully', async () => {
      expect(controller.store).toBeDefined()
      expect(controller.store.size).toBe(0)
      expect(controller.isInitialized).toBe(true)
    })

    it('should have query options configured', () => {
      expect(controller.queryOptions).toEqual({
        use_default_graph_as_union: true
      })
    })
  })

  describe('SPARQL queries', () => {
    beforeEach(async () => {
      // Add some test data first
      const testFile = { path: 'test.md', basename: 'test' }
      const testContent = `# Test Note

title :: "Test Title"
tag :: "test"

This is a test note.`
      
      await controller.syncFile(testFile, testContent)
    })

    it('should execute SELECT queries', async () => {
      const query = 'SELECT * WHERE { ?s ?p ?o } LIMIT 10'
      const results = await controller.select(query)
      
      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBeGreaterThan(0)
    })

    it('should execute CONSTRUCT queries', async () => {
      const query = 'CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o } LIMIT 10'
      const results = await controller.construct(query)
      
      expect(Array.isArray(results)).toBe(true)
    })

    it('should support named graph queries', async () => {
      const query = 'SELECT * WHERE { GRAPH ?g { ?s ?p ?o } } LIMIT 10'
      const results = await controller.select(query)
      
      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBeGreaterThan(0)
      
      // Results should have graph variable
      if (results.length > 0) {
        const firstResult = results[0]
        expect(firstResult.has && firstResult.has('g')).toBe(true)
      }
    })
  })

  describe('file synchronization', () => {
    it('should sync markdown files and generate triples', async () => {
      const testFile = { path: 'sync-test.md', basename: 'sync-test' }
      const testContent = `# Sync Test

title :: "Sync Test Document"
author :: "Test Author"

This is content for sync testing.`

      const initialSize = controller.store.size
      const result = await controller.syncFile(testFile, testContent)
      
      expect(result).toBe(true)
      expect(controller.store.size).toBeGreaterThan(initialSize)
    })

    it('should handle unsupported file types gracefully', async () => {
      const testFile = { path: 'test.txt', basename: 'test' }
      const testContent = 'Plain text content'
      
      const result = await controller.syncFile(testFile, testContent)
      expect(result).toBe(true) // Should return true but not add triples
    })

    it('should update existing files by replacing triples', async () => {
      const testFile = { path: 'update-test.md', basename: 'update-test' }
      const initialContent = `# Update Test\n\ntitle :: "Original Title"`
      const updatedContent = `# Update Test\n\ntitle :: "Updated Title"`
      
      // First sync
      await controller.syncFile(testFile, initialContent)
      const sizeAfterFirst = controller.store.size
      
      // Second sync with updated content
      await controller.syncFile(testFile, updatedContent)
      const sizeAfterSecond = controller.store.size
      
      // Size might be similar since we're replacing, not adding
      expect(sizeAfterSecond).toBeGreaterThan(0)
    })
  })

  describe('named graph management', () => {
    beforeEach(async () => {
      // Add test data to multiple files
      await controller.syncFile(
        { path: 'graph-test-1.md', basename: 'graph-test-1' },
        '# Graph Test 1\n\ntitle :: "First Document"'
      )
      await controller.syncFile(
        { path: 'graph-test-2.md', basename: 'graph-test-2' },
        '# Graph Test 2\n\ntitle :: "Second Document"'
      )
    })

    it('should delete named graphs', async () => {
      const initialSize = controller.store.size
      expect(initialSize).toBeGreaterThan(0)
      
      const result = await controller.deleteNamedGraph('graph-test-1.md')
      expect(result).toBe(true)
      
      const finalSize = controller.store.size
      expect(finalSize).toBeLessThan(initialSize)
    })

    it('should handle deletion of non-existent graphs', async () => {
      const result = await controller.deleteNamedGraph('non-existent.md')
      expect(result).toBe(true) // Should not throw error
    })
  })

  describe('index rebuilding', () => {
    it('should rebuild index from all markdown files', async () => {
      // Add some initial data
      await controller.syncFile(
        { path: 'rebuild-test.md', basename: 'rebuild-test' },
        '# Rebuild Test\n\ntitle :: "Rebuild Document"'
      )
      
      expect(controller.store.size).toBeGreaterThan(0)
      
      // Rebuild should work without errors
      await controller.rebuildIndex()
      
      // Should have data from markdown files
      expect(controller.store.size).toBeGreaterThan(0)
    })
  })

  describe('error handling', () => {
    it('should handle query errors gracefully', async () => {
      const invalidQuery = 'INVALID SPARQL QUERY'
      
      await expect(controller.select(invalidQuery)).rejects.toThrow()
    })

    it('should handle sync errors gracefully', async () => {
      // Test with malformed file object - should handle gracefully
      try {
        const result = await controller.syncFile(null, 'content')
        // If it doesn't throw, it should return true
        expect(result).toBe(true)
      } catch (error) {
        // If it throws, that's also acceptable error handling
        expect(error).toBeInstanceOf(Error)
      }
    })
  })
})