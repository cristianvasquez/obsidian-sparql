<!-- InternalLink.vue -->
<script setup>
import { openOrSwitch, hoverPreview } from 'obsidian-community-lib'
import { inject, computed } from 'vue'
import {
  getTitleFromUri,
} from '../../lib/uriUtils.js'

const context = inject('context')

const props = defineProps({
  peekInfo: {
    type: Object,
  },
})

// Computed properties for cleaner template
const title = computed(() => getTitleFromUri(props.peekInfo.term))

const isResolved = computed(() => {
  if (!context?.app) return false

  return context.app.vault.getAbstractFileByPath(props.peekInfo.absPath) !== null
})

// Get the path to open - handles both name and file URIs
const getOpenablePath = () => {
  if (props.peekInfo) {
    return props.peekInfo.normalized
  }
  return null
}

// Event handlers
async function handleClick (event) {
  event.preventDefault()
  event.stopPropagation()

  const path = getOpenablePath()
  if (!path) {
    console.warn('No valid path to open for:', props.linkTo)
    return
  }

  try {
    // openOrSwitch expects: filePath, event, options
    await openOrSwitch(path, event, {
      createNewFile: true, // Create file if it doesn't exist (for unresolved names)
    })
  } catch (error) {
    console.error('Failed to open file:', error)
    // Could show a notice to user here
    context.app?.workspace?.showNotice?.(`Failed to open: ${path}`)
  }
}

async function handleMouseOver (event) {
  const path = getOpenablePath()
  if (!path) return

  try {
    // Create a minimal view object for hoverPreview
    const view = {
      app: context.app,
      getViewType: () => 'sparql-internal-link',
    }

    hoverPreview(event, view, path)
  } catch (error) {
    // Hover preview errors are non-critical, just log them
    console.debug('Hover preview failed:', error)
  }
}
</script>

<template>
  <a
      class="internal-link"
      :class="{ 'is-unresolved': !isResolved }"
      :data-href="title"
      :aria-label="`Open ${title}`"
      href="#"
      @click="handleClick"
      @mouseover="handleMouseOver"
  >
    {{ title }}
  </a>
</template>

<style scoped>
/* Use Obsidian's built-in internal link styles */
.internal-link {
  text-decoration: none;
  cursor: pointer;
}

.internal-link:hover {
  text-decoration: underline;
}

/* Obsidian will apply its own styles for .is-unresolved */
</style>
