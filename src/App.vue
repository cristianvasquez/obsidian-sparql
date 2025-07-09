<script>
import { inject } from 'vue'

export default {
  setup() {
    const context = inject('context')
    if (!context) throw new Error('Obsidian context not provided')

    const app = context.app

    return {
      app
    }
  },
  computed: {
    activeLeafData() {
      return this.app.workspace?.activeLeaf?.view?.data
    }
  }
}
</script>

<template>
  <h1>Root App</h1>
  <p>{{ activeLeafData }}</p>
</template>

<style></style>
