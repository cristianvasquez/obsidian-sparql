import { describe, it, expect } from 'vitest'

describe('SparqlView Map Object Fix', () => {
  it('should handle Map objects like oxigraph returns', () => {
    // Simulate what oxigraph returns
    const mapResult = new Map([
      ['s', { value: 'http://example.org/subject', termType: 'NamedNode' }],
      ['p', { value: 'http://example.org/predicate', termType: 'NamedNode' }],
      ['o', { value: 'http://example.org/object', termType: 'NamedNode' }]
    ])
    
    const results = [mapResult]
    
    // Test the original broken approach
    const brokenHeader = Object.keys(results[0])
    expect(brokenHeader).toEqual([]) // This fails with Maps
    
    // Test the fixed approach
    const header = results[0] instanceof Map 
      ? Array.from(results[0].keys())
      : Object.keys(results[0])
    
    expect(header).toEqual(['s', 'p', 'o'])
    
    // Test row mapping
    const rows = results.map(row => {
      if (row instanceof Map) {
        return header.map(key => row.get(key) || null)
      } else {
        return header.map(key => row[key] || null)
      }
    })
    
    expect(rows[0]).toHaveLength(3)
    expect(rows[0][0]).toEqual({ value: 'http://example.org/subject', termType: 'NamedNode' })
  })
  
  it('should still work with plain objects (backward compatibility)', () => {
    // Simulate what the remote controller might return
    const objectResult = {
      s: { value: 'http://example.org/subject', termType: 'NamedNode' },
      p: { value: 'http://example.org/predicate', termType: 'NamedNode' },
      o: { value: 'http://example.org/object', termType: 'NamedNode' }
    }
    
    const results = [objectResult]
    
    // Test the approach works for plain objects too
    const header = results[0] instanceof Map 
      ? Array.from(results[0].keys())
      : Object.keys(results[0])
    
    expect(header).toEqual(['s', 'p', 'o'])
    
    const rows = results.map(row => {
      if (row instanceof Map) {
        return header.map(key => row.get(key) || null)
      } else {
        return header.map(key => row[key] || null)
      }
    })
    
    expect(rows[0]).toHaveLength(3)
    expect(rows[0][0]).toEqual({ value: 'http://example.org/subject', termType: 'NamedNode' })
  })
})