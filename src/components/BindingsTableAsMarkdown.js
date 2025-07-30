import { getBasePath } from '../lib/utils.js'
import { termAsMarkdown } from './termAsMarkdown.js'
import { safe } from './termAsMarkdown.js'
import toNT from '@rdfjs/to-ntriples'

/**
 * Generate raw markdown table from SELECT query results using raw string representation
 * @param {Array} header - Table header array
 * @param {Array} rows - Table rows array
 * @param {Object} app - Obsidian app instance
 * @returns {string} Markdown table string
 */
export function generateMarkdownTableRaw (header, rows, app) {
  const headerRow = `| ${header.map(safe).join(' | ')} |`
  const dividerRow = `| ${header.map(() => '---').join(' | ')} |`
  const dataRows = rows.map(row =>
    `| ${row.map(term => term ? safe(toNT(term)) : '').
      join(' | ')} |`,
  )

  return [headerRow, dividerRow, ...dataRows].join('\n')
}

/**
 * Generate rich markdown table from SELECT query results with non-repeating values
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

  // Track previous row values to avoid repetition
  const previousRow = new Array(header.length).fill(null)

  const dataRows = rows.map(row => {
    const cells = row.map((term, colIndex) => {
      if (!term) return ''

      const currentValue = termAsMarkdown(term, basePath)

      // Check if this value is the same as the previous row in the same column
      if (previousRow[colIndex] === currentValue) {
        return '' // Don't repeat the value
      } else {
        previousRow[colIndex] = currentValue
        return currentValue
      }
    })

    return `| ${cells.join(' | ')} |`
  })

  return [headerRow, dividerRow, ...dataRows].join('\n')
}
