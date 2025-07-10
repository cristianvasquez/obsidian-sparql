import { describe, it, expect, vi } from 'vitest'
import { 
  isFileUri,
  isNameUri,
  isPropertyUri,
  getPathFromFileUri,
  getNameFromNameUri,
  getPropertyFromUri,
  getTitleFromUri,
  isClickableUri,
  isVaultUri
} from '../../src/lib/uriUtils.js'
import { createNamedNode, createLiteral } from '../helpers/testTerms.js'

vi.mock('vault-triplifier', () => ({
  nameFromUri: vi.fn((term) => {
    if (term?.value?.startsWith('urn:name:')) {
      return term.value.replace('urn:name:', '')
    }
    return null
  }),
  nameToUri: vi.fn((name) => `urn:name:${name}`),
  fileUri: vi.fn((path) => `file://${path}`)
}))

vi.mock('../../src/lib/obsidianUtils.js', () => ({
  isFileInVault: vi.fn(() => true),
  isNoteInVault: vi.fn(() => true)
}))

describe('uriUtils.js', () => {
  describe('isFileUri', () => {
    it('detects file URIs', () => {
      expect(isFileUri(createNamedNode('file:///path/file.md'))).toBe(true)
      expect(isFileUri(createNamedNode('http://example.com'))).toBe(false)
      expect(isFileUri(createLiteral('not a uri'))).toBe(false)
    })
  })

  describe('isNameUri', () => {
    it('detects name URIs', () => {
      expect(isNameUri(createNamedNode('urn:name:MyNote'))).toBe(true)
      expect(isNameUri(createNamedNode('file:///path/file.md'))).toBe(false)
      expect(isNameUri(createLiteral('not a uri'))).toBe(false)
    })
  })

  describe('isPropertyUri', () => {
    it('detects property URIs', () => {
      expect(isPropertyUri(createNamedNode('urn:property:title'))).toBe(true)
      expect(isPropertyUri(createNamedNode('urn:name:MyNote'))).toBe(false)
      expect(isPropertyUri(createLiteral('not a uri'))).toBe(false)
    })
  })

  describe('getPathFromFileUri', () => {
    it('extracts path from file URIs', () => {
      expect(getPathFromFileUri(createNamedNode('file:///path/file.md'))).toBe('/path/file.md')
      expect(getPathFromFileUri(createNamedNode('urn:name:MyNote'))).toBe(null)
    })
  })

  describe('getNameFromNameUri', () => {
    it('extracts name from name URIs', () => {
      expect(getNameFromNameUri(createNamedNode('urn:name:MyNote'))).toBe('MyNote')
      expect(getNameFromNameUri(createNamedNode('file:///path/file.md'))).toBe(null)
    })
  })

  describe('getPropertyFromUri', () => {
    it('extracts property from property URIs', () => {
      expect(getPropertyFromUri(createNamedNode('urn:property:title'))).toBe('title')
      expect(getPropertyFromUri(createNamedNode('urn:name:MyNote'))).toBe(null)
    })
  })

  describe('getTitleFromUri', () => {
    it('gets title from name URIs', () => {
      expect(getTitleFromUri(createNamedNode('urn:name:MyNote'))).toBe('MyNote')
    })

    it('gets title from file URIs', () => {
      expect(getTitleFromUri(createNamedNode('file:///path/document.md'))).toBe('document')
      expect(getTitleFromUri(createNamedNode('file:///path/image.png'))).toBe('image.png')
    })

    it('falls back to URI value', () => {
      expect(getTitleFromUri(createNamedNode('http://example.com'))).toBe('http://example.com')
    })
  })

  describe('isClickableUri', () => {
    it('identifies clickable URIs', () => {
      const mockApp = {}
      expect(isClickableUri(createNamedNode('urn:name:MyNote'), mockApp)).toBe(true)
      expect(isClickableUri(createNamedNode('file:///path/file.md'), mockApp)).toBe(true)
      expect(isClickableUri(createNamedNode('http://example.com'), mockApp)).toBe(false)
    })
  })

  describe('isVaultUri', () => {
    it('identifies vault URIs', () => {
      expect(isVaultUri(createNamedNode('urn:name:MyNote'))).toBe(true)
      expect(isVaultUri(createNamedNode('file:///path/file.md'))).toBe(true)
      expect(isVaultUri(createNamedNode('urn:property:title'))).toBe(true)
      expect(isVaultUri(createNamedNode('http://example.com'))).toBe(false)
    })
  })
})