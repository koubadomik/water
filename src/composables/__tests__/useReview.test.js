// @vitest-environment jsdom
import { describe, test, expect, beforeEach, vi } from 'vitest'
import { migrateFromPath, dayStr, LADDER } from '../useReview.js'

beforeEach(() => localStorage.clear())

function daysFromNow(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return dayStr(d)
}

describe('migrateFromPath', () => {
  test('collapses the 3x repeated path nodes into one row per verse', () => {
    const path = [
      { ref: 'John 3:16', text: 'For God so loved', book: 'John', chapter: 3, verseIdx: 15, lessonIndex: 0 },
      { ref: 'John 3:16', text: 'For God so loved', book: 'John', chapter: 3, verseIdx: 15, lessonIndex: 1 },
      { ref: 'John 3:16', text: 'For God so loved', book: 'John', chapter: 3, verseIdx: 15, lessonIndex: 2 },
      { ref: 'John 3:17', text: 'For God sent not', book: 'John', chapter: 3, verseIdx: 16, lessonIndex: 0 },
    ]
    const result = migrateFromPath(path)
    expect(result).toHaveLength(2)
    expect(result.map((v) => v.ref)).toEqual(['John 3:16', 'John 3:17'])
  })

  test('preserves the verse identity fields needed to look up notes', () => {
    const result = migrateFromPath([
      { ref: 'John 3:16', text: 'For God so loved', book: 'John', chapter: 3, verseIdx: 15 },
    ])
    expect(result[0]).toMatchObject({ text: 'For God so loved', book: 'John', chapter: 3, verseIdx: 15 })
  })

  test('an undrilled verse is due today at the bottom rung', () => {
    const result = migrateFromPath([{ ref: 'John 3:16', text: 'x' }])
    expect(result[0].rung).toBe(0)
    expect(result[0].due).toBe(dayStr())
  })

  test('credits one rung per completed repetition', () => {
    const twoOfThree = [
      { ref: 'John 3:16', text: 'x', drilledAt: '2026-07-01T00:00:00Z' },
      { ref: 'John 3:16', text: 'x', drilledAt: '2026-07-02T00:00:00Z' },
      { ref: 'John 3:16', text: 'x' },
    ]
    const result = migrateFromPath(twoOfThree)
    expect(result[0].rung).toBe(1)
    expect(result[0].due).toBe(daysFromNow(LADDER[1]))
  })

  test('survives junk input', () => {
    expect(migrateFromPath(null)).toEqual([])
    expect(migrateFromPath([null, {}, { ref: 'A' }])).toHaveLength(1)
  })
})

describe('useReview scheduling', () => {
  // The module holds a singleton, so reset the registry to get a clean one.
  async function fresh() {
    localStorage.setItem(
      'verses_v2',
      JSON.stringify([
        { ref: 'A', text: 'a', rung: 0, due: dayStr(), lapses: 0, lastResult: null },
        { ref: 'B', text: 'b', rung: 3, due: daysFromNow(5), lapses: 0, lastResult: null },
      ]),
    )
    vi.resetModules()
    const mod = await import('../useReview.js')
    return mod.useReview()
  }

  test('due lists only verses at or past their date', async () => {
    const { due } = await fresh()
    expect(due.value.map((v) => v.ref)).toEqual(['A'])
  })

  test('got it climbs a rung and pushes the date out', async () => {
    const { verses, grade } = await fresh()
    grade('A', 'got')
    const a = verses.value.find((v) => v.ref === 'A')
    expect(a.rung).toBe(1)
    expect(a.due).toBe(daysFromNow(LADDER[1]))
  })

  test('shaky holds the rung and asks again at that rung', async () => {
    const { verses, grade } = await fresh()
    grade('B', 'shaky')
    const b = verses.value.find((v) => v.ref === 'B')
    expect(b.rung).toBe(3)
    expect(b.due).toBe(daysFromNow(LADDER[3]))
  })

  test('lost it drops to the bottom and counts a lapse', async () => {
    const { verses, grade } = await fresh()
    grade('B', 'lost')
    const b = verses.value.find((v) => v.ref === 'B')
    expect(b.rung).toBe(0)
    expect(b.lapses).toBe(1)
    expect(b.due).toBe(daysFromNow(LADDER[0]))
  })

  test('a long-held verse stops climbing at the top rung', async () => {
    const { verses, grade } = await fresh()
    for (let i = 0; i < 20; i++) grade('A', 'got')
    const a = verses.value.find((v) => v.ref === 'A')
    expect(a.rung).toBe(LADDER.length - 1)
    expect(a.due).toBe(daysFromNow(LADDER[LADDER.length - 1]))
  })

  test('addVerse ignores a duplicate ref', async () => {
    const { verses, addVerse } = await fresh()
    addVerse({ ref: 'A', text: 'a again' })
    expect(verses.value.filter((v) => v.ref === 'A')).toHaveLength(1)
  })
})
