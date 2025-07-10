// Helper to create mock Term objects for testing
export function createNamedNode(value) {
  return {
    termType: 'NamedNode',
    value: value
  }
}

export function createLiteral(value, datatype = 'http://www.w3.org/2001/XMLSchema#string') {
  return {
    termType: 'Literal',
    value: value,
    datatype: {
      termType: 'NamedNode',
      value: datatype
    }
  }
}

export function createBlankNode(value) {
  return {
    termType: 'BlankNode',
    value: value
  }
}