import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SimpleTable from '../../src/components/SimpleTable.vue'
import InternalLink from '../../src/components/helpers/InternalLink.vue'
import { createNamedNode, createLiteral } from '../helpers/testTerms.js'

// Mock the helper components and utilities
vi.mock('../../src/components/helpers/InternalLink.vue', () => ({
  default: {
    name: 'InternalLink',
    props: ['linkTo'],
    template: '<span class="internal-link">{{ linkTo }}</span>'
  }
}))

vi.mock('../../src/components/helpers/utils.js', () => ({
  shrink: vi.fn((value) => {
    if (value.includes('http://example.com/')) return value.replace('http://example.com/', 'ex:')
    if (value.includes('http://another.com/')) return value.replace('http://another.com/', 'another:')
    return value
  })
}))

vi.mock('vault-triplifier', () => ({
  nameToUri: vi.fn((name) => `urn:name:${name}`),
  nameFromUri: vi.fn((term) => {
    if (term && term.value && term.value.startsWith('urn:name:')) {
      return term.value.replace('urn:name:', '')
    }
    return null
  }),
  pathFromUri: vi.fn((term) => {
    if (term && term.value && term.value.startsWith('urn:resource:')) {
      return term.value.replace('urn:resource:', '')
    }
    return null
  }),
  fileUri: vi.fn((path) => `file://${path}`)
}))

// Mock URI utils
vi.mock('../../src/lib/uriUtils.js', () => ({
  isClickableUri: vi.fn((term, app) => {
    if (!term || !term.value) return false
    return term.value.startsWith('file://') || term.value.startsWith('urn:name:')
  }),
  isPropertyUri: vi.fn((term) => {
    return term && term.value && term.value.startsWith('urn:property:')
  }),
  getPropertyFromUri: vi.fn((term) => {
    if (term && term.value && term.value.startsWith('urn:property:')) {
      return term.value.replace('urn:property:', '')
    }
    return null
  }),
  isVaultUri: vi.fn((term, app) => {
    if (!term || !term.value) return false
    return term.value.startsWith('file://') || term.value.startsWith('urn:name:') || term.value.startsWith('urn:property:')
  }),
  getTitleFromUri: vi.fn((term, app) => {
    const { nameFromUri } = require('vault-triplifier')
    
    if (!term || !term.value) return 'Unknown'
    
    const name = nameFromUri(term)
    if (name) return name
    
    if (term.value.startsWith('file://')) {
      const path = term.value.replace('file://', '')
      const filename = path.includes('/') ? path.split('/').pop() : path
      return filename.endsWith('.md') ? filename.replace('.md', '') : filename
    }
    
    return term.value
  })
}))

describe('SimpleTable.vue', () => {
  let mockContext

  beforeEach(() => {
    mockContext = {
      app: {
        workspace: {
          getActiveFile: vi.fn(() => ({ path: 'test.md' }))
        }
      }
    }
  })

  it('renders table with header and rows', () => {
    const wrapper = mount(SimpleTable, {
      props: {
        header: ['name', 'age', 'city'],
        rows: [
          [createLiteral('John'), createLiteral('30'), createLiteral('New York')],
          [createLiteral('Jane'), createLiteral('25'), createLiteral('London')]
        ]
      },
      global: {
        provide: {
          context: mockContext
        }
      }
    })

    // Check header
    const headerCells = wrapper.findAll('th')
    expect(headerCells).toHaveLength(3)
    expect(headerCells[0].text()).toBe('name')
    expect(headerCells[1].text()).toBe('age')
    expect(headerCells[2].text()).toBe('city')

    // Check rows
    const rows = wrapper.findAll('tr')
    expect(rows).toHaveLength(3) // 1 header + 2 data rows

    const firstDataRow = rows[1].findAll('td')
    expect(firstDataRow).toHaveLength(3)
    expect(firstDataRow[0].text()).toBe('John')
    expect(firstDataRow[1].text()).toBe('30')
    expect(firstDataRow[2].text()).toBe('New York')
  })

  it('renders InternalLink for internal URIs', () => {
    const wrapper = mount(SimpleTable, {
      props: {
        header: ['subject'],
        rows: [
          [createNamedNode('urn:name:MyNote')],
          [createNamedNode('http://example.com/external')]
        ]
      },
      global: {
        provide: {
          context: mockContext
        },
        components: {
          InternalLink
        }
      }
    })

    const rows = wrapper.findAll('tr')
    
    // First data row should have InternalLink (vault URI)
    const firstRow = rows[1]
    expect(firstRow.findComponent(InternalLink).exists()).toBe(true)
    
    // Second data row should use shrink function for external URI
    const secondRow = rows[2]
    expect(secondRow.text()).toContain('ex:external')
  })

  it('renders external URIs with shrink function', () => {
    const wrapper = mount(SimpleTable, {
      props: {
        header: ['uri'],
        rows: [
          [createNamedNode('http://example.com/resource')],
          [createNamedNode('http://another.com/item')]
        ]
      },
      global: {
        provide: {
          context: mockContext
        }
      }
    })

    // Check that the shrink function was used (mocked to return shortened URIs)
    const rows = wrapper.findAll('tr').slice(1) // Skip header
    expect(rows[0].text()).toContain('ex:resource')
    expect(rows[1].text()).toContain('another:item')
  })

  it('handles empty table', () => {
    const wrapper = mount(SimpleTable, {
      props: {
        header: [],
        rows: []
      },
      global: {
        provide: {
          context: mockContext
        }
      }
    })

    expect(wrapper.findAll('th')).toHaveLength(0)
    expect(wrapper.findAll('tr')).toHaveLength(1) // Only header row
  })

  it('handles table with headers but no data rows', () => {
    const wrapper = mount(SimpleTable, {
      props: {
        header: ['name', 'age'],
        rows: []
      },
      global: {
        provide: {
          context: mockContext
        }
      }
    })

    expect(wrapper.findAll('th')).toHaveLength(2)
    expect(wrapper.findAll('tr')).toHaveLength(1) // Only header row
  })

  it('correctly identifies internal vs external URIs', () => {
    const wrapper = mount(SimpleTable, {
      props: {
        header: ['uri'],
        rows: [
          [createNamedNode('urn:name:InternalNote')],
          [createNamedNode('http://external.com/resource')],
          [createNamedNode('file:///vault/AnotherNote.md')]
        ]
      },
      global: {
        provide: {
          context: mockContext
        },
        components: {
          InternalLink
        }
      }
    })

    const dataRows = wrapper.findAll('tr').slice(1) // Skip header
    
    // First and third rows should have InternalLink (vault URIs)
    expect(dataRows[0].findComponent(InternalLink).exists()).toBe(true)
    expect(dataRows[2].findComponent(InternalLink).exists()).toBe(true)
    
    // Second row should not have InternalLink (external URI)
    expect(dataRows[1].findComponent(InternalLink).exists()).toBe(false)
  })
})