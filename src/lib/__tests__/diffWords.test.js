import { describe, test, expect } from 'vitest'
import { diffWords } from '../diffWords.js'

const statuses = (d) => d.words.map((w) => `${w.value}:${w.status}`)

describe('diffWords', () => {
  test('marks every word ok for a perfect answer', () => {
    const d = diffWords('hidden phrase', 'hidden phrase')
    expect(statuses(d)).toEqual(['hidden:ok', 'phrase:ok'])
    expect(d.extra).toEqual([])
    expect(d.correct).toBe(2)
  })

  test('marks the words you did not have as missing', () => {
    const d = diffWords('veliké znamení', 'jiné veliké a podivuhodné znamení')
    expect(statuses(d)).toEqual([
      'jiné:missing',
      'veliké:ok',
      'a:missing',
      'podivuhodné:missing',
      'znamení:ok',
    ])
    expect(d.correct).toBe(2)
    expect(d.total).toBe(5)
  })

  test('reports words you typed that do not belong', () => {
    const d = diffWords('sedm zlatých mečů', 'sedm zlatých misek')
    expect(d.extra).toEqual(['mečů'])
    expect(statuses(d)).toEqual(['sedm:ok', 'zlatých:ok', 'misek:missing'])
    expect(d.correction).toEqual([
      { type: 'word', status: 'ok', value: 'sedm' },
      { type: 'word', status: 'ok', value: 'zlatých' },
      { type: 'word', status: 'replaced', value: 'misek', typed: 'mečů' },
    ])
  })

  test('keeps an inserted word beside the place it was inserted', () => {
    const d = diffWords('a very bright signal', 'a bright signal')
    expect(d.correction).toEqual([
      { type: 'word', status: 'ok', value: 'a' },
      { type: 'extra', value: 'very' },
      { type: 'word', status: 'ok', value: 'bright' },
      { type: 'word', status: 'ok', value: 'signal' },
    ])
  })

  test('ignores case and punctuation when matching words', () => {
    const d = diffWords('Hidden, PHRASE.', 'hidden phrase')
    expect(d.correct).toBe(2)
    expect(d.extra).toEqual([])
  })

  test('matches decomposed Czech against precomposed', () => {
    const expected = 'jiné veliké a podivuhodné znamení'
    const d = diffWords(expected.normalize('NFD'), expected.normalize('NFC'))
    expect(d.correct).toBe(5)
    expect(d.extra).toEqual([])
  })

  test('an untouched blank is all missing and flagged unattempted', () => {
    const d = diffWords('', 'hidden phrase')
    expect(statuses(d)).toEqual(['hidden:missing', 'phrase:missing'])
    expect(d.attempted).toBe(false)
    expect(d.correct).toBe(0)
  })

  test('whitespace-only input counts as unattempted', () => {
    expect(diffWords('   ', 'ran').attempted).toBe(false)
  })

  test('keeps word order when a word is repeated', () => {
    const d = diffWords('a b', 'a b a b')
    expect(d.correct).toBe(2)
    expect(d.extra).toEqual([])
  })

  test('preserves the original casing of the expected words', () => {
    const d = diffWords('pane', 'Pane Bože')
    expect(d.words[0].value).toBe('Pane')
    expect(d.words[0].status).toBe('ok')
  })
})
