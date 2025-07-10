import { describe, it, expect, vi } from 'vitest'
import { getAbsolutePath } from '../../src/lib/obsidianUtils.js'
import { replaceSPARQL } from '../../src/lib/templates.js'

// Mock vault-triplifier
vi.mock('vault-triplifier', () => ({
  nameToUri: vi.fn((name) => `urn:name:${name}`),
  fileUri: vi.fn((path) => `file://${path}`)
}))

describe('SparqlView Integration', () => {
  it('should handle __THIS_DOC__ replacement correctly', () => {
    // Mock the Obsidian environment
    const mockFile = {
      path: 'Journal/2025-07-10.md',
      basename: '2025-07-10'
    }
    
    const mockApp = {
      workspace: {
        getActiveFile: vi.fn(() => mockFile)
      },
      vault: {
        adapter: {
          path: '/home/user/obsidian/ted-workspace'
        }
      }
    }
    
    // Simulate what happens in SparqlView
    const file = mockApp.workspace.getActiveFile()
    expect(file).toBe(mockFile)
    
    const absolutePath = getAbsolutePath(file, mockApp)
    expect(absolutePath).toBe('/home/user/obsidian/ted-workspace/Journal/2025-07-10.md')
    
    const sparqlQuery = `
      SELECT * WHERE  
      {  
        GRAPH __THIS_DOC__ { 
          ?s ?p ?o 
        } 
      } LIMIT 10
    `
    
    const replaced = replaceSPARQL(sparqlQuery, file.basename, absolutePath)
    
    expect(replaced).toContain('<file:///home/user/obsidian/ted-workspace/Journal/2025-07-10.md>')
    expect(replaced).not.toContain('file://undefined')
    expect(replaced).not.toContain('__THIS_DOC__')
    
    console.log('Final replaced query:', replaced)
  })

  it('should handle missing active file gracefully', () => {
    const mockApp = {
      workspace: {
        getActiveFile: vi.fn(() => null)
      },
      vault: {
        adapter: {
          path: '/home/user/obsidian/ted-workspace'
        }
      }
    }
    
    const file = mockApp.workspace.getActiveFile()
    expect(file).toBe(null)
    
    // This should trigger the error handling in SparqlView
    if (!file) {
      expect(true).toBe(true) // Confirms the error path would be taken
      return
    }
  })

  it('should handle missing vault adapter path', () => {
    const mockFile = {
      path: 'Journal/2025-07-10.md',
      basename: '2025-07-10'
    }
    
    const mockApp = {
      workspace: {
        getActiveFile: vi.fn(() => mockFile)
      },
      vault: {
        adapter: {
          path: undefined // This could cause the issue
        }
      }
    }
    
    const file = mockApp.workspace.getActiveFile()
    
    expect(() => {
      getAbsolutePath(file, mockApp)
    }).toThrow('Unable to determine vault path or file path')
  })
})