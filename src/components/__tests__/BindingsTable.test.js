import { describe, it, expect } from 'vitest'
import { generateMarkdownTable } from '../BindingsTable.js'

// Mock app object
const mockApp = {
  vault: {
    adapter: {
      path: {
        absolute: '/mock/vault/path'
      }
    }
  }
}

// Mock RDF terms
const mockNamedNode = {
  termType: 'NamedNode',
  value: 'http://example.org/resource'
}

const mockLiteral = {
  termType: 'Literal',
  value: 'Test Value'
}

describe('BindingsTable', () => {
  describe('generateMarkdownTable', () => {
    it('should generate markdown table with normal values', () => {
      const header = ['resource', 'label']
      const rows = [
        [mockNamedNode, mockLiteral],
        [mockNamedNode, mockLiteral]
      ]
      
      const result = generateMarkdownTable(header, rows, mockApp)
      
      expect(result).toContain('| resource | label |')
      expect(result).toContain('| --- | --- |')
      expect(result).toContain('Test Value')
    })

    it('should handle null values from OPTIONAL SPARQL clauses', () => {
      const header = ['resource', 'optionalLabel', 'optionalValue']
      const rows = [
        [mockNamedNode, mockLiteral, null], // Has optional value
        [mockNamedNode, null, mockLiteral], // Missing middle optional
        [mockNamedNode, null, null]         // Missing both optionals
      ]
      
      expect(() => {
        generateMarkdownTable(header, rows, mockApp)
      }).not.toThrow()
    })

    it('should render null values as empty cells', () => {
      const header = ['resource', 'optional']
      const rows = [
        [mockNamedNode, null]
      ]
      
      const result = generateMarkdownTable(header, rows, mockApp)
      
      expect(result).toContain('| resource | optional |')
      expect(result).toContain('| --- | --- |')
      // The row should have an empty cell for null value
      expect(result).toMatch(/\|\s*\[.*\]\(.*\)\s*\|\s*\|/)
    })

    it('should handle mixed null and non-null values', () => {
      const header = ['col1', 'col2', 'col3']
      const rows = [
        [mockLiteral, null, mockNamedNode],
        [null, mockLiteral, null],
        [mockNamedNode, mockLiteral, mockLiteral]
      ]
      
      const result = generateMarkdownTable(header, rows, mockApp)
      
      expect(result).toContain('| col1 | col2 | col3 |')
      expect(result).toContain('| --- | --- | --- |')
      // Should not throw and should contain the non-null values
      expect(result).toContain('Test Value')
    })

    it('should handle completely null rows', () => {
      const header = ['col1', 'col2']
      const rows = [
        [null, null]
      ]
      
      const result = generateMarkdownTable(header, rows, mockApp)
      
      expect(result).toContain('| col1 | col2 |')
      expect(result).toContain('| --- | --- |')
      expect(result).toContain('|  |  |')
    })
  })
})