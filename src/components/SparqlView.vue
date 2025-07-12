<!-- src/components/SparqlView.vue -->
<script setup>
import { inject, onMounted, ref, computed } from 'vue'
import { Parser } from 'sparqljs'
import { replaceSPARQL } from '../lib/templates.js'
import SimpleTable from './SimpleTable.vue'

// Props
const props = defineProps({
  debug: {
    type: Boolean,
    default: false,
  },
})

// Injected
const text = inject('text')
const context = inject('context')

// State
const tableData = ref(null)
const error = ref(null)
const replacedQuery = ref(null)
const loading = ref(true)

// Constants
const parser = new Parser({ skipValidation: true, sparqlStar: true })

// Computed
const hasResults = computed(() => tableData.value?.rows?.length > 0)

// Convert results to table format
const toTable = {
  SELECT (results) {
    if (!results || results.length === 0) {
      return { header: [], rows: [] }
    }

    const header = Object.keys(results[0])
    const rows = results.map(row =>
        header.map(key => row[key] || null),
    )

    return { header, rows }
  },

  CONSTRUCT (dataset) {
    const rows = Array.from(dataset).map(quad => [
      quad.subject,
      quad.predicate,
      quad.object,
    ])

    return {
      header: ['subject', 'predicate', 'object'],
      rows,
    }
  },
}

// Run SPARQL query
async function runQuery (queryType, queryText) {
  const store = context.triplestore

  switch (queryType) {
    case 'SELECT':
      return toTable.SELECT(await store.select(queryText))
    case 'CONSTRUCT':
      return toTable.CONSTRUCT(await store.construct(queryText))
    default:
      throw new Error(`Unsupported query type: ${queryType}`)
  }
}

// Initialize on mount
onMounted(async () => {
  try {
    loading.value = true

    // Get active file
    const activeFile = context.app.workspace.getActiveFile()
    if (!activeFile) {
      throw new Error('No active file')
    }

    // Get absolute path
    const absolutePath = context.app.vault.adapter.getFullPath(activeFile.path)

    // Replace template variables
    replacedQuery.value = replaceSPARQL(text, absolutePath)

    // Parse query
    const parsed = parser.parse(replacedQuery.value)

    // Execute query
    tableData.value = await runQuery(parsed.queryType, replacedQuery.value)

  } catch (err) {
    console.error('SparqlView error:', err)
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="sparql-view">
    <!-- Debug info -->
    <details v-if="debug && replacedQuery" class="debug-panel">
      <summary>Debug: Query</summary>
      <pre class="debug-content">{{ replacedQuery }}</pre>
    </details>

    <!-- Loading state -->
    <div v-if="loading" class="loading">
      Executing query...
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error">
      <strong>Error:</strong>
      <pre>{{ error }}</pre>
    </div>

    <!-- Results -->
    <template v-else-if="tableData">
      <SimpleTable
          v-if="hasResults"
          :header="tableData.header"
          :rows="tableData.rows"
      />
      <p v-else class="no-results">
        No results found
      </p>
    </template>
  </div>
</template>

<style scoped>
.sparql-view {
  margin: 1rem 0;
}

.debug-panel {
  background: var(--background-secondary);
  padding: 0.5rem;
  margin-bottom: 1rem;
  border-radius: 4px;
}

.debug-panel summary {
  cursor: pointer;
  font-weight: 500;
  user-select: none;
}

.debug-content {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: var(--background-primary);
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.9em;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
}

.error {
  background: var(--background-secondary);
  border: 1px solid var(--background-modifier-error);
  border-radius: 4px;
  padding: 1rem;
  margin: 1rem 0;
}

.error pre {
  margin: 0.5rem 0 0 0;
  white-space: pre-wrap;
  font-size: 0.9em;
}

.no-results {
  text-align: center;
  color: var(--text-muted);
  padding: 2rem;
  margin: 0;
}
</style>
