import { MarkdownRenderer } from 'obsidian'
import { Parser } from 'sparqljs'
import { generateMarkdownTable, generateMarkdownTableRaw } from '../components/BindingsTableAsMarkdown.js'
import { resultsToMarkdownTurtle } from '../components/turtleAsMarkdown.js'
import { renderError } from '../components/renderError.js'
import { prettyPrint } from '../lib/prettyPrint.js'
import { replaceAllTokens } from '../lib/templates.js'
import { ns } from '../namespaces.js'

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
      // Show simple message instead of throwing error
      container.innerHTML = '<p>No active file</p>'
      return
    }

    // Get absolute path and repo path
    const absolutePath = context.app.vault.adapter.getFullPath(activeFile.path)
    const repoPath = context.app.vault.adapter.basePath

    // Replace template variables
    const replacedQuery = replaceAllTokens(source, absolutePath, activeFile,
      repoPath)

    // Parse query to determine type
    const parser = new Parser({ skipValidation: true, sparqlStar: true })
    const parsed = parser.parse(replacedQuery)

    // Execute query based on type
    let results
    if (parsed.queryType === 'SELECT') {
      results = await context.controller.select(replacedQuery)
      await renderSelectResults(results, container, context, debug,
        replacedQuery)
    } else if (parsed.queryType === 'CONSTRUCT') {
      results = await context.controller.construct(replacedQuery)
      await renderConstructQuery(results, container, context, debug,
        replacedQuery)
    } else {
      throw new Error(`Unsupported query type: ${parsed.queryType}`)
    }
  } catch (error) {
    console.error('SPARQL View error:', error)
    
    // Always render error inline in the same place as SPARQL results
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
    // Convert results to table format - both controllers now return plain objects
    const header = Object.keys(results[0])
    
    const rows = results.map(row => {
      return header.map(key => {
        const value = row[key]
        return value || null  
      })
    })
    
    // Use raw table for debug mode, rich table for normal mode
    const markdownTable = debug 
      ? generateMarkdownTableRaw(header, rows, context.app)
      : generateMarkdownTable(header, rows, context.app)
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

