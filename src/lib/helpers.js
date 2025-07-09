/**
 * Gets text for yaml, heading, paragraph etc.
 * @param obsidianRawData
 * @param filter
 */

function getSections (obsidianRawData, filter) {
  if (!filter) {
    filter = _ => true
  }
  if (!obsidianRawData.metadata.sections) {
    return []
  }
  return obsidianRawData.metadata.sections
    .filter(filter)
    .map((current) =>
      obsidianRawData.text?.substring(current.position.start.offset,
        current.position.end.offset)
    )
}

// function applyToText(data, fn) {
//   const textChunks = getSections(data, (section) => section.type !== 'code')
//   let result = []
//   for (const chunk of textChunks) {
//     for (const current of fn(chunk)) {
//       if (current) {
//         result.push(current)
//       }
//     }
//   }
//   return result;
// }

export { getSections }
