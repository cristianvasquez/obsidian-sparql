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
  
  // Sort results by subject first, then by predicate for better grouping
  const sortedResults = [...results].sort((a, b) => {
    const subjectA = a.subject.value
    const subjectB = b.subject.value
    if (subjectA !== subjectB) {
      return subjectA.localeCompare(subjectB)
    }
    // Same subject, sort by predicate
    return a.predicate.value.localeCompare(b.predicate.value)
  })

  // Build table with subject omission for consecutive same subjects
  const escape = (s) => s?.replace(/\|/g, '\\|') ?? ''
  const header = '| Subject | Predicate | Object |'
  const divider = '| --- | --- | --- |'
  
  let previousSubject = null
  const rows = sortedResults.map(result => {
    const subject = termAsMarkdown(result.subject, basePath)
    const predicate = termAsMarkdown(result.predicate, basePath)
    const object = termAsMarkdown(result.object, basePath)
    
    // Omit subject if it's the same as previous row (for decluttering)
    const displaySubject = subject === previousSubject ? '' : escape(subject)
    previousSubject = subject
    
    return `| ${displaySubject} | ${escape(predicate)} | ${escape(object)} |`
  })

  const titleSection = title ? `# ${title}\n\n` : ''
  return `${titleSection}${[header, divider, ...rows].join('\n')}`
}
