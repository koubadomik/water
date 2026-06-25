// @vitest-environment jsdom
import { describe, test, expect, beforeEach } from 'vitest'

beforeEach(() => localStorage.clear())

describe('useHistory', () => {
  test('starts empty', () => {
    const { useHistory } = require('../useHistory.js')
    const { history, clearHistory } = useHistory()
    clearHistory()
    expect(history.value).toEqual([])
  })

  test('saveCompletedPath stores an entry with correct shape', () => {
    const { useHistory } = require('../useHistory.js')
    const { history, saveCompletedPath, clearHistory } = useHistory()
    clearHistory()
    const meta = { book: 'John', chapter: 3, startVerse: 16, endVerse: 16 }
    const verses = [{ ref: 'John 3:16', text: 'For God so loved the world' }]
    saveCompletedPath(meta, verses, 50)
    expect(history.value.length).toBe(1)
    expect(history.value[0].label).toBe('John 3:16')
    expect(history.value[0].xpEarned).toBe(50)
    expect(history.value[0].verses).toEqual(verses)
    expect(history.value[0].id).toBeTypeOf('number')
    expect(history.value[0].completedAt).toBeTypeOf('string')
  })

  test('saveCompletedPath prepends newer entries first', () => {
    const { useHistory } = require('../useHistory.js')
    const { history, saveCompletedPath, clearHistory } = useHistory()
    clearHistory()
    saveCompletedPath({ book: 'John', chapter: 3, startVerse: 1, endVerse: 1 }, [], 0)
    saveCompletedPath({ book: 'Mark', chapter: 1, startVerse: 1, endVerse: 1 }, [], 0)
    expect(history.value[0].label).toBe('Mark 1:1')
    expect(history.value[1].label).toBe('John 3:1')
  })

  test('clearHistory empties the list', () => {
    const { useHistory } = require('../useHistory.js')
    const { history, saveCompletedPath, clearHistory } = useHistory()
    clearHistory()
    saveCompletedPath({ book: 'Ps', chapter: 23, startVerse: 1, endVerse: 1 }, [], 0)
    clearHistory()
    expect(history.value).toEqual([])
  })

  test('removeHistory removes entry by id', () => {
    const { useHistory } = require('../useHistory.js')
    const { history, saveCompletedPath, removeHistory, clearHistory } = useHistory()
    clearHistory()
    saveCompletedPath({ book: 'John', chapter: 3, startVerse: 16, endVerse: 16 }, [], 0)
    const id = history.value[0].id
    removeHistory(id)
    expect(history.value.length).toBe(0)
  })

  test('label for single verse', () => {
    const { useHistory } = require('../useHistory.js')
    const { history, saveCompletedPath, clearHistory } = useHistory()
    clearHistory()
    saveCompletedPath({ book: 'Rom', chapter: 8, startVerse: 28, endVerse: 28 }, [], 0)
    expect(history.value[0].label).toBe('Rom 8:28')
  })

  test('label for verse range', () => {
    const { useHistory } = require('../useHistory.js')
    const { history, saveCompletedPath, clearHistory } = useHistory()
    clearHistory()
    saveCompletedPath({ book: 'Phil', chapter: 4, startVerse: 4, endVerse: 7 }, [], 0)
    expect(history.value[0].label).toBe('Phil 4:4–7')
  })
})
