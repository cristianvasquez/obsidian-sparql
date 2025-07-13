import { describe, it, expect } from 'vitest'
import { 
  replacePropertyPlaceholders, 
  replaceInternalLinks, 
  replacePropertyReferences,
  replaceSPARQL 
} from '../templates.js'

describe('Template System', () => {
  
  describe('replacePropertyPlaceholders', () => {
    it('should replace simple property placeholders', () => {
      const input = 'SELECT * WHERE { ?s __label__ ?o }'
      const result = replacePropertyPlaceholders(input)
      expect(result).toContain('<urn:property:label>')
      expect(result).not.toContain('__label__')
    })

    it('should replace property placeholders with spaces', () => {
      const input = 'SELECT * WHERE { ?s __generated at time__ ?o }'
      const result = replacePropertyPlaceholders(input)
      expect(result).toContain('<urn:property:generated%20at%20time>')
      expect(result).not.toContain('__generated at time__')
    })

    it('should handle multiple property placeholders', () => {
      const input = '?s __type__ ?type . ?s __label__ ?name'
      const result = replacePropertyPlaceholders(input)
      expect(result).toContain('<urn:property:type>')
      expect(result).toContain('<urn:property:label>')
    })

    it('should not affect text without placeholders', () => {
      const input = 'SELECT * WHERE { ?s ?p ?o }'
      const result = replacePropertyPlaceholders(input)
      expect(result).toBe(input)
    })
  })

  describe('replaceInternalLinks', () => {
    it('should replace wiki links with name URIs', () => {
      const input = 'SELECT * WHERE { [[MyNote]] ?p ?o }'
      const result = replaceInternalLinks(input, (link) => `<urn:name:${link}>`)
      expect(result).toContain('<urn:name:MyNote>')
      expect(result).not.toContain('[[MyNote]]')
    })

    it('should handle multiple wiki links', () => {
      const input = '[[Note1]] [[Note2]]'
      const result = replaceInternalLinks(input, (link) => `<urn:name:${link}>`)
      expect(result).toContain('<urn:name:Note1>')
      expect(result).toContain('<urn:name:Note2>')
    })
  })

  describe('replacePropertyReferences', () => {
    it('should replace property:value patterns', () => {
      const input = 'SELECT * WHERE { {{type:Document}} ?p ?o }'
      const result = replacePropertyReferences(input)
      expect(result).toContain('<urn:property:type>')
      expect(result).toContain('<urn:name:Document>')
      expect(result).not.toContain('{{type:Document}}')
    })
  })

  describe('replaceSPARQL integration', () => {
    it('should replace __THIS__ token', () => {
      const sparql = 'SELECT * WHERE { __THIS__ ?p ?o }'
      const result = replaceSPARQL(sparql, '/path/to/MyFile.md')
      expect(result).toContain('<urn:name:MyFile>')
      expect(result).not.toContain('__THIS__')
    })

    it('should replace __DOC__ token', () => {
      const sparql = 'CONSTRUCT { ?s ?p ?o } WHERE { GRAPH __DOC__ { ?s ?p ?o } }'
      const result = replaceSPARQL(sparql, '/path/to/MyFile.md')
      expect(result).toContain('<file:///path/to/MyFile.md>')
      expect(result).not.toContain('__DOC__')
    })

    it('should handle combined replacements', () => {
      const sparql = `
        SELECT * WHERE {
          GRAPH __DOC__ {
            __THIS__ __label__ [[LinkedNote]]
          }
        }`
      const result = replaceSPARQL(sparql, '/path/to/TestFile.md')
      
      expect(result).toContain('<file:///path/to/TestFile.md>')
      expect(result).toContain('<urn:name:TestFile>')
      expect(result).toContain('<urn:property:label>')
      expect(result).toContain('<urn:name:LinkedNote>')
    })

    it('should work without file path', () => {
      const sparql = 'SELECT * WHERE { [[MyNote]] __label__ ?o }'
      const result = replaceSPARQL(sparql, null)
      
      expect(result).toContain('<urn:name:MyNote>')
      expect(result).toContain('<urn:property:label>')
      expect(result).not.toContain('__THIS__')
      expect(result).not.toContain('__DOC__')
    })
  })
})