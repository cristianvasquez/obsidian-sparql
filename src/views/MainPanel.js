import { MarkdownRenderer } from 'obsidian'
import { QUERY_TEMPLATES } from '../queries.js'
import { replaceAllTokens, removeFrontmatter } from '../lib/templates.js'

// Store selected template and mode globally to persist across file changes
let selectedTemplateKey = 'current-file'
let isRichMode = true // true = 'osg', false = 'osg-debug'
let availableQueries = {} // Cache for dynamically loaded queries
let queriesLoaded = false // Track if queries have been loaded
let currentDropdownSelect = null // Reference to current dropdown for refresh

/**
 * Load available query templates from the triplestore
 */
async function loadAvailableQueries (context) {
  const discoveryQuery = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX dot: <http://pending.org/dot/>
PREFIX dcterms: <http://purl.org/dc/terms/>

SELECT ?document ?title ?content WHERE {    
    GRAPH ?g {  
        ?document a dot:MarkdownDocument .        
        ?document dot:tag "panel/query" .        
        ?document dot:raw ?content .        
    	OPTIONAL { ?document dcterms:title ?title }    
    	OPTIONAL { ?document <urn:property:order> ?order }
	}
} ORDER BY ?order`

  try {
    const results = await context.triplestore.select(discoveryQuery)
    const queries = {}

    // Add discovered queries
    results.forEach(result => {
      const title = result.title?.value || 'Untitled Query'
      const content = result.content?.value || ''
      const key = title.toLowerCase().replace(/\s+/g, '-')
      queries[key] = content
    })

    // Only use hardcoded queries as fallback if no queries were discovered
    if (Object.keys(queries).length === 0) {
      console.log('No queries discovered, using hardcoded fallback')
      Object.assign(queries, QUERY_TEMPLATES)
    }

    availableQueries = queries
    return queries
  } catch (error) {
    console.error('Failed to load available queries:', error)
    // Fallback to hardcoded templates
    availableQueries = { ...QUERY_TEMPLATES }
    return availableQueries
  }
}

/**
 * Populate dropdown with available queries
 */
function populateDropdown (select, queries) {
  // Clear existing options
  select.innerHTML = ''

  // Add options for each query
  Object.keys(queries).forEach(key => {
    const option = document.createElement('option')
    option.value = key
    option.textContent = key.replace(/-/g, ' ').
      replace(/\b\w/g, l => l.toUpperCase())
    select.appendChild(option)
  })
}

/**
 * Create template selector dropdown with mode radio button
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

  // Dropdown will be populated later after queries are loaded

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
  const activeFile = context.app.workspace.getActiveFile()
  const absolutePath = activeFile ? context.app.vault.adapter.getFullPath(
    activeFile.path) : ''

  // Get the raw markdown template
  const markdownTemplate = availableQueries[templateKey]
  if (!markdownTemplate) {
    console.error(`Template '${templateKey}' not found`)
    return
  }

  // Remove frontmatter
  const cleanedMarkdown = removeFrontmatter(markdownTemplate)

  // Apply unified token replacement to the entire markdown content
  const processedMarkdown = replaceAllTokens(cleanedMarkdown, absolutePath,
    activeFile)

  // Update the code block type based on rich mode
  const finalMarkdown = processedMarkdown.replace(
    /```osg\n/g,
    `\`\`\`${isRichMode ? 'osg' : 'osg-debug'}\n`,
  )

  await renderMarkdown(container, finalMarkdown, context)
}

/**
 * Helper to render markdown
 */
async function renderMarkdown (container, markdown, context) {
  const activeFile = context.app.workspace.getActiveFile()
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
    markdown,
    queryContainer,
    sourcePath,
    context.plugin,
  )
}

/**
 * Refresh available queries from triplestore
 */
export async function refreshPanelQueries (context) {
  // Force reload queries from triplestore
  queriesLoaded = false
  await loadAvailableQueries(context)

  // Update dropdown if it exists
  if (currentDropdownSelect) {
    populateDropdown(currentDropdownSelect, availableQueries)

    // Ensure selectedTemplateKey exists in available queries
    if (!availableQueries[selectedTemplateKey]) {
      // First try to use 'current-file' as default
      if (availableQueries['current-file']) {
        selectedTemplateKey = 'current-file'
      } else {
        // Otherwise use the first available query
        const firstKey = Object.keys(availableQueries)[0]
        if (firstKey) {
          selectedTemplateKey = firstKey
        }
      }
    }

    // Set the dropdown value after populating
    currentDropdownSelect.value = selectedTemplateKey
  }
}

/**
 * Initialize the debug panel (only called once when panel is first opened)
 */
async function initializeDebugPanel (container, context) {
  container.innerHTML = ''

  // Load available queries from triplestore only once
  if (!queriesLoaded) {
    await loadAvailableQueries(context)
    queriesLoaded = true
  }

  // Create controls with change handlers
  const { container: controlsContainer, select } = createControls(
    context,
    (templateKey) => {
      renderQuery(container, templateKey, context)
    },
    (richMode) => {
      renderQuery(container, selectedTemplateKey, context)
    },
  )

  container.appendChild(controlsContainer)

  // Store reference to dropdown for refresh functionality
  currentDropdownSelect = select

  // Update dropdown with loaded queries
  populateDropdown(select, availableQueries)

  // Ensure selectedTemplateKey exists in available queries
  if (!availableQueries[selectedTemplateKey]) {
    // First try to use 'current-file' as default
    if (availableQueries['current-file']) {
      selectedTemplateKey = 'current-file'
    } else {
      // Otherwise use the first available query
      const firstKey = Object.keys(availableQueries)[0]
      if (firstKey) {
        selectedTemplateKey = firstKey
      }
    }
  }

  // Set the dropdown value after populating
  select.value = selectedTemplateKey

  // Initial render with persisted selected template and mode
  await renderQuery(container, selectedTemplateKey, context)

  // Manual event delegation for both wiki links and file:// links in side panel
  container.addEventListener('click', (event) => {
    const linkEl = event.target.closest('a')
    if (linkEl) {
      const href = linkEl.getAttribute('data-href') ||
        linkEl.getAttribute('href')

      if (href) {
        // Handle internal wiki links
        if (linkEl.classList.contains('internal-link')) {
          event.preventDefault()
          const activeFile = context.app.workspace.getActiveFile()
          const sourcePath = activeFile ? activeFile.path : ''
          context.app.workspace.openLinkText(href, sourcePath)
        }
        // Handle file:// links
        else if (href.startsWith('file://')) {
          event.preventDefault()
          try {
            // Convert file:// URL to path and open in Obsidian
            const filePath = decodeURIComponent(href.replace('file://', ''))
            const relativePath = context.app.vault.adapter.path.relative(
              context.app.vault.adapter.basePath,
              filePath,
            )

            // Try to open the file if it exists in the vault
            const file = context.app.vault.getAbstractFileByPath(relativePath)
            if (file) {
              context.app.workspace.openLinkText(relativePath, '')
            } else {
              // Fallback: try to open with system default
              require('electron').shell.openPath(filePath)
            }
          } catch (error) {
            console.error('Failed to open file:', error)
            // Last resort: try electron shell
            try {
              require('electron').shell.openExternal(href)
            } catch (e) {
              console.error('Failed to open with shell:', e)
            }
          }
        }
      }
    }
  })
}

/**
 * Update only the query content for file changes (lightweight)
 */
async function updateQueryContent (container, context) {
  // Only update the query content, not the entire panel
  await renderQuery(container, selectedTemplateKey, context)
}

/**
 * Main entry point - decides whether to initialize or just update content
 */
export async function renderPanel (container, context, forceInit = false) {
  // If container is empty or force init, do full initialization
  if (container.innerHTML === '' || forceInit) {
    await initializeDebugPanel(container, context)
  } else {
    // Otherwise just update the query content
    await updateQueryContent(container, context)
  }
}
