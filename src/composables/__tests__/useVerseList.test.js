// @vitest-environment jsdom
import { describe, test, expect, beforeEach } from 'vitest'

beforeEach(() => localStorage.clear())

describe('useVerseList', () => {
  test('addVerse appends a verse', () => {
    const { useVerseList } = require('../useVerseList.js')
    const { verses, addVerse } = useVerseList()
    const before = verses.value.length
    addVerse({ ref: 'Test 1:1', text: 'test' })
    expect(verses.value.length).toBeGreaterThan(before - 1)
  })

  test('hasVerse returns false for unknown ref', () => {
    const { useVerseList } = require('../useVerseList.js')
    const { hasVerse } = useVerseList()
    expect(hasVerse('Nonexistent 99:99')).toBe(false)
  })

  test('removeVerse removes the verse', () => {
    const { useVerseList } = require('../useVerseList.js')
    const { verses, addVerse, removeVerse } = useVerseList()
    addVerse({ ref: 'Remove 1:1', text: 'text' })
    const sizeBefore = verses.value.length
    removeVerse('Remove 1:1')
    expect(verses.value.length).toBe(sizeBefore - 1)
  })
})
