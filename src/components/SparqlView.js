import { MarkdownRenderer } from 'obsidian'
import { Parser } from 'sparqljs'
import { prettyPrint } from '../lib/prettyPrint.js'
import { replaceSPARQL } from '../lib/templates.js'
import { ns } from '../namespaces.js'
import { resultsToMarkdownTurtle } from './MarkdownTurtle.js'
import { generateMarkdownTable } from './BindingsTable.js'
import { handleTriplestoreError } from '../lib/simpleErrorHandler.js'

/**
 * Vanilla JS SparqlView function to replace Vue component
 * Processes osg code blocks and renders SPARQL query results
 */
export async function renderSparqlView (
  source, container, context, debug = false) {
  try {
    // Get active file
    const activeFile = context.app.workspace.getActiveFile()
    if (!activeFile) {
      throw new Error('No active file')
    }

    // Get absolute path
    const absolutePath = context.app.vault.adapter.getFullPath(activeFile.path)

    // Replace template variables
    const replacedQuery = replaceSPARQL(source, absolutePath)

    // Parse query to determine type
    const parser = new Parser({ skipValidation: true, sparqlStar: true })
    const parsed = parser.parse(replacedQuery)

    // Execute query based on type
    let results
    if (parsed.queryType === 'SELECT') {
      results = await context.triplestore.select(replacedQuery)
      await renderSelectResults(results, container, context, debug,
        replacedQuery)
    } else if (parsed.queryType === 'CONSTRUCT') {
      results = await context.triplestore.construct(replacedQuery)
      await renderConstructQuery(results, container, context, debug,
        replacedQuery)
    } else {
      throw new Error(`Unsupported query type: ${parsed.queryType}`)
    }

  } catch (error) {
    console.error('SparqlView error:', error)
    
    // Handle the error with our simple handler AND show the error
    handleTriplestoreError(error, context.plugin.settings)
    await renderError(error, container, context)
  }
}

/**
 * Render SELECT query results as markdown table (BindingsTable)
 */
async function renderSelectResults (results, container, context, debug, query) {
  let markdown = ''

  // Debug section if requested
  if (debug) {
    markdown += `<details class="debug-panel">\n<summary>Debug: Query</summary>\n\n\`\`\`sparql\n${query}\n\`\`\`\n\n</details>\n\n`
  }

  // Results section
  if (!results || results.length === 0) {
    markdown += 'No results found.\n'
  } else {
    // Convert results to table format
    const header = Object.keys(results[0])
    const rows = results.map(row => header.map(key => row[key] || null))
    const markdownTable = generateMarkdownTable(header, rows, context.app)
    markdown += markdownTable
  }

  // Render single markdown string with proper source path for link resolution
  const activeFile = context.app.workspace.getActiveFile()
  const sourcePath = activeFile ? activeFile.path : ''

  await MarkdownRenderer.render(
    context.app,
    markdown,
    container,
    sourcePath,
    context.plugin,
  )
}

/**
 * Render CONSTRUCT query results as turtle (MarkdownTurtle)
 */
async function renderConstructQuery (
  results, container, context, debug, query) {
  let markdown = ''

  // Debug section if requested
  if (debug) {
    markdown += `<details class="debug-panel">\n<summary>Debug: Query</summary>\n\n\`\`\`sparql\n${query}\n\`\`\`\n\n</details>\n---\n`
  }

  // Generate turtle markdown
  if (!results || results.length === 0) {
    markdown += 'No results found.\n'
  } else {
    // No title needed here since we're in a query context

    const turtleContent = debug ? `\`\`\`turtle
${prettyPrint(results, ns)}
\`\`\`` : resultsToMarkdownTurtle(results, context.app, '')

    markdown += turtleContent + '\n'
  }

  // Render single markdown string with proper source path for link resolution
  const activeFile = context.app.workspace.getActiveFile()
  const sourcePath = activeFile ? activeFile.path : ''

  await MarkdownRenderer.render(
    context.app,
    markdown,
    container,
    sourcePath,
    context.plugin,
  )
}

/**
 * Render error state
 */
async function renderError (error, container, context) {
  const errorMessage = error instanceof Error ? error.message : String(error)

  const markdown = `**Error:** \n\n\`\`\`\n${errorMessage}\n\`\`\`\n`

  // Even for errors, use proper source path for consistency
  const activeFile = context.app.workspace.getActiveFile()
  const sourcePath = activeFile ? activeFile.path : ''

  await MarkdownRenderer.render(
    context.app,
    markdown,
    container,
    sourcePath,
    context.plugin,
  )
}
