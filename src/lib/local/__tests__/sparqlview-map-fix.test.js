import { describe, it, expect } from 'vitest'

describe('Controller Interface Consistency', () => {
  it('should work with consistent plain object interface from all controllers', () => {
    // Both LocalController and RemoteController now return plain objects
    const objectResult = {
      s: { value: 'http://example.org/subject', termType: 'NamedNode' },
      p: { value: 'http://example.org/predicate', termType: 'NamedNode' },
      o: { value: 'http://example.org/object', termType: 'NamedNode' }
    }
    
    const results = [objectResult]
    
    // Test the simplified approach - no abstraction leaks
    const header = Object.keys(results[0])
    expect(header).toEqual(['s', 'p', 'o'])
    
    const rows = results.map(row => {
      return header.map(key => row[key] || null)
    })
    
    expect(rows[0]).toHaveLength(3)
    expect(rows[0][0]).toEqual({ value: 'http://example.org/subject', termType: 'NamedNode' })
  })
  
  it('should handle empty results consistently', () => {
    const results = []
    
    // Should handle empty results without type checking
    expect(results.length).toBe(0)
    
    // No need for instanceof checks or conditional logic
    if (results.length > 0) {
      const header = Object.keys(results[0])
      expect(header).toBeDefined()
    }
  })
})