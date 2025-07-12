<script setup>
import { inject, onMounted, ref } from 'vue'

import { MarkdownRenderer } from 'obsidian'
import { getBasePath, termAsMarkdown } from './helpers/renderingUtils.js'

const props = defineProps({
  term: {
    type: Object,
    required: true,
  },
  row: {
    type: Object,
    default: null,
  },
  pointer: {
    type: Object,
    default: null,
  },
  context: {
    type: String,
    default: 'unknown',
  },
})

const context = inject('context')
const { app } = context
const markdownContainer = ref(null)

// Render term using shared rendering utility
const renderTerm = async () => {
  if (markdownContainer.value) {
    markdownContainer.value.innerHTML = ''

    if (props.term.termType === 'NamedNode') {

      const markdown = termAsMarkdown(props.term, getBasePath(app))
      await MarkdownRenderer.render(
          context.app,
          markdown,
          markdownContainer.value,
          '',
          context.plugin,
      )
    } else {
      // Simple text for Literals and other types
      markdownContainer.value.textContent = props.term.value || ''
    }
  }
}

onMounted(() => {

  if (markdownContainer.value) {
    renderTerm()
  }
})
</script>

<template>
  <!-- Render as markdown link for name URIs -->
  <span ref="markdownContainer" class="term-markdown-link"></span>

</template>
