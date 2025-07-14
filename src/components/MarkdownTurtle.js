import {
  getBasePath,
  termAsMarkdown,
} from './helpers/renderingUtils.js'

/**
 * Convert SPARQL CONSTRUCT results to S-P-O table with subject grouping
 * @param {Array} results - SPARQL CONSTRUCT results (array of triples)
 * @param {Object} app - Obsidian app instance
 * @param {string} title - Optional title for the table output (empty string to skip title)
 * @returns {string} Markdown table with Subject-Predicate-Object columns
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

  const escape = (s) => s?.replace(/\|/g, '\\|') ?? ''
  const header = '| Subject | Predicate | Object |'
  const divider = '| --- | --- | --- |'

  let previousSubject = null
  const rows = sortedResults.map(result => {
    const subject = termAsMarkdown(result.subject, basePath)
    const predicate = termAsMarkdown(result.predicate, basePath)
    const object = termAsMarkdown(result.object, basePath)

    const displaySubject = subject === previousSubject ? '' : escape(subject)
    previousSubject = subject

    return `| ${displaySubject} | ${escape(predicate)} | ${escape(object)} |`
  })

  const titleSection = title ? `# ${title}\n\n` : ''
  return `${titleSection}${[header, divider, ...rows].join('\n')}`
}
