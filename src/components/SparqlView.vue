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

// Constants
const parser = new Parser({ skipValidation: true, sparqlStar: true })

const hasResults = computed(() => tableData.value?.rows?.length > 0)

const toTable = {
  SELECT (results) {
    const header = Object.keys(results?.[0] || {})
    const rows = results.map(row => header.map(k => row[k] || null))
    return { header, rows }
  },
  CONSTRUCT (dataset) {
    const rows = Array.from(dataset).map(q => [
      q.subject,
      q.predicate,
      q.object,
    ])
    return { header: ['subject', 'predicate', 'object'], rows }
  },
}

const runQuery = async (queryType, queryText) => {
  const store = context.triplestore
  if (queryType === 'SELECT') return toTable.SELECT(await store.select(queryText))
  if (queryType === 'CONSTRUCT') return toTable.CONSTRUCT(await store.construct(queryText))
  throw new Error(`⚠️ Unhandled query type: ${queryType}`)
}

onMounted(async () => {
  try {
    const activeFileName = context.app.workspace.getActiveFile().path
    const absolutePath = context.app.vault.adapter.getFullPath(activeFileName)
    const replaced = replaceSPARQL(text, absolutePath)
    replacedQuery.value = replaced

    const parsed = parser.parse(replaced)
    tableData.value = await runQuery(parsed.queryType, replaced)
  } catch (err) {
    console.error('SparqlView error details:', {
      file: context.app.workspace.getActiveFile(),
      vaultPath: context.app.vault?.adapter?.path,
      error: err,
    })
    error.value = err instanceof Error ? err.message : String(err)
  }
})
</script>

<template>
  <div class="sparql-query-component">

    <!-- Debug header: show the resolved query when debug=true -->
    <div v-if="debug && replacedQuery" class="debug-header">
      <details>
        <summary>query</summary>
        <pre class="debug-query">{{ replacedQuery }}</pre>
      </details>
    </div>

    <!-- Query results (always shown unless error) -->
    <SimpleTable v-if="tableData" :header="tableData.header" :rows="tableData.rows"/>
    <p v-if="tableData && !hasResults" class="no-results">No results found</p>

    <!-- Error display -->
    <div v-if="error" class="error">
      <pre>{{ error }}</pre>
    </div>
  </div>
</template>

<style scoped>
.error {
  color: red;
  white-space: pre-wrap;
  margin-top: 1rem;
}

.debug-header {
  margin-bottom: 1rem;
}

.debug-query {
  background: var(--background-secondary);
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.9em;
  overflow-x: auto;
}

details summary {
  cursor: pointer;
  font-weight: 500;
  margin-bottom: 0.5rem;
}
</style>
