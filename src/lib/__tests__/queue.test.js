import { describe, test, expect } from 'vitest'
import { buildItems, selectToday, estimateSeconds, verseItemId, questionItemId, clozeItemId } from '../queue.js'
import { applyResult, initialSchedule, nextSchedule, dayStr, addDays, LADDER } from '../scheduler.js'

const verses = [
  { ref: 'Zjevení 15:5', text: 'Potom jsem uviděl…' },
  { ref: 'Zjevení 14:1', text: 'A uviděl jsem, hle…' },
]

const sets = [
  {
    id: 's1',
    title: 'Zj 15:1-8',
    cards: [
      { id: '1', number: 1, question: 'Q1', answers: [] },
      { id: '2', number: 2, question: 'Q2', answers: [] },
    ],
    passage: { ref: 'Zj 15:1-8', verses: [{ n: 1, segments: [] }] },
    blankCount: 10,
  },
]

describe('buildItems', () => {
  test('turns verses, questions and passages into one flat list', () => {
    const items = buildItems(verses, sets)
    expect(items.map((i) => i.kind)).toEqual(['verse', 'verse', 'question', 'question', 'cloze'])
  })

  test('gives every item a stable id derived from its source', () => {
    const items = buildItems(verses, sets)
    expect(items.map((i) => i.id)).toEqual([
      verseItemId('Zjevení 15:5'),
      verseItemId('Zjevení 14:1'),
      questionItemId('s1', '1'),
      questionItemId('s1', '2'),
      clozeItemId('s1'),
    ])
  })

  test('ids survive a set being re-parsed', () => {
    const before = buildItems([], sets).map((i) => i.id)
    const reparsed = [{ ...sets[0], title: 'Zjevení 15:1-8 (renamed)' }]
    expect(buildItems([], reparsed).map((i) => i.id)).toEqual(before)
  })

  test('labels say which question a card is', () => {
    const items = buildItems([], sets)
    expect(items[0].label).toBe('Zj 15:1-8 — question 1')
    expect(items[2].label).toBe('Zj 15:1-8 — passage')
  })

  test('a set with no passage contributes no cloze item', () => {
    const items = buildItems([], [{ ...sets[0], passage: null }])
    expect(items.some((i) => i.kind === 'cloze')).toBe(false)
  })

  test('ignores junk entries', () => {
    expect(buildItems([null, {}], [null, {}])).toEqual([])
  })
})

describe('estimateSeconds', () => {
  test('a new verse costs more than a review of one', () => {
    const v = { kind: 'verse' }
    expect(estimateSeconds(v, true)).toBeGreaterThan(estimateSeconds(v, false))
  })

  test('a cloze scales with how many blanks it has', () => {
    const few = { kind: 'cloze', blankCount: 3 }
    const many = { kind: 'cloze', blankCount: 14 }
    expect(estimateSeconds(many)).toBeGreaterThan(estimateSeconds(few))
  })

  test('a cloze is bounded so one huge passage cannot eat the day', () => {
    expect(estimateSeconds({ kind: 'cloze', blankCount: 500 })).toBeLessThanOrEqual(240)
  })
})

describe('selectToday', () => {
  const items = buildItems(verses, sets)
  const scheduleAll = (due) => Object.fromEntries(items.map((i) => [i.id, { ...initialSchedule(), due }]))

  test('an untouched item counts as new, not as a review', () => {
    const today = selectToday(items, {}, { newPerDay: 1 })
    expect(today.newCount).toBe(1)
    expect(today.reviewCount).toBe(0)
    expect(today.items[0].isNew).toBe(true)
  })

  test('respects the new-per-day limit', () => {
    const today = selectToday(items, {}, { newPerDay: 3 })
    expect(today.newCount).toBe(3)
    expect(today.freshTotal).toBe(5)
  })

  test('items due in the future are left alone', () => {
    const today = selectToday(items, scheduleAll(addDays(5)), { newPerDay: 0 })
    expect(today.items).toHaveLength(0)
    expect(today.dueTotal).toBe(0)
  })

  test('most overdue reviews come first', () => {
    const schedule = {
      [verseItemId('Zjevení 15:5')]: { ...initialSchedule(), due: addDays(-1) },
      [verseItemId('Zjevení 14:1')]: { ...initialSchedule(), due: addDays(-9) },
    }
    const today = selectToday(items, schedule, { newPerDay: 0 })
    expect(today.items[0].label).toBe('Zjevení 14:1')
  })

  test('the time budget caps how many reviews are pulled in', () => {
    const today = selectToday(items, scheduleAll(dayStr()), { newPerDay: 0, minutes: 2 })
    expect(today.seconds).toBeLessThanOrEqual(2 * 60)
    expect(today.items.length).toBeLessThan(today.dueTotal)
    expect(today.heldBack).toBeGreaterThan(0)
  })

  test('a tiny budget still yields one review rather than an empty day', () => {
    const today = selectToday(items, scheduleAll(dayStr()), { newPerDay: 0, minutes: 0 })
    expect(today.items).toHaveLength(1)
  })

  test('due reviews take priority over new material when time is tight', () => {
    // Everything overdue except the last item, which has never been seen.
    const schedule = scheduleAll(dayStr())
    delete schedule[items[items.length - 1].id]

    const today = selectToday(items, schedule, { newPerDay: 1, minutes: 1 })
    expect(today.newCount).toBe(0)
    expect(today.items[0].isNew).toBe(false)
    expect(today.heldBack).toBeGreaterThan(0)
  })

  test('what is held back today is simply still due tomorrow', () => {
    const schedule = scheduleAll(dayStr())
    const day1 = selectToday(items, schedule, { newPerDay: 0, minutes: 2 })
    const day2 = selectToday(items, schedule, { newPerDay: 0, minutes: 60, today: addDays(1) })
    expect(day2.dueTotal).toBe(day1.dueTotal)
    expect(day2.items.length).toBeGreaterThan(day1.items.length)
  })
})

describe('scheduler', () => {
  test('got it climbs a rung', () => {
    expect(nextSchedule(0, 'got').rung).toBe(1)
    expect(nextSchedule(0, 'got').due).toBe(addDays(LADDER[1]))
  })

  test('shaky holds the rung', () => {
    expect(nextSchedule(3, 'shaky').rung).toBe(3)
  })

  test('lost drops to the bottom and counts a lapse', () => {
    const after = applyResult({ ...initialSchedule(), rung: 4 }, 'lost')
    expect(after.rung).toBe(0)
    expect(after.lapses).toBe(1)
    expect(after.due).toBe(addDays(LADDER[0]))
  })

  test('climbing stops at the top rung', () => {
    let entry = initialSchedule()
    for (let i = 0; i < 20; i++) entry = applyResult(entry, 'got')
    expect(entry.rung).toBe(LADDER.length - 1)
  })

  test('records when it was last reviewed', () => {
    expect(applyResult(null, 'got').lastReviewed).toBe(dayStr())
  })
})
