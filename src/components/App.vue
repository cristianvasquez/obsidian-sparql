<script setup>
import { inject, onMounted, ref } from 'vue'
import VaultTriplifier from '../lib/VaultTriplifier.js'

const context = inject('context')
const { app } = context

const result = ref('')
const triplifier = new VaultTriplifier()

const triplifyFile = async (file) => {
  try {
    const content = await app.vault.read(file)
    const { term, dataset } = await triplifier.triplifyContent(content, file.path)
    result.value = dataset.toString()
  } catch (err) {
    result.value = 'Error: ' + err.message
  }
}

onMounted(() => {
  context.events.on('update', async (file) => {
    await triplifyFile(file)
  })
})

</script>

<template>
  <pre>{{ result }}</pre>
</template>
