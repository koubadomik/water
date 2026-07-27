import { describe, test, expect } from 'vitest'
import { resolveReference, parseReference, matchBook } from '../reference.js'

// Shaped like the real data: keyed by Czech abbreviation.
const bible = {
  Gn: { chapters: [['Na počátku', 'A země']] },
  J: { chapters: [[], [], ['Neboť tak Bůh miloval svět']] },
  '1J': { chapters: [['To co bylo od počátku']] },
  Zj: {
    chapters: [
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      ['Beránek stál', 'hlas z nebe', 'novou píseň', 'neposkvrnili', 'nebyla lež'],
    ],
  },
}

describe('matchBook', () => {
  test('matches an exact abbreviation', () => {
    expect(matchBook(bible, 'Zj')).toBe('Zj')
  })

  test('matches the full Czech name by its prefix', () => {
    expect(matchBook(bible, 'Zjevení')).toBe('Zj')
  })

  test('is case insensitive and ignores spaces', () => {
    expect(matchBook(bible, 'zj')).toBe('Zj')
    expect(matchBook(bible, '1 J')).toBe('1J')
  })

  test('prefers the longer key when both could match', () => {
    expect(matchBook(bible, '1Jan')).toBe('1J')
    expect(matchBook(bible, 'Jan')).toBe('J')
  })

  test('returns null for an unknown book', () => {
    expect(matchBook(bible, 'Zjv')).toBe(null)
    expect(matchBook(bible, '')).toBe(null)
  })
})

describe('parseReference', () => {
  test('reads book, chapter and a verse range', () => {
    expect(parseReference('Zj 14:1-5')).toEqual({ bookQuery: 'Zj', chapter: 14, from: 1, to: 5 })
  })

  test('accepts an en dash and spaces around it', () => {
    expect(parseReference('Zj 14:1 – 5')).toMatchObject({ from: 1, to: 5 })
  })

  test('accepts a dot instead of a colon', () => {
    expect(parseReference('Zj 14.1')).toMatchObject({ chapter: 14, from: 1 })
  })

  test('a chapter on its own leaves the verses open', () => {
    expect(parseReference('Zj 14')).toEqual({ bookQuery: 'Zj', chapter: 14, from: null, to: null })
  })

  test('rejects text with no chapter', () => {
    expect(parseReference('Zjevení')).toBe(null)
  })
})

describe('resolveReference', () => {
  test('expands a range into one entry per verse', () => {
    const r = resolveReference(bible, 'Zj 14:1-5')
    expect(r.ok).toBe(true)
    expect(r.verses).toHaveLength(5)
    expect(r.verses[0]).toEqual({
      ref: 'Zj 14:1',
      text: 'Beránek stál',
      book: 'Zj',
      chapter: 14,
      verseIdx: 0,
    })
  })

  test('the full book name resolves the same as the abbreviation', () => {
    expect(resolveReference(bible, 'Zjevení 14:1-5').verses).toEqual(
      resolveReference(bible, 'Zj 14:1-5').verses,
    )
  })

  test('a single verse yields one item', () => {
    const r = resolveReference(bible, 'Zj 14:3')
    expect(r.verses).toHaveLength(1)
    expect(r.label).toBe('Zj 14:3')
  })

  test('a bare chapter takes the whole chapter', () => {
    const r = resolveReference(bible, 'Zj 14')
    expect(r.verses).toHaveLength(5)
    expect(r.label).toBe('Zj 14:1–5')
  })

  test('a range running past the end is clamped', () => {
    const r = resolveReference(bible, 'Zj 14:3-99')
    expect(r.verses).toHaveLength(3)
    expect(r.label).toBe('Zj 14:3–5')
  })

  test('names the book that did not match', () => {
    expect(resolveReference(bible, 'Zjv 14:1')).toEqual({
      ok: false,
      error: 'No book matches “Zjv”',
    })
  })

  test('says how many chapters a book has', () => {
    expect(resolveReference(bible, 'Gn 5:1').error).toBe('Gn has 1 chapters')
  })

  test('says how many verses a chapter has', () => {
    expect(resolveReference(bible, 'Zj 14:99').error).toBe('Zj 14 has 5 verses')
  })

  test('gives a format hint for unparseable text', () => {
    expect(resolveReference(bible, 'hello').error).toContain('Zj 14:1-5')
  })

  test('empty input is not an error worth showing', () => {
    expect(resolveReference(bible, '  ')).toEqual({ ok: false, error: '' })
  })

  test('reports when the Bible has not loaded', () => {
    expect(resolveReference(null, 'Zj 14:1').error).toBe('Bible not loaded yet')
  })
})
