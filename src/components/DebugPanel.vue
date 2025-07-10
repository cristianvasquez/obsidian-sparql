<script setup>
import { triplify } from 'vault-triplifier'

import { inject, onMounted, ref } from 'vue'

const options = {
  // Default partitioning options
  partitionBy: ['headers-all', 'identifier'],

  // Include labels for better readability
  includeLabelsFor: ['documents', 'sections', 'properties'],

  // Include selectors for debugging
  includeSelectors: true,

  // Don't include raw content by default
  includeRaw: false,

  // Standard namespace prefixes
  prefix: {
    rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    schema: 'http://schema.org/',
    foaf: 'http://xmlns.com/foaf/0.1/',
    dc: 'http://purl.org/dc/elements/1.1/',
    dct: 'http://purl.org/dc/terms/',
  },

  // Property mappings for common semantic relationships
  mappings: {
    'is a': 'rdf:type',
    'same as': 'rdf:sameAs',
    'knows': 'foaf:knows',
    'name': 'foaf:name',
    'title': 'dct:title',
    'created': 'dct:created',
    'modified': 'dct:modified',
    'author': 'dct:creator',
    'subject': 'dct:subject',
    'description': 'dct:description',
  },
}
const context = inject('context')
const { app } = context

const result = ref('')

const triplifyFile = async (file) => {
  const content = await app.vault.read(file)
  const { term, dataset } = await triplify(file, content, options)
  result.value = dataset.toString()
}

onMounted(() => {
  context.events.on('update', async (file) => {
    await triplifyFile(file)
  })
})

</script>

<template>
  <pre>{{ result }}</pre>
</template>
