<script setup>
import { inject, onMounted, ref, computed } from 'vue'
import { replaceSPARQL } from '../lib/templates.js'

// Injected
const text = inject('text')
const context = inject('context')

const replaced = ref()

onMounted(async () => {
  const file = context.app.workspace.getActiveFile()
  replaced.value = replaceSPARQL(text, file)
})
</script>

<template>
  <pre>{{ replaced }}</pre>
</template>

