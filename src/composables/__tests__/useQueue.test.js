// @vitest-environment jsdom
import { describe, test, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { seedFromVerses } from '../useQueue.js'
import { dayStr, addDays } from '../../lib/scheduler.js'

const SAMPLE = `1. Q ①?

Odpověď:

① Alpha

Zj 15:1-8

:1 sedm ( ① posledních ran ) konec.`

beforeEach(() => localStorage.clear())

// Both composables hold module singletons, so everything a test needs must be
// built inside one freshly reset registry or state leaks between tests.
async function freshWith({ sets = [], verses = null, train = true } = {}) {
  if (verses) localStorage.setItem('verses_v2', JSON.stringify(verses))
  vi.resetModules()
  const { useStudySets } = await import('../useStudySets.js')
  for (const raw of sets) useStudySets().addSet(raw)
  const { useTrainingSets } = await import('../useTrainingSets.js')
  const { useQueue } = await import('../useQueue.js')
  const q = useQueue()
  // Today draws from the current training set, so a test needs one.
  if (train) {
    useTrainingSets().startSet('Test set', q.allItems.value.map((i) => i.id))
    q.replan()
  }
  return q
}

describe('seedFromVerses', () => {
  test('carries existing verse progress onto queue ids', () => {
    const seeded = seedFromVerses([
      { ref: 'John 3:16', rung: 3, due: '2026-08-01', lapses: 2, lastResult: 'got' },
    ])
    expect(seeded['verse:John 3:16']).toMatchObject({ rung: 3, due: '2026-08-01', lapses: 2 })
  })

  test('skips verses that never had a schedule', () => {
    expect(seedFromVerses([{ ref: 'John 3:16' }])).toEqual({})
  })
})

describe('useQueue', () => {
  test('nothing is queued until a training set is defined', async () => {
    const q = await freshWith({ sets: [SAMPLE], train: false })
    expect(q.allItems.value.length).toBeGreaterThan(0)
    expect(q.items.value).toHaveLength(0)
    expect(q.today.value.items).toHaveLength(0)
  })

  test('only the current training set feeds the day', async () => {
    const q = await freshWith({ sets: [SAMPLE], train: false })
    const { useTrainingSets } = await import('../useTrainingSets.js')
    const only = q.allItems.value.filter((i) => i.kind === 'cloze').map((i) => i.id)
    useTrainingSets().startSet('Just the passage', only)
    q.replan()
    expect(q.items.value.map((i) => i.kind)).toEqual(['cloze'])
  })

  test('a pasted set contributes one item per question plus one for the passage', async () => {
    const { items } = await freshWith({ sets: [SAMPLE] })
    expect(items.value.map((i) => i.kind).sort()).toEqual(['cloze', 'question'])
  })

  test('verses and set items land in the same queue', async () => {
    const { items } = await freshWith({
      sets: [SAMPLE],
      verses: [{ ref: 'John 3:16', text: 'x', rung: 0, due: dayStr(), lapses: 0 }],
    })
    expect(items.value.map((i) => i.kind).sort()).toEqual(['cloze', 'question', 'verse'])
  })

  test('grading pushes an item out to a later date', async () => {
    const q = await freshWith({ sets: [SAMPLE] })
    const first = q.today.value.items[0]
    expect(first.isNew).toBe(true)

    q.grade(first.id, 'got')
    expect(q.isDoneToday(first.id)).toBe(true)
    expect(q.remaining.value.some((i) => i.id === first.id)).toBe(false)
  })

  test('a lost item comes back tomorrow, and that survives a reload', async () => {
    const q = await freshWith({ sets: [SAMPLE] })
    const first = q.today.value.items[0]
    q.grade(first.id, 'lost')
    await nextTick()
    const stored = JSON.parse(localStorage.getItem('reviewSchedule_v1'))
    const scoped = Object.keys(stored).find((k) => k.endsWith(`::${first.id}`))
    expect(stored[scoped].due).toBe(addDays(1))
  })

  test('verse knowledge follows the verse across training sets', async () => {
    const verses = [{ ref: 'John 3:16', text: 'x', rung: 0, due: dayStr(), lapses: 0 }]
    const q = await freshWith({ verses, train: false })
    const { useTrainingSets } = await import('../useTrainingSets.js')
    const ts = useTrainingSets()
    const ids = q.allItems.value.map((i) => i.id)

    ts.startSet('Set A', ids)
    q.replan()
    q.grade('verse:John 3:16', 'got')
    expect(q.isDoneToday('verse:John 3:16')).toBe(true)

    // A different set still knows this is the same verse.
    ts.startSet('Set B', ids)
    q.replan()
    expect(q.isDoneToday('verse:John 3:16')).toBe(true)
    expect(q.isKnown('verse:John 3:16')).toBe(true)

    q.markLearning('verse:John 3:16')
    expect(q.isKnown('verse:John 3:16')).toBe(false)
    expect(q.isDoneToday('verse:John 3:16')).toBe(false)
  })

  test('switching sets swaps the day rather than mixing them', async () => {
    const q = await freshWith({ sets: [SAMPLE], train: false })
    const { useTrainingSets } = await import('../useTrainingSets.js')
    const ts = useTrainingSets()
    const cloze = q.allItems.value.filter((i) => i.kind === 'cloze').map((i) => i.id)
    const question = q.allItems.value.filter((i) => i.kind === 'question').map((i) => i.id)

    ts.startSet('Passage only', cloze)
    q.replan()
    expect(q.today.value.items.map((i) => i.kind)).toEqual(['cloze'])

    ts.startSet('Questions only', question)
    q.replan()
    expect(q.today.value.items.map((i) => i.kind)).toEqual(['question'])
  })

  test('the daily budget is settable and shrinks the day', async () => {
    const q = await freshWith({
      verses: Array.from({ length: 30 }, (_, i) => ({
        ref: `Ref ${i}`,
        text: 'x',
        rung: 0,
        due: dayStr(),
        lapses: 0,
      })),
    })
    // The replan runs on a watcher, so it lands on the next tick.
    q.setSettings({ minutes: 5, newPerDay: 0 })
    await nextTick()
    expect(q.today.value.items.length).toBeLessThan(30)
    expect(q.today.value.heldBack).toBeGreaterThan(0)

    q.setSettings({ minutes: 60 })
    await nextTick()
    expect(q.today.value.items.length).toBe(30)
  })

  test('existing verse progress is seeded rather than reset', async () => {
    const q = await freshWith({
      verses: [{ ref: 'John 3:16', text: 'x', rung: 4, due: addDays(20), lapses: 1 }],
    })
    // Scheduled 20 days out, so it is neither new nor due.
    expect(q.today.value.items).toHaveLength(0)
    expect(q.today.value.freshTotal).toBe(0)
  })
})
