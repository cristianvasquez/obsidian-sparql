import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import SparqlView from '../../src/components/SparqlView.vue'
import SimpleTable from '../../src/components/SimpleTable.vue'

// Mock the templates module
vi.mock('../../src/lib/templates.js', () => ({
  replaceSPARQL: vi.fn((text, file) => text.replace('__THIS__', `<file://${file.path}>`))
}))

// Mock sparqljs Parser
vi.mock('sparqljs', () => ({
  Parser: vi.fn().mockImplementation(() => ({
    parse: vi.fn((query) => {
      if (query.includes('SELECT')) {
        return { queryType: 'SELECT' }
      } else if (query.includes('CONSTRUCT')) {
        return { queryType: 'CONSTRUCT' }
      }
      throw new Error('Invalid query')
    })
  }))
}))

describe.skip('SparqlView.vue', () => {
  let mockContext
  let mockTriplestore

  beforeEach(() => {
    mockTriplestore = {
      select: vi.fn(),
      construct: vi.fn()
    }

    mockContext = {
      triplestore: mockTriplestore,
      app: {
        workspace: {
          getActiveFile: vi.fn(() => ({ path: 'test.md', basename: 'test' }))
        }
      }
    }
  })

  it('renders SimpleTable with SELECT query results', async () => {
    // Mock SELECT query results
    const mockSelectResults = [
      { name: { value: 'John' }, age: { value: '30' } },
      { name: { value: 'Jane' }, age: { value: '25' } }
    ]
    mockTriplestore.select.mockResolvedValue(mockSelectResults)

    const wrapper = mount(SparqlView, {
      global: {
        provide: {
          context: mockContext,
          text: 'SELECT * WHERE { ?s ?p ?o }'
        }
      }
    })

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(wrapper.findComponent(SimpleTable).exists()).toBe(true)
    expect(wrapper.findComponent(SimpleTable).props('header')).toEqual(['name', 'age'])
    expect(wrapper.findComponent(SimpleTable).props('rows')).toEqual([
      ['John', '30'],
      ['Jane', '25']
    ])
  })

  it('renders SimpleTable with CONSTRUCT query results', async () => {
    // Mock CONSTRUCT query results (RDF dataset)
    const mockDataset = [
      {
        subject: { value: 'http://example.com/john' },
        predicate: { value: 'http://example.com/name' },
        object: { value: 'John' }
      },
      {
        subject: { value: 'http://example.com/john' },
        predicate: { value: 'http://example.com/age' },
        object: { value: '30' }
      }
    ]
    mockTriplestore.construct.mockResolvedValue(mockDataset)

    const wrapper = mount(SparqlView, {
      global: {
        provide: {
          context: mockContext,
          text: 'CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }'
        }
      }
    })

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(wrapper.findComponent(SimpleTable).exists()).toBe(true)
    expect(wrapper.findComponent(SimpleTable).props('header')).toEqual(['subject', 'predicate', 'object'])
    expect(wrapper.findComponent(SimpleTable).props('rows')).toEqual([
      ['http://example.com/john', 'http://example.com/name', 'John'],
      ['http://example.com/john', 'http://example.com/age', '30']
    ])
  })

  it('shows "No results found" when query returns empty results', async () => {
    mockTriplestore.select.mockResolvedValue([])

    const wrapper = mount(SparqlView, {
      global: {
        provide: {
          context: mockContext,
          text: 'SELECT * WHERE { ?s ?p ?o }'
        }
      }
    })

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(wrapper.text()).toContain('No results found')
  })

  it('displays error message when query fails', async () => {
    mockTriplestore.select.mockRejectedValue(new Error('SPARQL endpoint error'))

    const wrapper = mount(SparqlView, {
      global: {
        provide: {
          context: mockContext,
          text: 'SELECT * WHERE { ?s ?p ?o }'
        }
      }
    })

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(wrapper.find('.error').exists()).toBe(true)
    expect(wrapper.find('.error pre').text()).toContain('SPARQL endpoint error')
  })

  it('displays error message when query parsing fails', async () => {
    const wrapper = mount(SparqlView, {
      global: {
        provide: {
          context: mockContext,
          text: 'INVALID QUERY'
        }
      }
    })

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(wrapper.find('.error').exists()).toBe(true)
    expect(wrapper.find('.error pre').text()).toContain('Invalid query')
  })

  it('handles unsupported query types', async () => {
    // Mock parser to return unsupported query type
    const { Parser } = await import('sparqljs')
    const mockParser = new Parser()
    mockParser.parse.mockReturnValue({ queryType: 'ASK' })

    const wrapper = mount(SparqlView, {
      global: {
        provide: {
          context: mockContext,
          text: 'ASK { ?s ?p ?o }'
        }
      }
    })

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(wrapper.find('.error').exists()).toBe(true)
    expect(wrapper.find('.error pre').text()).toContain('Unhandled query type: ASK')
  })
})