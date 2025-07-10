import { describe, it, expect } from 'vitest'
import { getAbsolutePath } from '../../src/lib/obsidianUtils.js'

describe('obsidianUtils.js', () => {
  describe('getAbsolutePath', () => {
    it('constructs absolute path correctly', () => {
      const mockFile = { path: 'Journal/2025-07-10.md' }
      const mockApp = {
        vault: {
          adapter: {
            path: '/home/user/vault'
          }
        }
      }
      
      const result = getAbsolutePath(mockFile, mockApp)
      expect(result).toBe('/home/user/vault/Journal/2025-07-10.md')
    })

    it('throws error when file is null', () => {
      const mockApp = {
        vault: {
          adapter: {
            path: '/home/user/vault'
          }
        }
      }
      
      expect(() => getAbsolutePath(null, mockApp)).toThrow('Invalid file or app provided to getAbsolutePath')
    })

    it('throws error when app is null', () => {
      const mockFile = { path: 'test.md' }
      
      expect(() => getAbsolutePath(mockFile, null)).toThrow('Invalid file or app provided to getAbsolutePath')
    })

    it('throws error when vault path is missing', () => {
      const mockFile = { path: 'test.md' }
      const mockApp = {
        vault: {
          adapter: {
            path: ''
          }
        }
      }
      
      expect(() => getAbsolutePath(mockFile, mockApp)).toThrow('Unable to determine vault path or file path')
    })

    it('throws error when file path is missing', () => {
      const mockFile = { path: '' }
      const mockApp = {
        vault: {
          adapter: {
            path: '/home/user/vault'
          }
        }
      }
      
      expect(() => getAbsolutePath(mockFile, mockApp)).toThrow('Unable to determine vault path or file path')
    })
  })
})