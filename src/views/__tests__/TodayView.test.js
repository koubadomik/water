// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, test, expect, beforeEach, vi } from 'vitest'
import { dayStr, addDays } from '../../lib/scheduler.js'

const SAMPLE = `1. Q ①?

Odpověď:

① Alpha

Zj 15:1-8

:1 sedm ( ① posledních ran ) konec.`

beforeEach(() => localStorage.clear())

// Progress is recorded per training set, so entries are keyed "<setId>::<itemId>".
function scheduleFor(itemId) {
  const stored = JSON.parse(localStorage.getItem('reviewSchedule_v1') ?? '{}')
  // Prefer the set-scoped record; the bare key is the pre-sets fallback.
  const key = Object.keys(stored).find((k) => k.endsWith(`::${itemId}`)) ?? itemId
  return stored[key]
}

async function mountToday({ sets = [], verses = null, settings = null, train = true } = {}) {
  if (verses) localStorage.setItem('verses_v2', JSON.stringify(verses))
  if (settings) localStorage.setItem('routineSettings_v1', JSON.stringify(settings))
  vi.resetModules()
  const { useStudySets } = await import('../../composables/useStudySets.js')
  for (const raw of sets) useStudySets().addSet(raw)
  const { useTrainingSets } = await import('../../composables/useTrainingSets.js')
  const { useQueue } = await import('../../composables/useQueue.js')
  const q = useQueue()
  // Today trains the current set, so tests must define one.
  if (train) {
    useTrainingSets().startSet('Test set', q.allItems.value.map((i) => i.id))
    q.replan()
  }
  const TodayView = (await import('../TodayView.vue')).default
  return mount(TodayView)
}

async function beginVerseRecall(wrapper) {
  await wrapper.find('[data-testid="today-item"]').trigger('click')
  await wrapper.find('[data-testid="scaffold-continue"]').trigger('click')
}

describe('TodayView', () => {
  test('offers the set picker when nothing is being trained', async () => {
    const w = await mountToday({ train: false })
    expect(w.find('[data-testid="set-picker"]').exists()).toBe(true)
    expect(w.find('[data-testid="start-set"]').exists()).toBe(true)
  })

  test('the picker can be opened to switch away from the current set', async () => {
    const w = await mountToday({ sets: [SAMPLE], settings: { minutes: 60, newPerDay: 10 } })
    expect(w.find('[data-testid="set-picker"]').exists()).toBe(false)
    await w.find('[data-testid="change-set"]').trigger('click')
    expect(w.find('[data-testid="set-picker"]').exists()).toBe(true)
  })

  test('names the set being trained', async () => {
    const w = await mountToday({ sets: [SAMPLE], settings: { minutes: 60, newPerDay: 10 } })
    expect(w.find('[data-testid="current-set"]').text()).toContain('Test set')
  })

  test('lists one item per question and one for the passage', async () => {
    const w = await mountToday({ sets: [SAMPLE], settings: { minutes: 60, newPerDay: 10 } })
    const labels = w.findAll('[data-testid="today-item"]').map((n) => n.text())
    expect(labels).toHaveLength(2)
    expect(labels.join(' ')).toContain('question')
    expect(labels.join(' ')).toContain('passage')
  })

  test('mixes verses and set items into one list', async () => {
    const w = await mountToday({
      sets: [SAMPLE],
      verses: [{ ref: 'John 3:16', text: 'For God so loved', rung: 0, due: dayStr(), lapses: 0 }],
      settings: { minutes: 60, newPerDay: 10 },
    })
    expect(w.findAll('[data-testid="today-item"]')).toHaveLength(3)
    expect(w.text()).toContain('John 3:16')
  })

  test('keeps memory status in verse details instead of review groups', async () => {
    const w = await mountToday({
      sets: [SAMPLE],
      verses: [{ ref: 'John 3:16', text: 'x', rung: 2, due: addDays(-2), lapses: 0 }],
      settings: { minutes: 60, newPerDay: 10 },
    })
    await w.find('[data-testid="verse-detail"]').trigger('click')
    expect(w.text()).toContain('Memory status')
    expect(w.text()).toContain('Known')
    expect(w.text()).not.toContain('Review')
  })

  test('a known verse can be marked as learning again from the list', async () => {
    const w = await mountToday({
      verses: [{ ref: 'John 3:16', text: 'x', rung: 2, due: addDays(-2), lapses: 0 }],
      settings: { minutes: 60, newPerDay: 10 },
    })

    await w.find('[data-testid="verse-detail"]').trigger('click')
    await w.find('[data-testid="mark-learning"]').trigger('click')
    expect(w.text()).toContain('Learning')
    await w.find('[data-testid="detail-back"]').trigger('click')
    expect(w.find('[data-testid="today-item"]').attributes('disabled')).toBeUndefined()
  })

  test('keeps the daily list free of time budgets and new/review sections', async () => {
    const w = await mountToday({
      verses: Array.from({ length: 30 }, (_, i) => ({
        ref: `Ref ${i}`,
        text: 'x',
        rung: 1,
        due: dayStr(),
        lapses: 0,
      })),
      settings: { minutes: 5, newPerDay: 0 },
    })
    expect(w.findAll('[data-testid="today-item"]')).toHaveLength(30)
    expect(w.find('[data-testid="today-budget"]').exists()).toBe(false)
    expect(w.find('[data-testid="minutes-select"]').exists()).toBe(false)
    expect(w.text()).not.toContain('New')
  })

  test('opening a verse starts a warm-up before full recall', async () => {
    const w = await mountToday({
      verses: [{ ref: 'John 3:16', text: 'For God so loved', rung: 0, due: dayStr(), lapses: 0 }],
      settings: { minutes: 60, newPerDay: 10 },
    })
    await w.find('[data-testid="today-item"]').trigger('click')
    expect(w.find('[data-testid="scaffold-continue"]').exists()).toBe(true)
    expect(w.find('[data-testid="verse-input"]').exists()).toBe(false)

    await w.find('[data-testid="scaffold-continue"]').trigger('click')
    expect(w.find('[data-testid="verse-input"]').exists()).toBe(true)
  })

  test('a verse recalled word perfect grades itself and checks off', async () => {
    const w = await mountToday({
      verses: [{ ref: 'John 3:16', text: 'For God so loved', rung: 0, due: dayStr(), lapses: 0 }],
      settings: { minutes: 60, newPerDay: 10 },
    })
    await beginVerseRecall(w)
    await w.find('[data-testid="verse-input"]').setValue('For God so loved')
    await w.find('[data-testid="verse-submit"]').trigger('click')
    expect(w.find('[data-testid="verse-verdict"]').text()).toBe('Word perfect')

    await w.find('[data-testid="verse-next"]').trigger('click')
    expect(w.find('[data-testid="today-item"]').classes()).toContain('done')
  })

  test('giving up on a verse grades it lost', async () => {
    const w = await mountToday({
      verses: [{ ref: 'John 3:16', text: 'For God so loved', rung: 0, due: dayStr(), lapses: 0 }],
      settings: { minutes: 60, newPerDay: 10 },
    })
    await beginVerseRecall(w)
    await w.find('[data-testid="verse-give-up"]').trigger('click')
    expect(w.find('[data-testid="verse-verdict"]').text()).toBe('Not yet')
    await w.find('[data-testid="verse-next"]').trigger('click')

    // Missing a recall starts another scaffold; a verse is not marked done
    // until it is written correctly by heart.
    expect(w.find('[data-testid="scaffold-continue"]').exists()).toBe(true)
    expect(scheduleFor('verse:John 3:16').lastResult).not.toBe('lost')

    await w.find('[data-testid="scaffold-continue"]').trigger('click')
    await w.find('[data-testid="verse-input"]').setValue('For God so loved')
    await w.find('[data-testid="verse-submit"]').trigger('click')
    await w.find('[data-testid="verse-next"]').trigger('click')

    expect(scheduleFor('verse:John 3:16').lastResult).toBe('got')
  })

  test('a question asks you to self-assess, since only you can', async () => {
    const w = await mountToday({ sets: [SAMPLE], settings: { minutes: 60, newPerDay: 10 } })
    const question = w.findAll('[data-testid="today-item"]').find((n) => n.text().includes('question'))
    await question.trigger('click')

    expect(w.find('[data-testid="assess-got"]').exists()).toBe(false)
    await w.findAll('button').find((b) => b.text() === 'Reveal all').trigger('click')
    await w.find('[data-testid="assess-got"]').trigger('click')

    expect(w.find('[data-testid="today-item"]').classes()).toContain('done')
  })

  test('a cloze cannot be finished until every blank is resolved', async () => {
    const w = await mountToday({ sets: [SAMPLE], settings: { minutes: 60, newPerDay: 10 } })
    const cloze = w.findAll('[data-testid="today-item"]').find((n) => n.text().includes('passage'))
    await cloze.trigger('click')

    expect(w.find('[data-testid="cloze-finish"]').attributes('disabled')).toBeDefined()
    await w.find('[data-testid="cloze-blank"]').trigger('click')
    expect(w.find('[data-testid="cloze-finish"]').attributes('disabled')).toBeUndefined()
  })

  test('a cloze grades itself from its own result', async () => {
    const w = await mountToday({ sets: [SAMPLE], settings: { minutes: 60, newPerDay: 10 } })
    const cloze = w.findAll('[data-testid="today-item"]').find((n) => n.text().includes('passage'))
    await cloze.trigger('click')

    // Revealed rather than recalled, so this is not a pass.
    await w.find('[data-testid="cloze-blank"]').trigger('click')
    await w.find('[data-testid="cloze-finish"]').trigger('click')

    const schedule = JSON.parse(localStorage.getItem('reviewSchedule_v1'))
    const key = Object.keys(schedule).find((k) => k.endsWith(':cloze'))
    expect(schedule[key].lastResult).toBe('lost')
  })

  test('leaving an item without answering keeps it on the list', async () => {
    const w = await mountToday({
      verses: [{ ref: 'John 3:16', text: 'x', rung: 0, due: dayStr(), lapses: 0 }],
      settings: { minutes: 60, newPerDay: 10 },
    })
    await w.find('[data-testid="today-item"]').trigger('click')
    await w.find('[data-testid="run-back"]').trigger('click')
    expect(w.find('[data-testid="today-item"]').classes()).not.toContain('done')
  })
})

describe('training past the daily budget', () => {
  const manyVerses = Array.from({ length: 30 }, (_, i) => ({
    ref: `Ref ${i}`,
    text: 'x',
    rung: 1,
    due: dayStr(),
    lapses: 0,
  }))

  test('the day can be extended when you want to keep going', async () => {
    localStorage.setItem('verses_v2', JSON.stringify(manyVerses))
    localStorage.setItem('routineSettings_v1', JSON.stringify({ minutes: 5, newPerDay: 0 }))
    vi.resetModules()
    const { useTrainingSets } = await import('../../composables/useTrainingSets.js')
    const { useQueue } = await import('../../composables/useQueue.js')
    const q = useQueue()
    useTrainingSets().startSet('All', q.allItems.value.map((i) => i.id))
    q.replan()

    const first = q.today.value.items.length
    expect(first).toBeLessThan(30)
    expect(q.moreAvailable.value).toBeGreaterThan(0)

    const added = q.extendPlan()
    expect(added).toBeGreaterThan(0)
    expect(q.today.value.items.length).toBeGreaterThan(first)
  })

  test('extending never repeats what is already planned', async () => {
    localStorage.setItem('verses_v2', JSON.stringify(manyVerses))
    localStorage.setItem('routineSettings_v1', JSON.stringify({ minutes: 5, newPerDay: 0 }))
    vi.resetModules()
    const { useTrainingSets } = await import('../../composables/useTrainingSets.js')
    const { useQueue } = await import('../../composables/useQueue.js')
    const q = useQueue()
    useTrainingSets().startSet('All', q.allItems.value.map((i) => i.id))
    q.replan()

    for (let i = 0; i < 10; i++) q.extendPlan()
    const ids = q.today.value.items.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toHaveLength(30)
    expect(q.moreAvailable.value).toBe(0)
    expect(q.extendPlan()).toBe(0)
  })

  test('raising the daily minutes widens the day', async () => {
    localStorage.setItem('verses_v2', JSON.stringify(manyVerses))
    localStorage.setItem('routineSettings_v1', JSON.stringify({ minutes: 5, newPerDay: 0 }))
    vi.resetModules()
    const { useTrainingSets } = await import('../../composables/useTrainingSets.js')
    const { useQueue } = await import('../../composables/useQueue.js')
    const q = useQueue()
    useTrainingSets().startSet('All', q.allItems.value.map((i) => i.id))
    q.replan()

    const before = q.today.value.items.length
    q.setSettings({ minutes: 60 })
    await nextTick()
    expect(q.today.value.items.length).toBeGreaterThan(before)
  })
})

describe('choosing and switching training sets from home', () => {
  const bible = { Zj: { chapters: [['a', 'b', 'c', 'd', 'e']] } }

  async function mountPicker({ trainingSets = null } = {}) {
    localStorage.setItem('bibleJSON', JSON.stringify(bible))
    if (trainingSets) localStorage.setItem('trainingSets_v1', JSON.stringify(trainingSets))
    vi.resetModules()
    const SetPicker = (await import('../../components/SetPicker.vue')).default
    return mount(SetPicker)
  }

  test('a range builds a set without ticking anything', async () => {
    const w = await mountPicker()
    await w.find('[data-testid="ref-input"]').setValue('Zj 1:1-5')
    expect(w.find('[data-testid="ref-preview"]').text()).toContain('5 verses')

    await w.find('[data-testid="ref-add"]').trigger('click')
    await nextTick()
    expect(w.find('[data-testid="pending-count"]').text()).toContain('5 verses')
    // The range names the set for you.
    expect(w.find('[data-testid="set-name"]').element.value).toBe('Zj 1:1–5')
  })

  test('starting records only what was gathered', async () => {
    const w = await mountPicker()
    await w.find('[data-testid="ref-input"]').setValue('Zj 1:2-3')
    await w.find('[data-testid="ref-add"]').trigger('click')
    await w.find('[data-testid="set-name"]').setValue('Zjevení 1')
    await w.find('[data-testid="start-set"]').trigger('click')
    await nextTick()

    const stored = JSON.parse(localStorage.getItem('trainingSets_v1'))
    const live = stored.filter((s) => !s.endedAt)
    expect(live).toHaveLength(1)
    expect(live[0].name).toBe('Zjevení 1')
    expect(live[0].itemIds.sort()).toEqual(['verse:Zj 1:2', 'verse:Zj 1:3'])
  })

  test('previous sets are offered to switch back to', async () => {
    const w = await mountPicker({
      trainingSets: [
        { id: 'a', name: 'Zjevení 14', itemIds: ['verse:Zj 1:1'], startedAt: '2026-01-01T00:00:00Z', endedAt: '2026-02-01T00:00:00Z' },
        { id: 'b', name: 'Zjevení 15', itemIds: ['verse:Zj 1:2'], startedAt: '2026-03-01T00:00:00Z', endedAt: null },
      ],
    })
    const labels = w.findAll('[data-testid="switch-set"]').map((n) => n.text())
    expect(labels.join(' ')).toContain('Zjevení 14')
    expect(labels.join(' ')).not.toContain('Zjevení 15')
  })

  test('an old training set can be deleted from the switcher', async () => {
    const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const w = await mountPicker({
      trainingSets: [
        { id: 'old', name: 'Old set', itemIds: ['verse:Zj 1:1'], startedAt: '2026-01-01T00:00:00Z', endedAt: '2026-02-01T00:00:00Z' },
        { id: 'current', name: 'Current set', itemIds: ['verse:Zj 1:2'], startedAt: '2026-03-01T00:00:00Z', endedAt: null },
      ],
    })

    await w.find('[data-testid="delete-set"]').trigger('click')
    expect(JSON.parse(localStorage.getItem('trainingSets_v1')).map((set) => set.id)).toEqual(['current'])
    confirmMock.mockRestore()
  })

  test('switching reopens the set itself, so its progress carries over', async () => {
    localStorage.setItem(
      'reviewSchedule_v1',
      JSON.stringify({ 'a::verse:Zj 1:1': { rung: 3, due: addDays(9), lapses: 0, lastResult: 'got', lastReviewed: '2026-01-05' } }),
    )
    const w = await mountPicker({
      trainingSets: [
        { id: 'a', name: 'Zjevení 14', itemIds: ['verse:Zj 1:1'], startedAt: '2026-01-01T00:00:00Z', endedAt: '2026-02-01T00:00:00Z' },
        { id: 'b', name: 'Zjevení 15', itemIds: ['verse:Zj 1:2'], startedAt: '2026-03-01T00:00:00Z', endedAt: null },
      ],
    })
    expect(w.find('[data-testid="switch-set"]').text()).toContain('1 of 1 seen')

    await w.find('[data-testid="switch-set"]').trigger('click')
    await nextTick()

    const stored = JSON.parse(localStorage.getItem('trainingSets_v1'))
    const live = stored.filter((s) => !s.endedAt)
    expect(live).toHaveLength(1)
    expect(live[0].id).toBe('a')
    // Same id means the recorded progress still applies.
    expect(JSON.parse(localStorage.getItem('reviewSchedule_v1'))['a::verse:Zj 1:1'].rung).toBe(3)
  })

  test('switching away and back does not reset progress', async () => {
    localStorage.setItem(
      'reviewSchedule_v1',
      JSON.stringify({ 'a::verse:Zj 1:1': { rung: 5, due: addDays(30), lapses: 0, lastResult: 'got', lastReviewed: '2026-01-05' } }),
    )
    const w = await mountPicker({
      trainingSets: [
        { id: 'a', name: 'A', itemIds: ['verse:Zj 1:1'], startedAt: '2026-01-01T00:00:00Z', endedAt: '2026-02-01T00:00:00Z' },
        { id: 'b', name: 'B', itemIds: ['verse:Zj 1:2'], startedAt: '2026-03-01T00:00:00Z', endedAt: null },
      ],
    })
    await w.find('[data-testid="switch-set"]').trigger('click')
    await nextTick()
    const after = JSON.parse(localStorage.getItem('reviewSchedule_v1'))['a::verse:Zj 1:1']
    expect(after.rung).toBe(5)
    expect(after.due).toBe(addDays(30))
  })
})
