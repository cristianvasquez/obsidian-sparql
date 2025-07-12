<script setup>
import { inject, onMounted, ref, watch } from 'vue'
import { MarkdownRenderer } from 'obsidian'
import { renderMarkdown } from './helpers/renderingUtils.js'

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

const context = inject('context')
const containerRef = ref(null)

function generateMarkdownTable (header, rows) {
  const escape = (s) => s?.replace(/\|/g, '\\|') ?? ''
  const headerRow = `| ${header.map(escape).join(' | ')} |`
  const dividerRow = `| ${header.map(() => '---').join(' | ')} |`
  const dataRows = rows.map(row =>
      `| ${row.map(renderMarkdown).join(' | ')} |`,
  )
  return [headerRow, dividerRow, ...dataRows].join('\n')
}

async function renderTable () {
  if (!containerRef.value) return

  containerRef.value.innerHTML = '' // Clear old content
  const md = generateMarkdownTable(props.header, props.rows)

  try {
    await MarkdownRenderer.render(
        context.app,
        md,
        containerRef.value,
        '',
        context.plugin,
    )
  } catch (error) {
    console.error('Failed to render markdown table:', error)
    // Fallback to plain text
    const pre = document.createElement('pre')
    pre.textContent = md
    containerRef.value.appendChild(pre)
  }
}

onMounted(renderTable)
watch(() => [props.header, props.rows], renderTable, { deep: true })
</script>

<template>
  <div class="markdown-table-render" ref="containerRef"></div>
</template>
