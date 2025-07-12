<script setup>
import { triplify } from 'vault-triplifier'
import { options } from '../options.js'
import Term from './Term.vue'
import PrettyTurtle from './helpers/PrettyTurtle.vue'
import { RdfTree } from 'rdf-tree'
import { inject, onMounted, ref, onUnmounted } from 'vue'

const { app, events } = inject('context')

const rootPointer = ref(null)
const currentFile = ref(null)
const error = ref(null)
const isLoading = ref(false)
const showTurtle = ref(true)
const version = ref(0)

const loadFile = async (file) => {
  if (!file) {
    rootPointer.value = null
    currentFile.value = null
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const content = await app.vault.read(file)
    const pointer = await triplify(file.path, content, options)

    rootPointer.value = pointer
    currentFile.value = file
    version.value++

    const quads = Array.from(pointer.dataset)
    console.log(`Triplified ${file.path}:`, {
      quads: quads.length,
      subjects: new Set(quads.map(q => q.subject.value)).size,
      term: pointer.term?.value,
    })
  } catch (e) {
    console.error('Triplify error:', e)
    error.value = e.message || 'Failed to triplify file'
    rootPointer.value = null
  } finally {
    isLoading.value = false
  }
}

const handleUpdate = async (file) => {
  console.log('DebugPanel: update event received', file?.path)
  await loadFile(file)
}

onMounted(async () => {
  events.on('update', handleUpdate)
  const activeFile = app.workspace.getActiveFile()
  if (activeFile) await loadFile(activeFile)
})

onUnmounted(() => {
  events.removeListener('update', handleUpdate)
})
</script>

<template>
  <div class="debug-panel">
    <div v-if="currentFile" class="file-info">
      <small>{{ currentFile.path }} (v{{ version }})</small>
    </div>

    <div v-if="error" class="error">
      <strong>Error:</strong> {{ error }}
    </div>

    <div v-else-if="isLoading" class="loading">
      Triplifying...
    </div>

    <div v-else-if="!rootPointer" class="no-content">
      No file open
    </div>

    <div v-else>
      <div class="view-toggle">
        <button @click="showTurtle = !showTurtle">
          {{ showTurtle ? 'Show RDF Tree' : 'Show Turtle' }}
        </button>
      </div>

      <div class="tree-container">
        <RdfTree
            v-if="!showTurtle"
            :key="`tree-${version}`"
            :pointer="rootPointer"
            :enable-right-click="true"
            :enable-highlighting="true"
            :termComponent="Term"
        />
        <PrettyTurtle
            v-else
            :key="`turtle-${version}`"
            :pointer="rootPointer"
        />
      </div>
    </div>
  </div>
</template>
