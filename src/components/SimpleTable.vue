<script setup>
import InternalLink from './helpers/InternalLink.vue'
import { shrink } from './helpers/utils.js'
import { isClickableUri, isPropertyUri, getPropertyFromUri } from '../lib/uriUtils.js'
import { toRaw, ref, inject } from 'vue'

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

const isClickableInternal = (term) => {
  try {
    const context = inject('context')
    return isClickableUri(toRaw(term), context?.app)
  } catch (err) {
    console.error('Error in isClickableInternal:', err)
    error.value = `Error checking if term is clickable: ${err.message}`
    return false
  }
}

function isProperty (term) {
  try {
    return isPropertyUri(term)
  } catch (err) {
    console.error('Error in isProperty:', err)
    return false
  }
}

function getPropertyName (term) {
  try {
    return getPropertyFromUri(term)
  } catch (err) {
    console.error('Error in getPropertyName:', err)
    return term.value || 'Error'
  }
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
      if (isProperty(term)) {
        return getPropertyName(term)
      }
      // For other NamedNodes (external URIs), use shrink
      return shrink(term.value)
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
        <template v-if="isClickableInternal(term)">
          <internal-link :linkTo="term" class="clickable"/>
        </template>
        <template v-else>
          {{ renderTerm(term) }}
        </template>
      </td>
    </tr>
  </table>
</template>

