<script setup>
import { inject, onMounted, ref, computed } from 'vue'
import { Parser } from 'sparqljs'
import { replaceSPARQL } from '../lib/templates.js'
import SimpleTable from './SimpleTable.vue'

// Injected
const text = inject('text')
const context = inject('context')

// State
const tableData = ref(null)
const error = ref(null)

// Constants
const parser = new Parser({ skipValidation: true, sparqlStar: true })

const hasResults = computed(() => tableData.value?.rows?.length > 0)

const toTable = {
  SELECT(results) {
    const header = Object.keys(results?.[0] || {})
    const rows = results.map(row => header.map(k => row[k]?.value ?? ''))
    return { header, rows }
  },
  CONSTRUCT(dataset) {
    const rows = Array.from(dataset).map(q => [
      q.subject.value,
      q.predicate.value,
      q.object.value
    ])
    return { header: ['subject', 'predicate', 'object'], rows }
  }
}

const runQuery = async (queryType, queryText) => {
  const store = context.triplestore
  if (queryType === 'SELECT') return toTable.SELECT(await store.select(queryText))
  if (queryType === 'CONSTRUCT') return toTable.CONSTRUCT(await store.construct(queryText))
  throw new Error(`⚠️ Unhandled query type: ${queryType}`)
}

onMounted(async () => {
  try {
    const file = context.app.workspace.getActiveFile()
    const replaced = replaceSPARQL(text, file)
    const parsed = parser.parse(replaced)
    tableData.value = await runQuery(parsed.queryType, replaced)
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  }
})
</script>

<template>
  <div class="sparql-query-component">
    <SimpleTable v-if="tableData" :header="tableData.header" :rows="tableData.rows" />
    <p v-if="tableData && !hasResults" class="no-results">No results found</p>

    <div v-else-if="error" class="error">
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
</style>
