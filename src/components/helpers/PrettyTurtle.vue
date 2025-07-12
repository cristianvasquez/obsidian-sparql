<template>
  <div>
    <h2>Pretty Turtle Output:</h2>
    <pre>{{ turtleOutput }}</pre>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  pointer: {
    type: Object,
    required: true,
  },
})
const turtleOutput = ref('')

onMounted(async () => {
  turtleOutput.value = props.pointer.dataset.toString()
})

</script>
