import { prefixes } from '../../namespaces.js'

/**
 * Shrink URIs for display purposes
 * @param {string} uri - URI to shrink
 * @returns {string} Shortened URI
 */
function shrink (uri) {
  if (typeof uri !== 'string') return uri

  for (const [namespace, prefix] of Object.entries(prefixes)) {
    if (uri.startsWith(namespace)) {
      return uri.replace(namespace, prefix)
    }
  }

  return uri
}

export { shrink }
