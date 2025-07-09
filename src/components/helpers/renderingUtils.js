function splitTextLink (txt, links) {
  const includesLink = (txt) => {
    const match = links.filter((x) => (txt === `[[${x}]]` || txt.indexOf(`[[${x}]]`) > 0))
    return match.length > 0 ? match[0] : false
  }
  const match = includesLink(txt)
  if (match) {
    const pre = txt.substring(0, txt.indexOf(`[[${match}]]`))
    const result = []
    if (pre.length) {
      result.push({
        value: pre,
        type: 'text'
      })
    }
    result.push({
      value: match,
      type: 'link',
    })
    return [true, result]
  }
  return [false]
}

function getSpans (text, links) {

  let result = []
  let current = 0
  for (let i = 0; i < text.length; i++) {
    let chunk = text.substring(current, i)
    const [isMatch, matches] = splitTextLink(chunk, links)
    if (isMatch) {
      current = i
      result = [...result, ...matches]
    }
    if (i === text.length - 1) { // Add the last chunk
      const tail = text.substring(current, text.length)
      const [isMatch, matches] = splitTextLink(tail, links)
      if (isMatch) {
        result = [...result, ...matches]
      } else {
        result.push({
          value: tail,
          type: 'text'
        })
      }
    }
  }
  return result
}

export { getSpans }