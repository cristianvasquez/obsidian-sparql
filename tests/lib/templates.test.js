import { describe, it, expect, vi } from 'vitest'
import { replaceSPARQL } from '../../src/lib/templates.js'

// Mock vault-triplifier
vi.mock('vault-triplifier', () => ({
  nameToUri: vi.fn((name) => `urn:name:${name}`),
  fileUri: vi.fn((path) => `file://${path}`)
}))

describe('templates.js', () => {
  describe('replaceSPARQL', () => {
    it('replaces __THIS__ with name URI', () => {
      const sparql = 'SELECT * WHERE { __THIS__ ?p ?o }'
      const fileName = 'MyNote'
      const absolutePath = '/home/user/vault/MyNote.md'
      
      const result = replaceSPARQL(sparql, fileName, absolutePath)
      
      expect(result).toBe('SELECT * WHERE { <urn:name:MyNote> ?p ?o }')
    })

    it('replaces __THIS_DOC__ with file URI', () => {
      const sparql = 'SELECT * WHERE { GRAPH __THIS_DOC__ { ?s ?p ?o } }'
      const fileName = 'Journal'
      const absolutePath = '/home/user/vault/Journal/2025-07-10.md'
      
      const result = replaceSPARQL(sparql, fileName, absolutePath)
      
      expect(result).toBe('SELECT * WHERE { GRAPH <file:///home/user/vault/Journal/2025-07-10.md> { ?s ?p ?o } }')
    })

    it('replaces internal links [[NoteName]]', () => {
      const sparql = 'SELECT * WHERE { [[MyNote]] ?p ?o }'
      const fileName = 'Current'
      const absolutePath = '/home/user/vault/Current.md'
      
      const result = replaceSPARQL(sparql, fileName, absolutePath)
      
      expect(result).toBe('SELECT * WHERE { <urn:name:MyNote> ?p ?o }')
    })

    it('handles undefined absolutePath', () => {
      const sparql = 'SELECT * WHERE { GRAPH __THIS_DOC__ { ?s ?p ?o } }'
      const fileName = 'TestFile'
      const absolutePath = undefined
      
      const result = replaceSPARQL(sparql, fileName, absolutePath)
      
      // Should result in file://undefined
      expect(result).toBe('SELECT * WHERE { GRAPH <file://undefined> { ?s ?p ?o } }')
    })

    it('handles all replacements together', () => {
      const sparql = `
        SELECT * WHERE {
          GRAPH __THIS_DOC__ {
            __THIS__ ?p ?o .
            [[LinkedNote]] ?p2 ?o2 .
          }
        }
      `
      const fileName = 'MyNote'
      const absolutePath = '/home/user/vault/MyNote.md'
      
      const result = replaceSPARQL(sparql, fileName, absolutePath)
      
      expect(result).toContain('<file:///home/user/vault/MyNote.md>')
      expect(result).toContain('<urn:name:MyNote>')
      expect(result).toContain('<urn:name:LinkedNote>')
    })
  })
})