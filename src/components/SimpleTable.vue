<!-- src/components/SimpleTable.vue -->
<script setup>
import Term from './Term.vue'

const props = defineProps({
  header: {
    type: Array,
    required: true,
  },
  rows: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <div class="table-container">
    <table class="sparql-table">
      <thead>
        <tr>
          <th v-for="(heading, index) in header" :key="index">
            {{ heading }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, rowIndex) in rows" :key="rowIndex">
          <td v-for="(term, colIndex) in row" :key="colIndex">
            <Term v-if="term" :term="term" />
            <span v-else class="null-value">—</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-container {
  overflow-x: auto;
  margin: 1rem 0;
}

.sparql-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95em;
}

.sparql-table th,
.sparql-table td {
  padding: 0.5rem;
  text-align: left;
  border: 1px solid var(--background-modifier-border);
}

.sparql-table th {
  background: var(--background-secondary);
  font-weight: 500;
  position: sticky;
  top: 0;
}

.sparql-table tr:hover {
  background: var(--background-secondary);
}

.null-value {
  color: var(--text-muted);
  font-style: italic;
}
</style>
