<!-- src/components/Term.vue -->
<script setup>
import { computed, inject } from 'vue'
import {
  getInternalLinkInfo,
  getTermDisplay,
  isPropertyUri
} from '../lib/uriUtils.js'
import { shrink } from './helpers/utils.js'
import InternalLink from './helpers/InternalLink.vue'

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

const { app } = inject('context')

// Get link info if this term represents an internal link
const linkInfo = computed(() => getInternalLinkInfo(props.term, app))

// Get display text
const displayText = computed(() => {
  // If we have link info, use its display name
  if (linkInfo.value) {
    return linkInfo.value.displayName
  }

  // For properties, use vault-triplifier's extraction
  if (isPropertyUri(props.term)) {
    return getTermDisplay(props.term)
  }

  // For other named nodes, try to shrink using prefixes
  if (props.term.termType === 'NamedNode') {
    return shrink(props.term.value)
  }

  // For everything else, use the generic display function
  return getTermDisplay(props.term)
})

// Determine CSS class based on term type
const termClass = computed(() => {
  if (linkInfo.value) return 'term-link'
  if (isPropertyUri(props.term)) return 'term-property'
  if (props.term.termType === 'Literal') return 'term-literal'
  return 'term-uri'
})
</script>

<template>
  <!-- Render as internal link if we have link info -->
  <InternalLink
    v-if="linkInfo"
    :title="displayText"
    :path="linkInfo.path"
    :resolved="linkInfo.resolved"
  />

  <!-- Otherwise render as plain text with appropriate styling -->
  <span v-else :class="['term-text', termClass]">
    {{ displayText }}
  </span>
</template>

<style scoped>
.term-text {
  word-break: break-word;
}

.term-property {
  color: var(--text-accent);
  font-style: italic;
}

.term-literal {
  color: var(--text-muted);
}

.term-uri {
  color: var(--text-faint);
  font-size: 0.9em;
}
</style>
