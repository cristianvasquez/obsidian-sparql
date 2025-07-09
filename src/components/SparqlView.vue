<script setup>
import { inject, onMounted, ref } from 'vue'
import SimpleTable from './components/SimpleTable.vue'
import { Parser } from 'sparqljs'

const text = inject('text')
const context = inject('context')

const data = ref(null)
const error = ref(null)

const parser = new Parser({ skipValidation: true, sparqlStar: true })

/**
 * Run a SELECT query and format results into a table.
 */
async function handleSelect() {
  try {
    const result = await context.triplestore.select(text)
    data.value = context.config.selectToTable(result)
  } catch (e) {
    error.value = formatError(e)
  }
}

/**
 * Run a CONSTRUCT query and format results into a table.
 */
async function handleConstruct() {
  try {
    const result = await context.triplestore.construct(text)
    data.value = context.config.datasetToTable(result)
  } catch (e) {
    error.value = formatError(e)
  }
}

/**
 * Convert any error into a display-friendly string.
 */
function formatError(err) {
  return err instanceof Error ? err.message : String(err)
}

/**
 * Main lifecycle logic to parse and execute the SPARQL query.
 */
onMounted(async () => {
  try {
    const query = parser.parse(text)

    console.log('[SPARQL]', text)

    switch (query.queryType) {
      case 'SELECT':
        await handleSelect()
        break
      case 'CONSTRUCT':
        await handleConstruct()
        break
      default:
        error.value = [
          `⚠️ Unhandled query type: "${query.queryType}"`,
          '',
          JSON.stringify(query, null, 2),
        ].join('\n')
    }
  } catch (e) {
    error.value = formatError(e)
  }
})
</script>

<template>
  <template v-if="data">
    <simple-table :header="data.header" :rows="data.rows" />
    <div v-if="!data.rows.length">No results</div>
  </template>

  <div v-else-if="error" class="error">
    <pre>{{ error }}</pre>
  </div>
</template>

<style scoped>
.error {
  color: red;
  white-space: pre-wrap;
  margin-top: 1rem;
}
</style>
