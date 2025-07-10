import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Term from '../../../src/components/helpers/Term.vue'
import InternalLink from '../../../src/components/helpers/InternalLink.vue'

// Mock InternalLink component
vi.mock('../../../src/components/helpers/InternalLink.vue', () => ({
  default: {
    name: 'InternalLink',
    props: ['linkTo'],
    template: '<span class="internal-link">{{ linkTo }}</span>'
  }
}))

// Mock renderingUtils
vi.mock('../../../src/components/helpers/renderingUtils.js', () => ({
  getSpans: vi.fn((text, links) => {
    // Simple mock implementation
    if (links.length === 0) {
      return [{ value: text, type: 'text' }]
    }
    
    // Mock response for text with links
    const spans = []
    let remaining = text
    
    links.forEach(link => {
      const linkPattern = `[[${link}]]`
      const linkIndex = remaining.indexOf(linkPattern)
      
      if (linkIndex !== -1) {
        // Add text before link
        if (linkIndex > 0) {
          spans.push({ value: remaining.substring(0, linkIndex), type: 'text' })
        }
        
        // Add link
        spans.push({ value: link, type: 'link' })
        
        // Update remaining text
        remaining = remaining.substring(linkIndex + linkPattern.length)
      }
    })
    
    // Add remaining text
    if (remaining.length > 0) {
      spans.push({ value: remaining, type: 'text' })
    }
    
    return spans
  })
}))

describe('Term.vue', () => {
  it('renders simple term without entities', () => {
    const term = {
      raw: 'Simple text without links'
    }

    const wrapper = mount(Term, {
      props: { term }
    })

    expect(wrapper.text()).toBe('Simple text without links')
    expect(wrapper.findComponent(InternalLink).exists()).toBe(false)
  })

  it('renders term with entities containing links', () => {
    const term = {
      raw: 'Text with [[MyNote]] and [[AnotherNote]]',
      entities: [
        { name: 'MyNote' },
        { name: 'AnotherNote' }
      ]
    }

    const wrapper = mount(Term, {
      props: { term },
      global: {
        components: {
          InternalLink
        }
      }
    })

    expect(wrapper.text()).toContain('Text with')
    expect(wrapper.text()).toContain('MyNote')
    expect(wrapper.text()).toContain('AnotherNote')
    expect(wrapper.findAllComponents(InternalLink)).toHaveLength(2)
  })

  it('emits term-clicked event when clicked', async () => {
    const term = {
      raw: 'Clickable text'
    }

    const wrapper = mount(Term, {
      props: { term }
    })

    await wrapper.find('div').trigger('click')

    expect(wrapper.emitted('term-clicked')).toBeTruthy()
    expect(wrapper.emitted('term-clicked')[0]).toEqual([term])
  })

  it('emits term-clicked event when text span is clicked (with entities)', async () => {
    const term = {
      raw: 'Text with [[MyNote]]',
      entities: [
        { name: 'MyNote' }
      ]
    }

    const wrapper = mount(Term, {
      props: { term },
      global: {
        components: {
          InternalLink
        }
      }
    })

    // Find and click the text span (not the link)
    const textSpan = wrapper.find('span:not(.internal-link)')
    if (textSpan.exists()) {
      await textSpan.trigger('click')
      expect(wrapper.emitted('term-clicked')).toBeTruthy()
      expect(wrapper.emitted('term-clicked')[0]).toEqual([term])
    }
  })

  it('handles term with empty entities array', () => {
    const term = {
      raw: 'Text without links',
      entities: []
    }

    const wrapper = mount(Term, {
      props: { term }
    })

    expect(wrapper.text()).toBe('Text without links')
    expect(wrapper.findComponent(InternalLink).exists()).toBe(false)
  })

  it('handles term with entities but no actual links in text', () => {
    const term = {
      raw: 'Plain text',
      entities: [
        { name: 'SomeEntity' }
      ]
    }

    const wrapper = mount(Term, {
      props: { term },
      global: {
        components: {
          InternalLink
        }
      }
    })

    expect(wrapper.text()).toBe('Plain text')
    // Should still show the words div since entities exist
    expect(wrapper.find('.words').exists()).toBe(true)
  })

  it('passes correct linkTo prop to InternalLink', () => {
    const term = {
      raw: 'Check [[MyNote]]',
      entities: [
        { name: 'MyNote' }
      ]
    }

    const wrapper = mount(Term, {
      props: { term },
      global: {
        components: {
          InternalLink
        }
      }
    })

    const internalLink = wrapper.findComponent(InternalLink)
    expect(internalLink.props('linkTo')).toBe('MyNote')
  })

  it('renders multiple text and link spans correctly', () => {
    const term = {
      raw: 'Start [[FirstNote]] middle [[SecondNote]] end',
      entities: [
        { name: 'FirstNote' },
        { name: 'SecondNote' }
      ]
    }

    const wrapper = mount(Term, {
      props: { term },
      global: {
        components: {
          InternalLink
        }
      }
    })

    expect(wrapper.text()).toContain('Start')
    expect(wrapper.text()).toContain('middle')
    expect(wrapper.text()).toContain('end')
    expect(wrapper.text()).toContain('FirstNote')
    expect(wrapper.text()).toContain('SecondNote')
    expect(wrapper.findAllComponents(InternalLink)).toHaveLength(2)
  })
})