import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import InternalLink from '../../../src/components/helpers/InternalLink.vue'

// Mock obsidian-community-lib
vi.mock('obsidian-community-lib', () => ({
  hoverPreview: vi.fn(),
  isInVault: vi.fn((app, path) => path.includes('existing') || path.endsWith('.md')),
  openOrSwitch: vi.fn()
}))

// Mock URI utils
vi.mock('../../../src/lib/uriUtils.js', () => ({
  isVaultUri: vi.fn((uri) => uri.startsWith('urn:name:') || uri.startsWith('file://')),
  getTitleFromInternalUri: vi.fn((uri) => {
    if (uri.startsWith('urn:name:')) return uri.replace('urn:name:', '')
    if (uri.startsWith('file://')) {
      const path = uri.replace('file://', '')
      const filename = path.split('/').pop()
      return filename.endsWith('.md') ? filename.replace('.md', '') : filename
    }
    return uri
  }),
  getPathFromInternalUri: vi.fn((uri) => {
    if (uri.startsWith('file://')) return uri.replace('file://', '')
    return null
  }),
  getNameFromInternalUri: vi.fn((uri) => {
    if (uri.startsWith('urn:name:')) return uri.replace('urn:name:', '')
    return null
  })
}))

describe('InternalLink.vue', () => {
  let mockContext
  let mockApp

  beforeEach(() => {
    mockApp = {
      workspace: {
        getActiveFile: vi.fn(() => ({ path: 'current.md' }))
      }
    }
    
    mockContext = {
      app: mockApp
    }
  })

  it('renders link with correct title for URI', () => {
    const wrapper = mount(InternalLink, {
      props: {
        linkTo: 'urn:name:MyNote'
      },
      global: {
        provide: {
          context: mockContext
        }
      }
    })

    expect(wrapper.find('a').text()).toBe('MyNote')
  })

  it('renders link with correct title for file URI', () => {
    const wrapper = mount(InternalLink, {
      props: {
        linkTo: 'file:///path/to/document.md'
      },
      global: {
        provide: {
          context: mockContext
        }
      }
    })

    expect(wrapper.find('a').text()).toBe('document')
  })

  it('handles file paths without .md extension', () => {
    const wrapper = mount(InternalLink, {
      props: {
        linkTo: 'path/to/MyNote'
      },
      global: {
        provide: {
          context: mockContext
        }
      }
    })

    expect(wrapper.find('a').text()).toBe('MyNote')
  })

  it('handles file paths without directory', () => {
    const wrapper = mount(InternalLink, {
      props: {
        linkTo: 'SimpleNote.md'
      },
      global: {
        provide: {
          context: mockContext
        }
      }
    })

    expect(wrapper.find('a').text()).toBe('SimpleNote')
  })

  it('adds "is-unresolved" class for files not in vault', () => {
    const wrapper = mount(InternalLink, {
      props: {
        linkTo: 'nonexistent/file.md'
      },
      global: {
        provide: {
          context: mockContext
        }
      }
    })

    expect(wrapper.find('a').classes()).toContain('is-unresolved')
  })

  it('does not add "is-unresolved" class for files in vault', () => {
    const wrapper = mount(InternalLink, {
      props: {
        linkTo: 'existing/file.md'
      },
      global: {
        provide: {
          context: mockContext
        }
      }
    })

    expect(wrapper.find('a').classes()).not.toContain('is-unresolved')
  })

  it('calls openOrSwitch when clicked', async () => {
    const { openOrSwitch } = await import('obsidian-community-lib')
    
    const wrapper = mount(InternalLink, {
      props: {
        linkTo: 'test/file.md'
      },
      global: {
        provide: {
          context: mockContext
        }
      }
    })

    await wrapper.find('.internal-link').trigger('click')
    
    expect(openOrSwitch).toHaveBeenCalledWith(mockApp, 'test/file.md', expect.any(Object))
  })

  it('calls hoverPreview when hovered', async () => {
    const { hoverPreview } = await import('obsidian-community-lib')
    
    const wrapper = mount(InternalLink, {
      props: {
        linkTo: 'test/file.md'
      },
      global: {
        provide: {
          context: mockContext
        }
      }
    })

    await wrapper.find('.internal-link').trigger('mouseover')
    
    expect(hoverPreview).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        app: mockApp,
        getViewType: expect.any(Function)
      }),
      'test/file.md'
    )
  })

  it('getViewType returns correct SIDE_VIEW_ID', async () => {
    const { hoverPreview } = await import('obsidian-community-lib')
    
    const wrapper = mount(InternalLink, {
      props: {
        linkTo: 'test/file.md'
      },
      global: {
        provide: {
          context: mockContext
        }
      }
    })

    await wrapper.find('.internal-link').trigger('mouseover')
    
    const callArgs = hoverPreview.mock.calls[0]
    const trickObsidianAPI = callArgs[1]
    
    expect(trickObsidianAPI.getViewType()).toBe('obsidian-sparql-sideview')
  })

  it('handles edge cases in getFileTitle', () => {
    const testCases = [
      { input: 'simple', expected: 'simple' },
      { input: 'file.md', expected: 'file' },
      { input: 'path/file.md', expected: 'file' },
      { input: 'deep/nested/path/file.md', expected: 'file' },
      { input: 'file.with.dots.md', expected: 'file.with.dots' },
      { input: 'path/file.with.dots.md', expected: 'file.with.dots' }
    ]

    testCases.forEach(({ input, expected }) => {
      const wrapper = mount(InternalLink, {
        props: {
          linkTo: input
        },
        global: {
          provide: {
            context: mockContext
          }
        }
      })

      expect(wrapper.find('a').text()).toBe(expected)
    })
  })
})