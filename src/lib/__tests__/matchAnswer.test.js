import { describe, test, expect } from 'vitest'
import { normalizeAnswer, answersMatch, levenshtein, tolerance } from '../matchAnswer.js'

describe('normalizeAnswer', () => {
  test('lowercases and collapses whitespace', () => {
    expect(normalizeAnswer('  Posledních   RAN ')).toBe('posledních ran')
  })

  test('drops punctuation and Czech quote marks', () => {
    expect(normalizeAnswer('„svatyně stánku svědectví“,')).toBe('svatyně stánku svědectví')
  })

  test('keeps diacritics', () => {
    expect(normalizeAnswer('zvítězili')).toBe('zvítězili')
  })

  test('composes decomposed diacritics to a single form', () => {
    const word = 'posledních'
    expect(normalizeAnswer(word.normalize('NFD'))).toBe(normalizeAnswer(word.normalize('NFC')))
  })
})

describe('levenshtein', () => {
  test('is zero for identical strings', () => {
    expect(levenshtein('abc', 'abc')).toBe(0)
  })

  test('counts single edits', () => {
    expect(levenshtein('kot', 'kat')).toBe(1)
    expect(levenshtein('ran', 'rana')).toBe(1)
  })

  test('handles an empty side', () => {
    expect(levenshtein('', 'ran')).toBe(3)
  })
})

describe('answersMatch', () => {
  test('accepts an exact answer', () => {
    expect(answersMatch('posledních ran', 'posledních ran')).toBe(true)
  })

  test('accepts differing case and punctuation', () => {
    expect(answersMatch('Posledních ran.', 'posledních ran')).toBe(true)
  })

  test('accepts dead-key typed Czech against pasted scripture', () => {
    const expected = 'jiné veliké a podivuhodné znamení'
    expect(answersMatch(expected.normalize('NFD'), expected.normalize('NFC'))).toBe(true)
    expect(answersMatch('posledních ran'.normalize('NFD'), 'posledních ran')).toBe(true)
  })

  test('forgives one typo in a long phrase', () => {
    expect(answersMatch('jiné veliké a podivuhodné znameni', 'jiné veliké a podivuhodné znamení')).toBe(true)
  })

  test('rejects a missing diacritic in a short phrase', () => {
    // "posledních ran" is 14 chars → tolerance 1, so this stays a near-miss
    // but a wholly different word must fail.
    expect(answersMatch('poslední den', 'posledních ran')).toBe(false)
  })

  test('rejects an empty answer', () => {
    expect(answersMatch('', 'posledních ran')).toBe(false)
    expect(answersMatch('   ', 'posledních ran')).toBe(false)
  })

  test('rejects a wrong answer of similar length', () => {
    expect(answersMatch('sedm zlatých mečů', 'sedm zlatých misek')).toBe(false)
  })

  test('tolerance scales with phrase length', () => {
    expect(tolerance('ran')).toBe(0)
    expect(tolerance('jiné veliké a podivuhodné znamení')).toBeGreaterThanOrEqual(2)
  })
})
