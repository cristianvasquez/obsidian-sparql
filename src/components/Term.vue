<script setup>
import { nameFromUri, propertyFromUri } from 'vault-triplifier'
import { getNameFromPath, isFileUri, isNameUri, peekTerm } from '../lib/uriUtils.js'
import InternalLink from './helpers/InternalLink.vue'
import { shrink } from './helpers/utils.js'
import { computed, inject } from 'vue'

const props = defineProps({
  term: {
    type: Object,
    required: true,
  },
  row: {
    type: Object,
    default: null,
  },
  pointer: {
    type: Object,
    default: null,
  },
  context: {
    type: String,
    default: 'unknown',
  },
})

const { app } = inject('context')

const peekInfo = computed(() => peekTerm(props.term, app))

const display = computed(() => {

  if (peekInfo?.path) {
    return getNameFromPath(peekInfo.path)
  }
  if (props.term.termType === 'NamedNode') {
    return nameFromUri(props.term) ?? propertyFromUri(props.term) ?? shrink(props.term.value)
  }
  return term.value ?? ''

})


</script>

<template>
  <template v-if="peekInfo">
    <InternalLink
        :title="display"
        :path="peekInfo.normalized"
        :resolved="true"
    />
  </template>
  <template v-else>
    {{ display }}
  </template>
</template>
