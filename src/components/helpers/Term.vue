<script setup>
import InternalLink from './InternalLink.vue'
import { getSpans } from './renderingUtils'

const emit = defineEmits(['term-clicked'])

const props = defineProps({
  term: {
    required: true,
  },
})

function updateField (term) {
  emit('term-clicked', term)
}


</script>

<template>
  <div v-if="term.entities" class="words">
    <template v-for="span in getSpans(term.raw, term.entities.map((entity)=>entity.name))">
      <template v-if="span.type==='link'">
        <internal-link :linkTo="span.value" class="clickable"/>
      </template>
      <template v-else><span @click="updateField(term)">{{ span.value }}</span></template>
    </template>
  </div>
  <template v-else>
    <div @click="updateField(term)">{{ term.raw }}</div>
  </template>

</template>
