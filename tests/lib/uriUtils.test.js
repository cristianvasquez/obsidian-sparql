import { describe, it, expect, vi } from 'vitest'
import { 
  isInternalUri, 
  isInternalNoteUri, 
  getPathFromInternalUri, 
  getNameFromInternalUri, 
  getTitleFromInternalUri, 
  isVaultUri,
  isPropertyUri,
  getPropertyFromUri,
  isClickableInternalUri
} from '../../src/lib/uriUtils.js'
import { createNamedNode, createLiteral } from '../helpers/testTerms.js'

// Mock vault-triplifier functions
vi.mock('vault-triplifier', () => ({
  pathFromUri: vi.fn((uri) => {
    // Mock implementation for testing
    if (uri.startsWith('file://')) {
      return uri.replace('file://', '')
    }
    if (uri.startsWith('vault://')) {
      return uri.replace('vault://', '') + '.md'
    }
    return null // Not a file URI
  }),
  nameFromUri: vi.fn((uri) => {
    // Mock implementation for testing
    if (uri.startsWith('urn:name:')) {
      return uri.replace('urn:name:', '')
    }
    return null // Not a name URI
  }),
  fileUri: vi.fn((path) => `file://${path}`),
  nameToUri: vi.fn((name) => `urn:name:${name}`),
  pathToUri: vi.fn((path) => `file://${path}`)
}))

describe('uriUtils.js', () => {
  describe('isInternalUri', () => {
    it('returns true for valid file URIs', () => {
      expect(isInternalUri(createNamedNode('file:///path/to/file.md'))).toBe(true)
      expect(isInternalUri(createNamedNode('vault://my-vault/note'))).toBe(true)
    })

    it('returns false for external URIs', () => {
      expect(isInternalUri(createNamedNode('http://example.com/page'))).toBe(false)
      expect(isInternalUri(createNamedNode('https://github.com/repo'))).toBe(false)
    })

    it('returns false for non-string input', () => {
      expect(isInternalUri(null)).toBe(false)
      expect(isInternalUri(undefined)).toBe(false)
      expect(isInternalUri(123)).toBe(false)
      expect(isInternalUri({})).toBe(false)
    })

    it('handles pathFromUri errors gracefully', () => {
      // Test with a URI that our mock doesn't handle
      expect(isInternalUri(createNamedNode('invalid://uri'))).toBe(false)
    })
  })

  describe('isInternalNoteUri', () => {
    it('returns true for valid note URIs', () => {
      expect(isInternalNoteUri(createNamedNode('urn:name:MyNote'))).toBe(true)
      expect(isInternalNoteUri(createNamedNode('urn:name:Another Note'))).toBe(true)
    })

    it('returns false for non-note URIs', () => {
      expect(isInternalNoteUri(createNamedNode('file:///path/file.md'))).toBe(false)
      expect(isInternalNoteUri(createNamedNode('http://example.com'))).toBe(false)
    })

    it('returns false for non-string input', () => {
      expect(isInternalNoteUri(null)).toBe(false)
      expect(isInternalNoteUri(undefined)).toBe(false)
      expect(isInternalNoteUri(123)).toBe(false)
    })

    it('handles nameFromUri errors gracefully', () => {
      // Test with a URI that our mock doesn't handle  
      expect(isInternalNoteUri(createNamedNode('invalid://uri'))).toBe(false)
    })
  })

  describe('getPathFromInternalUri', () => {
    it('returns path for valid file URIs', () => {
      expect(getPathFromInternalUri('file:///folder/file.md')).toBe('/folder/file.md')
      expect(getPathFromInternalUri('vault://vault/note')).toBe('vault/note.md')
    })

    it('returns null for external URIs', () => {
      expect(getPathFromInternalUri('http://example.com')).toBe(null)
      expect(getPathFromInternalUri('urn:name:NotePath')).toBe(null)
    })

    it('returns null for invalid input', () => {
      expect(getPathFromInternalUri(null)).toBe(null)
      expect(getPathFromInternalUri('')).toBe(null)
    })
  })

  describe('getNameFromInternalUri', () => {
    it('returns name for valid note URIs', () => {
      expect(getNameFromInternalUri('urn:name:MyNote')).toBe('MyNote')
      expect(getNameFromInternalUri('urn:name:Note With Spaces')).toBe('Note With Spaces')
    })

    it('returns null for non-note URIs', () => {
      expect(getNameFromInternalUri('file:///path/file.md')).toBe(null)
      expect(getNameFromInternalUri('http://example.com')).toBe(null)
    })

    it('returns null for invalid input', () => {
      expect(getNameFromInternalUri(null)).toBe(null)
      expect(getNameFromInternalUri('')).toBe(null)
    })
  })

  describe('getTitleFromInternalUri', () => {
    it('returns note name for note URIs', () => {
      expect(getTitleFromInternalUri('urn:name:MyNote')).toBe('MyNote')
      expect(getTitleFromInternalUri('urn:name:Complex Note Name')).toBe('Complex Note Name')
    })

    it('returns filename without extension for file URIs', () => {
      expect(getTitleFromInternalUri('file:///folder/document.md')).toBe('document')
      expect(getTitleFromInternalUri('file:///nested/path/file.txt')).toBe('file.txt')
      expect(getTitleFromInternalUri('vault://simple')).toBe('simple.md')
    })

    it('extracts filename from complex paths', () => {
      expect(getTitleFromInternalUri('file:///very/deep/nested/path/note.md')).toBe('note')
      expect(getTitleFromInternalUri('vault://subfolder/another/note')).toBe('note.md')
    })

    it('returns the URI as fallback for unknown formats', () => {
      expect(getTitleFromInternalUri('unknown://format')).toBe('unknown://format')
      expect(getTitleFromInternalUri('just-a-string')).toBe('just-a-string')
    })

    it('handles edge cases', () => {
      expect(getTitleFromInternalUri('file:///.hidden')).toBe('.hidden')
      expect(getTitleFromInternalUri('file:///file-without-extension')).toBe('file-without-extension')
    })
  })

  describe('isVaultUri', () => {
    it('returns true for any vault resource', () => {
      expect(isVaultUri('file:///path/file.md')).toBe(true)
      expect(isVaultUri('urn:name:MyNote')).toBe(true)
      expect(isVaultUri('vault://note')).toBe(true)
    })

    it('returns false for external resources', () => {
      expect(isVaultUri('http://example.com')).toBe(false)
      expect(isVaultUri('https://github.com/repo')).toBe(false)
      expect(isVaultUri('mailto:user@example.com')).toBe(false)
    })

    it('returns false for invalid input', () => {
      expect(isVaultUri(null)).toBe(false)
      expect(isVaultUri(undefined)).toBe(false)
      expect(isVaultUri('')).toBe(false)
      expect(isVaultUri(123)).toBe(false)
    })
  })

  describe('integration scenarios', () => {
    it('handles mixed URI types correctly', () => {
      const uris = [
        'file:///notes/project.md',
        'urn:name:Daily Note',
        'http://example.com/external',
        'vault://thoughts/random'
      ]

      const internal = uris.filter(isVaultUri)
      expect(internal).toHaveLength(3)
      expect(internal).toContain('file:///notes/project.md')
      expect(internal).toContain('urn:name:Daily Note')
      expect(internal).toContain('vault://thoughts/random')
    })

    it('provides consistent title extraction', () => {
      expect(getTitleFromInternalUri('file:///docs/readme.md')).toBe('readme')
      expect(getTitleFromInternalUri('urn:name:README')).toBe('README')
    })

    it('gracefully handles malformed URIs', () => {
      expect(isVaultUri('not-a-uri')).toBe(false)
      expect(getTitleFromInternalUri('not-a-uri')).toBe('not-a-uri')
    })
  })
})