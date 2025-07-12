import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Term from '../Term.vue'

// Mock MarkdownRenderer from Obsidian
vi.mock('obsidian', () => ({
  MarkdownRenderer: {
    render: vi.fn()
  }
}))

// Mock vault-triplifier functions
vi.mock('vault-triplifier', () => ({
  nameFromUri: vi.fn((term) => {
    if (term.value.startsWith('urn:name:')) {
      return term.value.replace('urn:name:', '')
    }
    return null
  }),
  propertyFromUri: vi.fn((term) => {
    if (term.value.startsWith('urn:property:')) {
      return term.value.replace('urn:property:', '')
    }
    return null
  }),
  fileURLToPath: vi.fn(() => null)
}))

// Mock shrink function
vi.mock('../helpers/utils.js', () => ({
  shrink: vi.fn((uriStr) => {
    const prefixes = {
      'http://schema.org/': 'schema:',
      'http://www.w3.org/1999/02/22-rdf-syntax-ns#': 'rdf:',
      'http://www.w3.org/2000/01/rdf-schema#': 'rdfs:'
    }
    
    for (const [namespace, prefix] of Object.entries(prefixes)) {
      if (uriStr.startsWith(namespace)) {
        return uriStr.replace(namespace, prefix)
      }
    }
    return uriStr
  })
}))

describe('Term.vue', () => {
  const mockApp = {
    workspace: {
      getActiveFile: vi.fn(() => null)
    },
    metadataCache: {
      getFirstLinkpathDest: vi.fn(() => null)
    },
    vault: {
      adapter: {
        basePath: '/test/vault'
      }
    }
  }

  const createWrapper = (term) => {
    return mount(Term, {
      props: { term },
      global: {
        provide: {
          context: { app: mockApp }
        }
      }
    })
  }

  it('should display name URIs without urn:name: prefix', () => {
    const term = { termType: 'NamedNode', value: 'urn:name:replacd' }
    const wrapper = createWrapper(term)
    
    // Should show 'replacd', not 'urn:name:replacd'
    expect(wrapper.text()).toBe('replacd')
  })

  it('should display name URIs with headings correctly', () => {
    const term = { termType: 'NamedNode', value: 'urn:name:Hello#World' }
    const wrapper = createWrapper(term)
    
    expect(wrapper.text()).toBe('Hello#World')
  })

  it('should display property URIs without urn:property: prefix', () => {
    const term = { termType: 'NamedNode', value: 'urn:property:hasAuthor' }
    const wrapper = createWrapper(term)
    
    expect(wrapper.text()).toBe('hasAuthor')
  })

  it('should display external URIs with namespace shrinking', () => {
    const term = { termType: 'NamedNode', value: 'http://schema.org/author' }
    const wrapper = createWrapper(term)
    
    expect(wrapper.text()).toBe('schema:author')
  })

  it('should display literals as-is', () => {
    const term = { termType: 'Literal', value: 'Some text value' }
    const wrapper = createWrapper(term)
    
    expect(wrapper.text()).toBe('Some text value')
  })

  it('should render name URIs as markdown links when app context available', async () => {
    const { MarkdownRenderer } = await import('obsidian')
    
    const term = { termType: 'NamedNode', value: 'urn:name:MyNote' }
    const wrapper = createWrapper(term)
    
    // Should attempt to render as markdown link
    // Note: In real usage, this would be rendered by Obsidian's MarkdownRenderer
    // but in tests we just check that the component logic is correct
    
    // The component should detect this as an internal link
    expect(wrapper.vm.linkInfo).toBeTruthy()
    expect(wrapper.vm.linkInfo.path).toBe('MyNote')
  })
})