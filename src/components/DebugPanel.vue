<script setup>
import { triplify } from 'vault-triplifier'
import { options } from '../options.js'
import Term from './Term.vue'

import { inject, onMounted, ref } from 'vue'

const context = inject('context')
const { app } = context
const counter = ref(0)
const rootPointer = ref(null)
const error = ref(null)

const triplifyFile = async (file) => {
  const content = await app.vault.read(file)
  rootPointer.value = await triplify(file.path, content, options)
}

onMounted(() => {
  context.events.on('update', async (file) => {
    counter.value = counter.value + 1
    await triplifyFile(file)
  })
})
</script>

<template>
  <div v-if="error" class="error">
    {{ error }}
  </div>
  <RdfTree v-if="rootPointer" :pointer="rootPointer" :termComponent="Term"/>
</template>

<style>
.error {
  color: red;
  padding: 1rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  margin: 1rem 0;
}

.loading {
  text-align: center;
  color: #7f8c8d;
  padding: 2rem;
}
</style>
