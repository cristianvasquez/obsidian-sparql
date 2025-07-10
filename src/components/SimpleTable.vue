<script setup>
import { propertyFromUri } from 'vault-triplifier'
import InternalLink from './helpers/InternalLink.vue'
import { shrink } from './helpers/utils.js'
import { isFileUri, isNameUri, peekTerm } from '../lib/uriUtils.js'
import { ref, inject } from 'vue'

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

const error = ref(null)
const context = inject('context')

function isClickable (term) {
  return isFileUri(term) || isNameUri(term)
}

function renderTerm (term) {
  try {
    // Handle null/undefined terms
    if (!term) return ''

    // For Literals, just return the value
    if (term.termType === 'Literal') {
      return term.value
    }

    // For NamedNodes, check if they are special vault URIs
    if (term.termType === 'NamedNode') {
      return propertyFromUri(term) ?? shrink(term.value)
    }

    // Fallback for other term types (BlankNodes, etc.)
    return term.value || ''
  } catch (err) {
    console.error('Error in renderTerm:', err)
    error.value = `Error rendering term: ${err.message}`
    return 'Error'
  }
}

</script>

<!--Perhaps this could be prettier, see:-->
<!--https://codepen.io/team/Vue/pen/BaKbowJ-->

<template>
  <div v-if="error">
    {{ error }}
  </div>
  <table v-else>
    <thead>
    <tr>
      <th v-for="header of props.header">{{ header }}</th>
    </tr>
    </thead>
    <tr v-for="row of props.rows">
      <td v-for="term of row">
        <template v-if="isClickable(term)">
          <internal-link :peekInfo="peekTerm(term, context.app)" class="clickable"/>
        </template>
        <template v-else>
          {{ renderTerm(term) }}
        </template>
      </td>
    </tr>
  </table>
</template>

