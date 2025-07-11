// src/lib/__tests__/uriUtils.test.js
import { describe, it, expect, vi } from 'vitest'
import rdf from 'rdf-ext'

// Mock obsidian module
vi.mock('obsidian', () => ({
  normalizePath: (path) => {
    // Simple normalization for tests
    return path
      .replace(/\\/g, '/')
      .replace(/\/+/g, '/')
      .replace(/\/$/, '')
  }
}))

import {
  getNameFromPath,
  isFileUri,
  isNameUri,
  isPropertyUri,
  getTermDisplay,
  getInternalLinkInfo
} from '../uriUtils'

describe('uriUtils', () => {
  describe('getNameFromPath', () => {
    it('extracts name from path with .md extension', () => {
      expect(getNameFromPath('/path/to/MyNote.md')).toBe('MyNote')
      expect(getNameFromPath('simple.md')).toBe('simple')
    })

    it('returns filename without extension for non-md files', () => {
      expect(getNameFromPath('/path/to/file.txt')).toBe('file.txt')
    })

    it('handles edge cases', () => {
      expect(getNameFromPath('')).toBe('')
      expect(getNameFromPath(null)).toBe('')
      expect(getNameFromPath(undefined)).toBe('')
    })
  })

  describe('URI type checks', () => {
    it('identifies file URIs', () => {
      const fileUri = rdf.namedNode('file:///home/user/vault/note.md')
      const nonFileUri = rdf.namedNode('urn:name:MyNote')

      expect(isFileUri(fileUri)).toBe(true)
      expect(isFileUri(nonFileUri)).toBe(false)
    })

    it('identifies name URIs using vault-triplifier', () => {
      const nameUri = rdf.namedNode('urn:name:MyNote')
      const nonNameUri = rdf.namedNode('http://example.com/resource')

      expect(isNameUri(nameUri)).toBe(true)
      expect(isNameUri(nonNameUri)).toBe(false)
    })

    it('identifies property URIs using vault-triplifier', () => {
      const propUri = rdf.namedNode('urn:property:status')
      const nonPropUri = rdf.namedNode('urn:name:MyNote')

      expect(isPropertyUri(propUri)).toBe(true)
      expect(isPropertyUri(nonPropUri)).toBe(false)
    })
  })

  describe('getTermDisplay', () => {
    it('extracts display text from literals', () => {
      const literal = rdf.literal('Hello World')
      expect(getTermDisplay(literal)).toBe('Hello World')
    })

    it('extracts name from name URIs', () => {
      const nameUri = rdf.namedNode('urn:name:MyNote')
      expect(getTermDisplay(nameUri)).toBe('MyNote')
    })

    it('extracts property from property URIs', () => {
      const propUri = rdf.namedNode('urn:property:status')
      expect(getTermDisplay(propUri)).toBe('status')
    })

    it('returns full URI for unknown named nodes', () => {
      const uri = rdf.namedNode('http://example.com/unknown')
      expect(getTermDisplay(uri)).toBe('http://example.com/unknown')
    })

    it('handles blank nodes', () => {
      const blank = rdf.blankNode('b1')
      expect(getTermDisplay(blank)).toBe('_:b1')
    })

    it('handles null/undefined', () => {
      expect(getTermDisplay(null)).toBe('')
      expect(getTermDisplay(undefined)).toBe('')
    })
  })

  describe('getInternalLinkInfo', () => {
    // Mock app object
    const mockApp = {
      vault: {
        adapter: {
          basePath: '/home/user/vault'
        }
      },
      workspace: {
        getActiveFile: () => ({ path: 'current.md' })
      },
      metadataCache: {
        getFirstLinkpathDest: (name) => {
          // Simulate finding a file for known names
          if (name === 'ExistingNote') {
            return { path: 'notes/ExistingNote.md' }
          }
          return null
        }
      }
    }

    it('handles name URIs - resolved', () => {
      const nameUri = rdf.namedNode('urn:name:ExistingNote')
      const info = getInternalLinkInfo(nameUri, mockApp)

      expect(info).toBeDefined()
      expect(info.type).toBe('name')
      expect(info.name).toBe('ExistingNote')
      expect(info.resolved).toBe(true)
    })

    it('handles name URIs - unresolved', () => {
      const nameUri = rdf.namedNode('urn:name:NonExistentNote')
      const info = getInternalLinkInfo(nameUri, mockApp)

      expect(info).toBeDefined()
      expect(info.type).toBe('name')
      expect(info.name).toBe('NonExistentNote')
      expect(info.resolved).toBe(false)
    })

    it('handles file URIs in vault', () => {
      const fileUri = rdf.namedNode('file:///home/user/vault/notes/MyNote.md')
      const info = getInternalLinkInfo(fileUri, mockApp)

      expect(info).toBeDefined()
      expect(info.type).toBe('file')
      expect(info.path).toBe('notes/MyNote.md')
      expect(info.resolved).toBe(true)
    })

    it('returns undefined for file URIs outside vault', () => {
      const fileUri = rdf.namedNode('file:///other/path/note.md')
      const info = getInternalLinkInfo(fileUri, mockApp)

      expect(info).toBeUndefined()
    })

    it('returns undefined for non-link URIs', () => {
      const uri = rdf.namedNode('http://example.com/resource')
      const info = getInternalLinkInfo(uri, mockApp)

      expect(info).toBeUndefined()
    })
  })
})
