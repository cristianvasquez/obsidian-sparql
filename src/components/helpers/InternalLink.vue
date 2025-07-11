<!-- src/components/helpers/InternalLink.vue -->
<script setup>
import { inject } from 'vue'
import { openOrSwitch, hoverPreview } from 'obsidian-community-lib'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  resolved: {
    type: Boolean,
    default: true
  }
})

const context = inject('context')

async function handleClick(event) {
  event.preventDefault()
  event.stopPropagation()

  try {
    await openOrSwitch(props.path, event, {
      createNewFile: !props.resolved // Only create if unresolved
    })
  } catch (error) {
    console.error('Failed to open file:', error)
    context.app?.workspace?.showNotice?.(`Failed to open: ${props.path}`)
  }
}

async function handleMouseOver(event) {
  // Only show preview for resolved files
  if (!props.resolved) return

  try {
    const view = {
      app: context.app,
      getViewType: () => 'sparql-internal-link'
    }
    hoverPreview(event, view, props.path)
  } catch (error) {
    // Hover preview errors are common and not critical
    console.debug('Hover preview not available')
  }
}
</script>

<template>
  <a
    class="internal-link"
    :class="{ 'is-unresolved': !resolved }"
    :data-href="path"
    :aria-label="`${resolved ? 'Open' : 'Create'} ${title}`"
    :title="resolved ? `Open ${title}` : `Create ${title}`"
    href="#"
    @click="handleClick"
    @mouseover="handleMouseOver"
  >
    {{ title }}
  </a>
</template>

<style scoped>
.internal-link {
  text-decoration: none;
  cursor: pointer;
  color: var(--link-color);
}

.internal-link:hover {
  color: var(--link-color-hover);
  text-decoration: underline;
}

.internal-link.is-unresolved {
  color: var(--link-unresolved-color);
  opacity: var(--link-unresolved-opacity);
}
</style>
