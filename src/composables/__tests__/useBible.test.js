import { afterEach, describe, expect, test, vi } from 'vitest'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('useBible', () => {
  test('keeps downloaded Bible data when the mobile cache write is rejected', async () => {
    vi.resetModules()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ Genesis: { chapters: [['In the beginning']] } }),
    }))
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceededError') })

    const { useBible } = await import('../useBible.js')
    const state = useBible()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(state.bible.value).toHaveProperty('Genesis')
    expect(state.error.value).toBeNull()
  })
})
