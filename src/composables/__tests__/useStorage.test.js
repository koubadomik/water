// @vitest-environment jsdom
import { describe, test, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'

beforeEach(() => localStorage.clear())

describe('useStorage', () => {
  test('returns default when key missing', () => {
    const { useStorage } = require('../useStorage.js')
    const val = useStorage('fresh-key-1', 42)
    expect(val.value).toBe(42)
  })

  test('reads existing value from localStorage', () => {
    localStorage.setItem('existing-key', JSON.stringify(99))
    const { useStorage } = require('../useStorage.js')
    const val = useStorage('existing-key', 0)
    expect(val.value).toBe(99)
  })

  test('persists writes to localStorage', async () => {
    const { useStorage } = require('../useStorage.js')
    const val = useStorage('write-key', [])
    val.value = [1, 2, 3]
    await nextTick()
    expect(JSON.parse(localStorage.getItem('write-key'))).toEqual([1, 2, 3])
  })
})
