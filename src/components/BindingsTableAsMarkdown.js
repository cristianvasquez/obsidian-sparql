import { getBasePath } from '../lib/utils.js'
import { termAsMarkdown } from './termAsMarkdown.js'

/**
 * Generate markdown table from SELECT query results
 * Replaces SimpleTable.vue functionality
 * @param {Array} header - Table header array
 * @param {Array} rows - Table rows array
 * @param {Object} app - Obsidian app instance
 * @returns {string} Markdown table string
 */
export function generateMarkdownTable (header, rows, app) {
  const basePath = getBasePath(app)

  const escape = (s) => s?.replace(/\|/g, '\\|') ?? ''
  const headerRow = `| ${header.map(escape).join(' | ')} |`
  const dividerRow = `| ${header.map(() => '---').join(' | ')} |`
  const dataRows = rows.map(row =>
    `| ${row.map(term => term ? termAsMarkdown(term, basePath) : '').
      join(' | ')} |`,
  )

  return [headerRow, dividerRow, ...dataRows].join('\n')
}
