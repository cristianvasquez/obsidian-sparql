import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import App from '../../src/components/App.vue'

// Mock VaultTriplifier
vi.mock('../../src/lib/VaultTriplifier.js', () => ({
  default: class MockVaultTriplifier {
    async triplifyContent(content, path) {
      return {
        term: `file://${path}`,
        dataset: {
          toString: () => `<file://${path}> <rdf:type> <vault:File> .\n<file://${path}> <vault:content> "${content}" .`
        }
      }
    }
  }
}))

// Mock context
const mockContext = {
  app: {
    vault: {
      read: vi.fn().mockResolvedValue('# Test\n\nTest content')
    }
  },
  events: {
    _handlers: {},
    on(event, handler) {
      if (!this._handlers[event]) this._handlers[event] = []
      this._handlers[event].push(handler)
    },
    emit(event, ...args) {
      if (this._handlers[event]) {
        this._handlers[event].forEach(handler => handler(...args))
      }
    }
  }
}

describe('App.vue', () => {
  it('renders empty result initially', () => {
    const wrapper = mount(App, {
      global: {
        provide: {
          context: mockContext
        }
      }
    })
    
    expect(wrapper.find('pre').text()).toBe('')
  })

  it('triplifies file when update event is triggered', async () => {
    const wrapper = mount(App, {
      global: {
        provide: {
          context: mockContext
        }
      }
    })

    // Trigger update
    mockContext.events.emit('update', { path: 'test.md' })
    
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))
    
    const result = wrapper.find('pre').text()
    expect(result).toContain('file://test.md')
    expect(result).toContain('vault:File')
  })
})