import { prefixes } from '../namespaces.js'

function shrink (uriStr) {

  for (const [namespace, prefix] of Object.entries(prefixes)) {
    if (uriStr.startsWith(namespace)) {
      return uriStr.replace(namespace, prefix)
    }
  }
  return uriStr
}

export { shrink }