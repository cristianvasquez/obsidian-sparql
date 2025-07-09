<script setup>
import { ns } from '../namespaces.js'
import InternalLink from './helpers/InternalLink.vue'
import { inject } from '@vue/runtime-core'
import { shrink } from './helpers/utils.js'
import { nameToUri } from 'vault-triplifier'

const context = inject('context')

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

function isInternal (value) {
  return value.startsWith(ns.this())
}

</script>

<!--Perhaps this could be prettier, see:-->
<!--https://codepen.io/team/Vue/pen/BaKbowJ-->

<template>
  <table>
    <thead>
    <tr>
      <th v-for="header of props.header">{{ header }}</th>
    </tr>
    </thead>
    <tr v-for="row of props.rows">
      <td v-for="value of row">
        <template v-if="isInternal(value)">
          <internal-link :linkTo="nameToUri(value)" class="clickable"/>
        </template>
        <template v-else>
          {{ shrink(value) }}
        </template>
      </td>
    </tr>
  </table>
</template>
