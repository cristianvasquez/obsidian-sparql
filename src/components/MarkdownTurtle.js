import {
  getBasePath,
  termAsMarkdown,
} from './helpers/renderingUtils.js'
import { sortTriplesBySubject } from './helpers/subjectSorter.js'

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

  // Sort by subject priority: Normal -> MarkdownDocument -> Blank nodes
  const sortedResults = sortTriplesBySubject(results)

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
