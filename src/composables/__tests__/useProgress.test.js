// @vitest-environment jsdom
import { describe, test, expect, beforeEach } from 'vitest'

beforeEach(() => localStorage.clear())

describe('useProgress', () => {
  test('xp starts at 0 with empty localStorage', () => {
    const { useProgress } = require('../useProgress.js')
    const { xp } = useProgress()
    expect(xp.value).toBe(0)
  })

  test('addXp increases xp value', () => {
    const { useProgress } = require('../useProgress.js')
    const { xp, addXp } = useProgress()
    const before = xp.value
    addXp(30)
    expect(xp.value).toBe(before + 30)
  })

  test('completeSession sets a positive streak', () => {
    const { useProgress } = require('../useProgress.js')
    const { streak, completeSession } = useProgress()
    completeSession(10)
    expect(streak.value).toBeGreaterThanOrEqual(1)
  })

  test('completeSession adds xp', () => {
    const { useProgress } = require('../useProgress.js')
    const { xp, completeSession } = useProgress()
    const before = xp.value
    completeSession(50)
    expect(xp.value).toBe(before + 50)
  })
})
