import { describe, it, expect } from 'vitest'
import { MarkdownTriplifierOptions } from 'vault-triplifier'

describe('Triplifier Options Validation', () => {
  it('should validate correct triplifier options', () => {
    const validOptions = {
      includeRaw: true,
      includeSelectors: true,
      partitionBy: ['headers-h1-h2', 'headers-h2-h3'],
      includeLabelsFor: ['documents', 'sections'],
      prefix: {
        rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        rdfs: 'http://www.w3.org/2000/01/rdf-schema#'
      },
      mappings: {
        'is a': 'rdf:type',
        'same as': 'rdfs:sameAs'
      }
    }

    expect(() => MarkdownTriplifierOptions.parse(validOptions)).not.toThrow()
  })

  it('should reject invalid partitionBy values', () => {
    const invalidOptions = {
      partitionBy: ['invalid-partition-type']
    }

    expect(() => MarkdownTriplifierOptions.parse(invalidOptions)).toThrow()
  })

  it('should reject invalid includeLabelsFor values', () => {
    const invalidOptions = {
      includeLabelsFor: ['invalid-label-type']
    }

    expect(() => MarkdownTriplifierOptions.parse(invalidOptions)).toThrow()
  })

  it('should apply defaults for missing values', () => {
    const minimalOptions = {}
    
    const result = MarkdownTriplifierOptions.parse(minimalOptions)
    
    expect(result.includeLabelsFor).toEqual([])
    expect(result.partitionBy).toEqual(['headers-h2-h3'])
    expect(result.includeRaw).toBe(false)
    expect(result.includeSelectors).toBe(true)
  })

  it('should handle string-to-boolean coercion', () => {
    const stringBoolOptions = {
      includeRaw: 'true',
      includeSelectors: 'false'
    }

    const result = MarkdownTriplifierOptions.parse(stringBoolOptions)
    
    expect(result.includeRaw).toBe(true)
    expect(result.includeSelectors).toBe(false)
  })

  it('should reject unknown properties in strict mode', () => {
    const optionsWithUnknown = {
      unknownProperty: 'value'
    }

    expect(() => MarkdownTriplifierOptions.parse(optionsWithUnknown)).toThrow()
  })
})