import { describe, it, expect } from 'vitest'
import { shrink } from '../src/components/helpers/utils.js'

describe('utils.js', () => {
  describe('shrink function', () => {
    it('shrinks URIs with known prefixes', () => {
      // Test common RDF namespaces - now working correctly
      expect(shrink('http://www.w3.org/1999/02/22-rdf-syntax-ns#type')).toBe('rdf:type')
      expect(shrink('http://www.w3.org/2000/01/rdf-schema#label')).toBe('rdfs:label')
      expect(shrink('http://www.w3.org/2001/XMLSchema#string')).toBe('xsd:string')
      expect(shrink('http://www.w3.org/2002/07/owl#Class')).toBe('owl:Class')
      expect(shrink('http://schema.org/Person')).toBe('schema:Person')
    })

    it('shrinks name namespace URIs', () => {
      expect(shrink('urn:name:MyNote')).toBe('name:MyNote')
      expect(shrink('http://unknown.org/note')).toBe('http://unknown.org/note')
    })

    it('shrinks file:// URIs', () => {
      expect(shrink('file:///path/to/file.md')).toBe('/path/to/file.md')
      expect(shrink('file://localhost/document.txt')).toBe('localhost/document.txt')
    })

    it('returns original URI if no matching prefix', () => {
      const unknownUri = 'http://unknown.example.com/resource'
      expect(shrink(unknownUri)).toBe(unknownUri)
    })

    it('handles empty string', () => {
      expect(shrink('')).toBe('')
    })

    it('handles URIs that partially match prefixes', () => {
      // Should not match if URI doesn't start with the namespace
      expect(shrink('some-http://www.w3.org/1999/02/22-rdf-syntax-ns#type')).toBe('some-http://www.w3.org/1999/02/22-rdf-syntax-ns#type')
    })

    it('handles URIs with fragments and query parameters', () => {
      expect(shrink('http://schema.org/Person#name')).toBe('schema:Person#name')
      expect(shrink('http://schema.org/Person?version=1.0')).toBe('schema:Person?version=1.0')
    })

    it('handles various FOAF URIs', () => {
      expect(shrink('http://xmlns.com/foaf/0.1/Person')).toBe('foaf:Person')
      expect(shrink('http://xmlns.com/foaf/0.1/name')).toBe('foaf:name')
    })

    it('handles Dublin Core URIs', () => {
      expect(shrink('http://purl.org/dc/elements/1.1/title')).toBe('dc:title')
      expect(shrink('http://purl.org/dc/terms/created')).toBe('dct:created')
    })

    it('handles SKOS URIs', () => {
      expect(shrink('http://www.w3.org/2004/02/skos/core#Concept')).toBe('skos:Concept')
      expect(shrink('http://www.w3.org/2004/02/skos/core#prefLabel')).toBe('skos:prefLabel')
    })

    it('handles very long URIs', () => {
      const longUri = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#' + 'a'.repeat(1000)
      const expected = 'rdf:' + 'a'.repeat(1000)
      expect(shrink(longUri)).toBe(expected)
    })
  })
})
