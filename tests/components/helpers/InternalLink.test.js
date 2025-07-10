import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import InternalLink from '../../../src/components/helpers/InternalLink.vue'

// Mock obsidian-community-lib
vi.mock('obsidian-community-lib', () => ({
  hoverPreview: vi.fn(),
  isInVault: vi.fn(() => true),
  openOrSwitch: vi.fn()
}))

// Mock URI utils
vi.mock('../../../src/lib/uriUtils.js', () => ({
  getTitleFromUri: vi.fn((term) => {
    if (!term?.value) return 'Unknown'
    if (term.value.startsWith('urn:name:')) return term.value.replace('urn:name:', '')
    if (term.value.startsWith('file://')) {
      const path = term.value.replace('file://', '')
      const filename = path.split('/').pop()
      return filename.endsWith('.md') ? filename.replace('.md', '') : filename
    }
    return term.value
  }),
  getPathFromFileUri: vi.fn((term) => {
    if (term?.value?.startsWith('file://')) return term.value.replace('file://', '')
    return null
  }),
  getNameFromNameUri: vi.fn((term) => {
    if (term?.value?.startsWith('urn:name:')) return term.value.replace('urn:name:', '')
    return null
  }),
  isNameUri: vi.fn((term) => term?.value?.startsWith('urn:name:')),
  isNameResolved: vi.fn(() => true)
}))

describe('InternalLink.vue', () => {
  let mockContext

  beforeEach(() => {
    mockContext = {
      app: {
        workspace: {
          getActiveFile: vi.fn(() => ({ path: 'current.md' }))
        }
      }
    }
  })

  it('renders link with correct title', () => {
    const mockTerm = { value: 'urn:name:MyNote', termType: 'NamedNode' }
    
    const wrapper = mount(InternalLink, {
      props: {
        linkTo: mockTerm
      },
      global: {
        provide: {
          context: mockContext
        }
      }
    })

    expect(wrapper.text()).toBe('MyNote')
  })

  it('handles file URIs', () => {
    const mockTerm = { value: 'file:///path/to/document.md', termType: 'NamedNode' }
    
    const wrapper = mount(InternalLink, {
      props: {
        linkTo: mockTerm
      },
      global: {
        provide: {
          context: mockContext
        }
      }
    })

    expect(wrapper.text()).toBe('document')
  })
})