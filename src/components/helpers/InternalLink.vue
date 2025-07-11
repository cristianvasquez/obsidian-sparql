<!-- InternalLink.vue -->
<script setup>
import { openOrSwitch, hoverPreview } from 'obsidian-community-lib'
import { inject, computed } from 'vue'

const props = defineProps({
  title: String,
  path: String,
  resolved: Boolean
})

const context = inject('context')

async function handleClick(event) {
  event.preventDefault()
  event.stopPropagation()

  if (!props.path) {
    console.warn('No valid path to open')
    return
  }

  try {
    await openOrSwitch(props.path, event, {
      createNewFile: true
    })
  } catch (error) {
    console.error('Failed to open file:', error)
    context.app?.workspace?.showNotice?.(`Failed to open: ${props.path}`)
  }
}

async function handleMouseOver(event) {
  if (!props.path) return

  try {
    const view = {
      app: context.app,
      getViewType: () => 'sparql-internal-link'
    }
    hoverPreview(event, view, props.path)
  } catch (error) {
    console.debug('Hover preview failed:', error)
  }
}
</script>

<template>
  <a
    class="internal-link"
    :class="{ 'is-unresolved': !resolved }"
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
.internal-link {
  text-decoration: none;
  cursor: pointer;
}
.internal-link:hover {
  text-decoration: underline;
}
</style>
