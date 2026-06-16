import { describe, test, expect } from 'vitest'
import { useSession } from '../useSession.js'

describe('useSession', () => {
  test('starts at palace-walk phase', () => {
    const { phase } = useSession()
    expect(phase.value).toBe('palace-walk')
  })

  test('advance moves from palace-walk to random-review', () => {
    const { phase, advance } = useSession()
    advance()
    expect(phase.value).toBe('random-review')
  })

  test('advance moves from random-review to new-verse-drill', () => {
    const { phase, advance } = useSession()
    advance()
    advance()
    expect(phase.value).toBe('new-verse-drill')
  })

  test('advance moves from new-verse-drill to celebration', () => {
    const { phase, advance } = useSession()
    advance()
    advance()
    advance()
    expect(phase.value).toBe('celebration')
  })

  test('xp starts at 0', () => {
    const { xp } = useSession()
    expect(xp.value).toBe(0)
  })

  test('addXp increases xp', () => {
    const { xp, addXp } = useSession()
    addXp(10)
    expect(xp.value).toBe(10)
  })
})
