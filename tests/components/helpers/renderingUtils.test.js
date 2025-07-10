import { describe, it, expect } from 'vitest'
import { getSpans } from '../../../src/components/helpers/renderingUtils.js'

describe('renderingUtils.js', () => {
  describe('getSpans function', () => {
    it('returns single text span when no links provided', () => {
      const result = getSpans('Simple text without links', [])
      expect(result).toEqual([
        { value: 'Simple text without links', type: 'text' }
      ])
    })

    it('returns single text span when links array is empty', () => {
      const result = getSpans('Text with [[NonExistentLink]]', [])
      expect(result).toEqual([
        { value: 'Text with [[NonExistentLink]]', type: 'text' }
      ])
    })

    it('parses single link at the beginning', () => {
      const result = getSpans('[[MyNote]] is a note', ['MyNote'])
      expect(result).toEqual([
        { value: 'MyNote', type: 'link' },
        { value: ' is a note', type: 'text' }
      ])
    })

    it('parses single link at the end', () => {
      const result = getSpans('Check out [[MyNote]]', ['MyNote'])
      expect(result).toEqual([
        { value: 'Check out ', type: 'text' },
        { value: 'MyNote', type: 'link' }
      ])
    })

    it('parses single link in the middle', () => {
      const result = getSpans('Text [[MyNote]] more text', ['MyNote'])
      expect(result).toEqual([
        { value: 'Text ', type: 'text' },
        { value: 'MyNote', type: 'link' },
        { value: ' more text', type: 'text' }
      ])
    })

    it('parses multiple links', () => {
      const result = getSpans('Start [[FirstNote]] middle [[SecondNote]] end', ['FirstNote', 'SecondNote'])
      expect(result).toEqual([
        { value: 'Start ', type: 'text' },
        { value: 'FirstNote', type: 'link' },
        { value: ' middle ', type: 'text' },
        { value: 'SecondNote', type: 'link' },
        { value: ' end', type: 'text' }
      ])
    })

    it('handles consecutive links', () => {
      const result = getSpans('[[FirstNote]][[SecondNote]]', ['FirstNote', 'SecondNote'])
      expect(result).toEqual([
        { value: 'FirstNote', type: 'link' },
        { value: 'SecondNote', type: 'link' }
      ])
    })

    it('handles links with spaces in names', () => {
      const result = getSpans('Check [[My Long Note Name]]', ['My Long Note Name'])
      expect(result).toEqual([
        { value: 'Check ', type: 'text' },
        { value: 'My Long Note Name', type: 'link' }
      ])
    })

    it('ignores links not in the provided links array', () => {
      const result = getSpans('[[KnownNote]] and [[UnknownNote]]', ['KnownNote'])
      expect(result).toEqual([
        { value: 'KnownNote', type: 'link' },
        { value: ' and [[UnknownNote]]', type: 'text' }
      ])
    })

    it('handles duplicate links', () => {
      const result = getSpans('[[Note]] and [[Note]] again', ['Note'])
      expect(result).toEqual([
        { value: 'Note', type: 'link' },
        { value: ' and ', type: 'text' },
        { value: 'Note', type: 'link' },
        { value: ' again', type: 'text' }
      ])
    })

    it('handles empty text', () => {
      const result = getSpans('', ['SomeLink'])
      expect(result).toEqual([])
    })

    it('handles text with only a link', () => {
      const result = getSpans('[[OnlyLink]]', ['OnlyLink'])
      expect(result).toEqual([
        { value: 'OnlyLink', type: 'link' }
      ])
    })

    it('handles malformed brackets', () => {
      const result = getSpans('[[Incomplete link] and [another]]', ['Incomplete link'])
      expect(result).toEqual([
        { value: '[[Incomplete link] and [another]]', type: 'text' }
      ])
    })

    it('handles special characters in link names', () => {
      const result = getSpans('Check [[Note-with-dashes_and_underscores]]', ['Note-with-dashes_and_underscores'])
      expect(result).toEqual([
        { value: 'Check ', type: 'text' },
        { value: 'Note-with-dashes_and_underscores', type: 'link' }
      ])
    })

    it('handles links with numbers', () => {
      const result = getSpans('See [[Note 123]] and [[456 Another]]', ['Note 123', '456 Another'])
      expect(result).toEqual([
        { value: 'See ', type: 'text' },
        { value: 'Note 123', type: 'link' },
        { value: ' and ', type: 'text' },
        { value: '456 Another', type: 'link' }
      ])
    })

    it('handles complex text with multiple patterns', () => {
      const text = 'Introduction to [[Data Structures]] and [[Algorithms]]. See also [[Big O Notation]] for complexity analysis.'
      const links = ['Data Structures', 'Algorithms', 'Big O Notation']
      const result = getSpans(text, links)
      
      expect(result).toEqual([
        { value: 'Introduction to ', type: 'text' },
        { value: 'Data Structures', type: 'link' },
        { value: ' and ', type: 'text' },
        { value: 'Algorithms', type: 'link' },
        { value: '. See also ', type: 'text' },
        { value: 'Big O Notation', type: 'link' },
        { value: ' for complexity analysis.', type: 'text' }
      ])
    })
  })
})