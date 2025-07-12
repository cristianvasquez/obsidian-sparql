<!-- src/components/Term.vue -->
<script setup>
import { computed, inject, onMounted, ref } from 'vue'
import {
  getTermDisplay,
  isNameUri,
} from '../lib/uriUtils.js'
import { nameFromUri } from 'vault-triplifier'
import { MarkdownRenderer } from 'obsidian'

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

// Check if this is a name URI that should be rendered as markdown link
const isInternalLink = computed(() => isNameUri(props.term))

// Get display text for non-link terms
const displayText = computed(() => getTermDisplay(props.term))

// Determine CSS class based on term type
const termClass = computed(() => {
  if (isInternalLink.value) return 'term-link'
  if (props.term.termType === 'Literal') return 'term-literal'
  return 'term-uri'
})

// Render markdown link using MarkdownRenderer
const renderMarkdown = async () => {
  if (isInternalLink.value && markdownContainer.value) {
    const noteName = nameFromUri(props.term)
    const markdown = `[[${noteName}]]`
    
    markdownContainer.value.innerHTML = ''
    
    try {
      await MarkdownRenderer.render(
        context.app,
        markdown,
        markdownContainer.value,
        '',
        context.plugin
      )
    } catch (error) {
      console.error('Failed to render markdown link:', error)
      // Fallback to plain text
      markdownContainer.value.textContent = noteName
    }
  }
}

onMounted(() => {
  console.log('Hey')
  console.log('Term.vue mounted:', props.term.value, 'isInternalLink:', isInternalLink.value)
  if (isInternalLink.value) {
    renderMarkdown()
  }
})
</script>

<template>
  <!-- Render as markdown link for name URIs -->
  <span v-if="isInternalLink" ref="markdownContainer" class="term-markdown-link"></span>

  <!-- Otherwise render as plain text with appropriate styling -->
  <span v-else :class="['term-text', termClass]">
    {{ displayText }}
  </span>
</template>

<style scoped>
.term-text {
  word-break: break-word;
}

.term-literal {
  color: var(--text-muted);
}

.term-uri {
  color: var(--text-faint);
  font-size: 0.9em;
}
</style>
