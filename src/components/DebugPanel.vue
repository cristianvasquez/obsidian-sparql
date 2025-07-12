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
const showTurtle = ref(false)
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

<style scoped>
.debug-panel {
  padding: 0.5rem;
  height: 100%;
  overflow-y: auto;
}

.file-info {
  margin-bottom: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: var(--background-secondary);
  border-radius: 4px;
  color: var(--text-muted);
  font-size: 0.85em;
}

.error {
  color: var(--text-error);
  padding: 1rem;
  background: var(--background-secondary);
  border: 1px solid var(--background-modifier-error);
  border-radius: 4px;
  margin: 1rem 0;
}

.loading,
.no-content {
  text-align: center;
  color: var(--text-muted);
  padding: 2rem;
}

.view-toggle {
  margin-bottom: 1rem;
  text-align: right;
}

.view-toggle button {
  background: var(--background-primary);
  color: var(--text-normal);
  border: 1px solid var(--background-modifier-border);
  border-radius: 5px;
  padding: 0.3rem 0.75rem;
  cursor: pointer;
  font-size: 0.85rem;
}
</style>
