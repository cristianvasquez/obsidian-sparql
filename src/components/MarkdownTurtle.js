import {
  getBasePath,
  termAsMarkdown,
} from './helpers/renderingUtils.js'

/**
 * Convert SPARQL CONSTRUCT results to grouped layout with subjects as headers
 * @param {Array} results - SPARQL CONSTRUCT results (array of triples)
 * @param {Object} app - Obsidian app instance
 * @param {string} title - Optional title for the output (empty string to skip title)
 * @returns {string} Markdown with subjects as headers and property-value tables
 */
export function resultsToMarkdownTurtle(results, app, title = 'Turtle Output') {
  if (!results || results.length === 0) {
    const titleSection = title ? `# ${title}\n\n` : ''
    return `${titleSection}(No triples found)`
  }

  const basePath = getBasePath(app)

  // Sort with NamedNodes before BlankNodes, then by predicate
  const sortedResults = [...results].sort((a, b) => {
    const subjectA = a.subject
    const subjectB = b.subject

    const isBlankA = subjectA.termType === 'BlankNode'
    const isBlankB = subjectB.termType === 'BlankNode'

    if (isBlankA !== isBlankB) {
      return isBlankA ? 1 : -1 // NamedNodes come first
    }

    const valA = subjectA.value
    const valB = subjectB.value

    if (valA !== valB) {
      return valA.localeCompare(valB)
    }

    return a.predicate.value.localeCompare(b.predicate.value)
  })

  // Group triples by subject
  const subjectGroups = new Map()
  for (const result of sortedResults) {
    const subjectKey = result.subject.value
    if (!subjectGroups.has(subjectKey)) {
      subjectGroups.set(subjectKey, [])
    }
    subjectGroups.get(subjectKey).push(result)
  }

  const escape = (s) => s?.replace(/\|/g, '\\|') ?? ''
  const sections = []

  // Create sections for each subject
  for (const [subjectKey, triples] of subjectGroups) {
    const subjectMarkdown = termAsMarkdown(triples[0].subject, basePath)
    
    // Subject as header
    sections.push(`## ${escape(subjectMarkdown)}`)
    
    // Property-Value table
    const propertyHeader = '| Property | Value |'
    const propertyDivider = '| --- | --- |'
    
    const propertyRows = triples.map(result => {
      const predicate = termAsMarkdown(result.predicate, basePath)
      const object = termAsMarkdown(result.object, basePath)
      return `| ${escape(predicate)} | ${escape(object)} |`
    })
    
    sections.push([propertyHeader, propertyDivider, ...propertyRows].join('\n'))
  }

  const titleSection = title ? `# ${title}\n\n` : ''
  return `${titleSection}${sections.join('\n\n')}`
}
