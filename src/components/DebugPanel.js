import { MarkdownRenderer } from 'obsidian'

// Store selected template and mode globally to persist across file changes
let selectedTemplateKey = 'current-file'
let isRichMode = true // true = 'osg', false = 'osg-debug'

const QUERY_TEMPLATES = {
  'current-file': {
    name: 'Current File Triples',
    query: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX dot: <http://pending.org/dot/>

CONSTRUCT { ?s ?p ?o } WHERE {
    GRAPH __DOC__ {
      ?s ?p ?o
    }
    FILTER (?p!=dot:raw)
    FILTER (?p!=dot:content)

  }`,
  },
  'backlinks': {
    name: 'Backlinks to Current Note',
    query: `PREFIX dot: <http://pending.org/dot/>

CONSTRUCT {
  # ?s_incoming ?p_incoming ?s .
   ?d_incoming ?p_incoming ?target .
   ?d_incoming dot:obsidianUrl ?url .
}
WHERE {
  VALUES ?target { __DOC__}

  GRAPH ?d_incoming {
    ?s_incoming ?p_incoming ?s .
    ?d_incoming dot:inRepository ?repo .
  }

  GRAPH ?target { ?s ?p ?o }

  FILTER (?d_incoming != ?target)
  
  FILTER(?p_incoming != dot:contains)
  FILTER(?p_incoming != dot:represents)

  BIND(STR(?d_incoming) AS ?docStr)
  BIND(STR(?repo) AS ?repoStr)

  # file path = remainder of doc URI after repo URI + "/"
  BIND(SUBSTR(?docStr, STRLEN(?repoStr) + 2) AS ?filePath)

  # vault = last path segment of repo URI
  BIND(STRAFTER(?repoStr, "file:///") AS ?repoLocal)
  BIND(REPLACE(?repoLocal, "^.*/", "") AS ?vault)

  BIND(ENCODE_FOR_URI(?filePath) AS ?encodedFile)
  BIND(IRI(CONCAT("obsidian://open?vault=", ?vault, "&file=", ?encodedFile)) AS ?url)
}`,
  },
  'note-properties': {
    name: 'Similar tags',
    query: `PREFIX dot: <http://pending.org/dot/>

CONSTRUCT { 
  ?g dot:tag  ?tag .
  ?g dot:inRepository ?repo .
} WHERE {  
    GRAPH __DOC__ {
       ?current dot:tag ?tag
    }
    GRAPH ?g {
      ?s dot:tag ?tag .
      ?g dot:inRepository ?repo .
    }
	FILTER(?g!=__DOC__)
  }
`,
  },
}

/**
st * Create template selector dropdown with mode radio button
 */
function createControls (context, onTemplateChange, onModeChange) {
  const container = document.createElement('div')
  container.style.marginBottom = '10px'
  container.style.padding = '5px'
  container.style.borderBottom = '1px solid var(--background-modifier-border)'
  container.style.display = 'flex'
  container.style.alignItems = 'center'
  container.style.gap = '15px'

  // Template selector
  const templateGroup = document.createElement('div')
  templateGroup.style.display = 'flex'
  templateGroup.style.alignItems = 'center'

  const label = document.createElement('label')
  label.textContent = 'Template: '
  label.style.marginRight = '8px'
  label.style.fontSize = '12px'

  const select = document.createElement('select')
  select.style.padding = '2px 4px'
  select.style.fontSize = '12px'
  select.style.background = 'var(--background-primary)'
  select.style.border = '1px solid var(--background-modifier-border)'
  select.style.borderRadius = '3px'

  // Add options
  Object.entries(QUERY_TEMPLATES).forEach(([key, template]) => {
    const option = document.createElement('option')
    option.value = key
    option.textContent = template.name
    select.appendChild(option)
  })

  // Set current selected value
  select.value = selectedTemplateKey

  // Add change handler
  select.addEventListener('change', () => {
    selectedTemplateKey = select.value // Persist selection
    if (onTemplateChange) {
      onTemplateChange(select.value)
    }
  })

  templateGroup.appendChild(label)
  templateGroup.appendChild(select)

  // Rich mode checkbox
  const modeGroup = document.createElement('div')
  modeGroup.style.display = 'flex'
  modeGroup.style.alignItems = 'center'
  modeGroup.style.gap = '4px'

  const richCheckbox = document.createElement('input')
  richCheckbox.type = 'checkbox'
  richCheckbox.checked = isRichMode
  richCheckbox.style.marginRight = '4px'

  const richLabel = document.createElement('label')
  richLabel.textContent = 'Rich'
  richLabel.style.fontSize = '12px'

  // Add change handler for checkbox
  richCheckbox.addEventListener('change', () => {
    isRichMode = richCheckbox.checked
    if (onModeChange) {
      onModeChange(isRichMode)
    }
  })

  modeGroup.appendChild(richCheckbox)
  modeGroup.appendChild(richLabel)

  container.appendChild(templateGroup)
  container.appendChild(modeGroup)

  return { container, select }
}

/**
 * Render query with selected template
 */
async function renderQuery (container, templateKey, context) {
  const lastUpdateTime = new Date().toLocaleTimeString()
  const activeFile = context.app.workspace.getActiveFile()
  const filename = activeFile ? activeFile.basename : 'No file'
  const title = `${filename} - ${QUERY_TEMPLATES[templateKey].name} - ${lastUpdateTime}`

  const codeBlockType = isRichMode ? 'osg' : 'osg-debug'
  const debugQuery = `> ${title}

\`\`\`${codeBlockType}
${QUERY_TEMPLATES[templateKey].query}
\`\`\``

  const sourcePath = activeFile ? activeFile.path : ''

  // Clear only the query content, not the selector
  const queryContainer = container.querySelector('.query-content') || (() => {
    const div = document.createElement('div')
    div.className = 'query-content'
    container.appendChild(div)
    return div
  })()

  queryContainer.innerHTML = ''

  await MarkdownRenderer.render(
    context.app,
    debugQuery,
    queryContainer,
    sourcePath,
    context.plugin,
  )
}

/**
 * Ultra-simple DebugPanel with query template dropdown and mode selector
 * Reuses all existing SparqlView infrastructure for processing
 */
export async function renderDebugPanel (container, context) {
  container.innerHTML = ''

  // Create controls with change handlers
  const { container: controlsContainer } = createControls(
    context,
    (templateKey) => {
      renderQuery(container, templateKey, context)
    },
    (richMode) => {
      renderQuery(container, selectedTemplateKey, context)
    }
  )

  container.appendChild(controlsContainer)

  // Initial render with persisted selected template and mode
  await renderQuery(container, selectedTemplateKey, context)

  // Manual event delegation for wiki links in side panel
  container.addEventListener('click', (event) => {
    const linkEl = event.target.closest('a.internal-link')
    if (linkEl) {
      event.preventDefault()
      const href = linkEl.getAttribute('data-href') ||
        linkEl.getAttribute('href')
      if (href) {
        const activeFile = context.app.workspace.getActiveFile()
        const sourcePath = activeFile ? activeFile.path : ''
        context.app.workspace.openLinkText(href, sourcePath)
      }
    }
  })
}
