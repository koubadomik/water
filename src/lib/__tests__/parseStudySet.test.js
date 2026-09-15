import { describe, test, expect } from 'vitest'
import { parseStudySet, splitBlanks, markerNumber, markersIn } from '../parseStudySet.js'

const SAMPLE = `1. First question ①, then another part ②?

Answer:

① First answer

② Second answer

Sample 1:1-2

:1 A sample line has ( ① one hidden phrase ) and ( ② another phrase ).

:2 A plain sample line.`

const MULTI_QUESTION = `1. First question ①?

Odpověď> ① One answer

2. Second question ①?

Odpověď > ① Another answer

Sample 2:1

:1 Text with (① a blank).`

describe('markers', () => {
  test('maps circled digits to their number', () => {
    expect(markerNumber('①')).toBe(1)
    expect(markerNumber('⑩')).toBe(10)
    expect(markerNumber('⑳')).toBe(20)
  })

  test('finds distinct markers', () => {
    expect(markersIn('a ① b ② c ③?')).toEqual(['①', '②', '③'])
  })
})

describe('splitBlanks', () => {
  test('splits a line around hidden phrases', () => {
    expect(splitBlanks('before ( ① hidden ) after')).toEqual([
      { type: 'text', value: 'before ' },
      { type: 'blank', marker: '①', value: 'hidden' },
      { type: 'text', value: ' after' },
    ])
  })

  test('keeps punctuation after a blank', () => {
    const segments = splitBlanks('before (① hidden): after')
    expect(segments.at(-1)).toEqual({ type: 'text', value: ': after' })
  })
})

describe('parseStudySet', () => {
  test('reads a question, answers, passage and blanks', () => {
    const set = parseStudySet(SAMPLE)
    expect(set.title).toBe('Sample 1:1-2')
    expect(set.cards).toHaveLength(1)
    expect(set.cards[0].markers).toEqual(['①', '②'])
    expect(set.cards[0].answers).toEqual([
      { marker: '①', text: 'First answer' },
      { marker: '②', text: 'Second answer' },
    ])
    expect(set.passage.verses.map((verse) => verse.n)).toEqual([1, 2])
    expect(set.blankCount).toBe(2)
  })

  test('accepts answer heading variations and multiple questions', () => {
    const set = parseStudySet(MULTI_QUESTION)
    expect(set.cards.map((card) => card.number)).toEqual([1, 2])
    expect(set.cards[0].answers[0].text).toBe('One answer')
    expect(set.cards[1].answers[0].text).toBe('Another answer')
  })

  test.each(['Odpověď:', 'Odpověď :', 'Odpověď>', 'Odpověď >', 'Odpověď', 'odpoved:', 'Answer:', 'O>'])(
    'accepts %s headings',
    (heading) => {
      const set = parseStudySet(`1. Question ①?\n\n${heading}\n\n① Alpha\n\n② Beta`)
      expect(set.cards[0].answers).toEqual([
        { marker: '①', text: 'Alpha' },
        { marker: '②', text: 'Beta' },
      ])
    },
  )

  test('joins wrapped answers and verses', () => {
    const set = parseStudySet('1. Question?\n\nAnswer:\n\n① first part\nsecond part\n\nSample 3\n\n:1 start\ncontinued')
    expect(set.cards[0].answers[0].text).toBe('first part second part')
    expect(set.passage.verses[0].raw).toBe('start continued')
  })

  test('accepts empty input', () => {
    expect(parseStudySet('')).toMatchObject({ cards: [], passage: null, blankCount: 0 })
  })
})
