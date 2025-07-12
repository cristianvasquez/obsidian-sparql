<template>
  <div>
    <h2>Pretty Turtle Output:</h2>
    <div class="turtle-render" ref="containerRef"></div>
  </div>
</template>

<script setup>
import Serializer from '@rdfjs/serializer-turtle'
import { inject, onMounted, ref, watch } from 'vue'
import { MarkdownRenderer } from 'obsidian'

const props = defineProps({
  pointer: {
    type: Object,
    required: true,
  },
})

const context = inject('context')
const containerRef = ref(null)
const turtleOutput = ref('')

async function renderTurtle() {
  if (!containerRef.value || !turtleOutput.value) return

  containerRef.value.innerHTML = '' // Clear old content
  const md = '```turtle\n' + turtleOutput.value + '\n```'

  try {
    await MarkdownRenderer.render(
      context.app,
      md,
      containerRef.value,
      '',
      context.plugin,
    )
  } catch (error) {
    console.error('Failed to render turtle markdown:', error)
    // Fallback to plain text
    const pre = document.createElement('pre')
    pre.textContent = turtleOutput.value
    containerRef.value.appendChild(pre)
  }
}

onMounted(async () => {
  const serializer = new Serializer()
  turtleOutput.value = serializer.transform(props.pointer.dataset)
  await renderTurtle()
})

watch(() => props.pointer, async () => {
  const serializer = new Serializer()
  turtleOutput.value = serializer.transform(props.pointer.dataset)
  await renderTurtle()
}, { deep: true })

</script>
