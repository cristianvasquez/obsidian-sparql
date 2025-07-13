import { MarkdownRenderer } from 'obsidian'

/**
 * Ultra-simple DebugPanel - just renders a hardcoded SPARQL query
 * Reuses all existing SparqlView infrastructure for processing
 */
export async function renderDebugPanel (container, context) {
  container.innerHTML = ''

  const lastUpdateTime = new Date().toLocaleTimeString()
  // Get current file for title
  const activeFile = context.app.workspace.getActiveFile()
  const filename = activeFile ? activeFile.basename : 'No file'

  const title = `${filename} - last update ${lastUpdateTime}`

  const debugQuery = `> ${title}

\`\`\`osg
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX dot: <http://pkm-united.org/>

CONSTRUCT { ?s ?p ?o } WHERE {
    GRAPH __DOC__ {
      ?s ?p ?o
    }
    FILTER (?p!=dot:raw)
  }
\`\`\``

  await MarkdownRenderer.render(
    context.app,
    debugQuery,
    container,
    '',
    context.plugin,
  )
}
