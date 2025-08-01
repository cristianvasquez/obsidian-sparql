import { describe, it, expect, beforeEach } from 'vitest'
import { Controller } from '../Controller.js'

// Mock Obsidian API
const mockApp = {
  vault: {
    adapter: {
      getFullPath: (path) => `/test/vault/${path}`,
      basePath: '/test/vault',
      getBasePath: () => '/test/vault'
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
const mockEmbeddedSettings = {
  mode: 'embedded',
  triplifierMode: 'embedded',
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

const mockExternalSettings = {
  mode: 'external',
  triplifierMode: 'external',
  clientSettings: {
    endpointUrl: 'http://localhost:7878/query',
    updateUrl: 'http://localhost:7878/update',
    user: '',
    password: '',
  },
  osgPath: '/fake/osg/path'
}

describe('Controller Integration Tests', () => {
  let embeddedController
  let externalController

  beforeEach(async () => {
    embeddedController = new Controller(mockApp, mockEmbeddedSettings)
    externalController = new Controller(mockApp, mockExternalSettings)
  })

  describe('initialization', () => {
    it('should initialize embedded triplestore and triplifier services', () => {
      expect(embeddedController.triplestoreService).toBeDefined()
      expect(embeddedController.triplifierService).toBeDefined()
      expect(embeddedController.triplestoreService.constructor.name).toBe('EmbeddedTriplestoreService')
      expect(embeddedController.triplifierService.constructor.name).toBe('EmbeddedTriplifierService')
    })

    it('should initialize external triplestore and triplifier services', () => {
      expect(externalController.triplestoreService).toBeDefined()
      expect(externalController.triplifierService).toBeDefined()
      expect(externalController.triplestoreService.constructor.name).toBe('RemoteTriplestoreService')
      expect(externalController.triplifierService.constructor.name).toBe('ExternalTriplifierService')
    })

    it('should reinitialize services when settings change', () => {
      // Change to different combination with proper clientSettings
      embeddedController.settings.mode = 'external'
      embeddedController.settings.triplifierMode = 'embedded'
      embeddedController.settings.clientSettings = {
        endpointUrl: 'http://localhost:7878/query',
        updateUrl: 'http://localhost:7878/update',
        user: '',
        password: ''
      }
      
      embeddedController.initializeTriplestoreService()
      embeddedController.initializeTriplifierService()
      
      expect(embeddedController.triplestoreService.constructor.name).toBe('RemoteTriplestoreService')
      expect(embeddedController.triplifierService.constructor.name).toBe('EmbeddedTriplifierService')
    })
  })

  describe('service combinations', () => {
    it('should handle embedded + embedded combination', () => {
      const settings = {
        mode: 'embedded',
        triplifierMode: 'embedded',
        embeddedSettings: mockEmbeddedSettings.embeddedSettings
      }
      const controller = new Controller(mockApp, settings)
      
      expect(controller.triplestoreService.constructor.name).toBe('EmbeddedTriplestoreService')
      expect(controller.triplifierService.constructor.name).toBe('EmbeddedTriplifierService')
    })

    it('should handle external + external combination', () => {
      const settings = {
        mode: 'external',
        triplifierMode: 'external',
        clientSettings: mockExternalSettings.clientSettings,
        osgPath: '/fake/path'
      }
      const controller = new Controller(mockApp, settings)
      
      expect(controller.triplestoreService.constructor.name).toBe('RemoteTriplestoreService')
      expect(controller.triplifierService.constructor.name).toBe('ExternalTriplifierService')
    })

    it('should handle external + embedded combination', () => {
      const settings = {
        mode: 'external',
        triplifierMode: 'embedded',
        clientSettings: mockExternalSettings.clientSettings,
        embeddedSettings: mockEmbeddedSettings.embeddedSettings
      }
      const controller = new Controller(mockApp, settings)
      
      expect(controller.triplestoreService.constructor.name).toBe('RemoteTriplestoreService')
      expect(controller.triplifierService.constructor.name).toBe('EmbeddedTriplifierService')
    })

    it('should throw error when external mode lacks clientSettings', () => {
      const settings = {
        mode: 'external',
        triplifierMode: 'external',
        // Missing clientSettings
        osgPath: '/fake/path'
      }
      
      expect(() => new Controller(mockApp, settings)).toThrow('[Controller] External triplestore mode requires clientSettings to be configured')
    })
  })

  describe('SPARQL queries', () => {
    it('should delegate select queries to triplestore service', async () => {
      // Mock the triplestore service
      const mockResults = [{ s: 'test', p: 'test', o: 'test' }]
      embeddedController.triplestoreService.select = async () => mockResults
      
      const results = await embeddedController.select('SELECT * WHERE { ?s ?p ?o }')
      expect(results).toEqual(mockResults)
    })

    it('should delegate construct queries to triplestore service', async () => {
      // Mock the triplestore service
      const mockResults = [{ subject: 'test', predicate: 'test', object: 'test' }]
      embeddedController.triplestoreService.construct = async () => mockResults
      
      const results = await embeddedController.construct('CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }')
      expect(results).toEqual(mockResults)
    })
  })

  describe('file processing', () => {
    it('should process files based on triplifier service capabilities', async () => {
      const testFile = { path: 'test.md', basename: 'test' }
      const testContent = '# Test\n\ntitle :: "Test"'
      
      // Mock triplifier service
      embeddedController.triplifierService.canProcess = () => true
      embeddedController.triplifierService.triplify = async () => ({
        dataset: { size: 5 },
        graphUri: 'file:///test/vault/test.md'
      })
      embeddedController.triplestoreService.clearGraph = async () => true
      embeddedController.triplestoreService.addTriples = async () => true
      
      const result = await embeddedController.syncFile(testFile, testContent, false)
      expect(result).toBe(true)
    })

    it('should skip files that cannot be processed', async () => {
      const testFile = { path: 'test.txt', basename: 'test' }
      const testContent = 'Plain text content'
      
      // Mock triplifier service to reject this file type
      embeddedController.triplifierService.canProcess = () => false
      
      const result = await embeddedController.syncFile(testFile, testContent, false)
      expect(result).toBe(true) // Should return true but not process
    })
  })
})