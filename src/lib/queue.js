// The day's work.
//
// Everything you study is an item: a verse, one question from a pasted set, or
// one cloze passage. Items carry no schedule of their own — they are derived
// from your material, and the schedule is looked up by id. That way editing or
// re-parsing a set never orphans its progress.

import { dayStr } from './scheduler.js'

export const KINDS = ['verse', 'question', 'cloze']

export function verseItemId(ref) {
  return `verse:${ref}`
}

export function questionItemId(setId, cardId) {
  return `set:${setId}:q:${cardId}`
}

export function clozeItemId(setId) {
  return `set:${setId}:cloze`
}

/**
 * @param verses  records from the verse list
 * @param sets    parsed study sets, each { id, title, cards, passage, blankCount }
 */
export function buildItems(verses = [], sets = []) {
  const items = []

  for (const v of verses) {
    if (!v?.ref) continue
    items.push({
      id: verseItemId(v.ref),
      kind: 'verse',
      label: v.ref,
      sourceId: v.ref,
      payload: v,
    })
  }

  for (const set of sets) {
    if (!set?.id) continue
    for (const card of set.cards ?? []) {
      items.push({
        id: questionItemId(set.id, card.id),
        kind: 'question',
        label: `${set.title} — question ${card.number ?? card.id}`,
        sourceId: set.id,
        payload: card,
      })
    }
    if (set.passage?.verses?.length) {
      items.push({
        id: clozeItemId(set.id),
        kind: 'cloze',
        label: `${set.title} — passage`,
        sourceId: set.id,
        payload: set.passage,
        blankCount: set.blankCount ?? 0,
      })
    }
  }

  return items
}

// Rough cost of working through one item, in seconds. Used only to fill a time
// budget, so it needs to be proportionate rather than accurate.
export function estimateSeconds(item, isNew = false) {
  if (item.kind === 'verse') return isNew ? 180 : 60
  if (item.kind === 'question') return isNew ? 90 : 45
  const blanks = item.blankCount ?? 0
  return Math.min(240, Math.max(30, blanks * (isNew ? 25 : 15)))
}

/**
 * Choose what to work on today.
 *
 * Reviews come first: protecting a verse already learned matters more than
 * adding one more. Fresh material fills whatever time is left.
 * Anything not reached stays due and simply reappears tomorrow.
 */
export function selectToday(items, schedule = {}, options = {}) {
  const { minutes = 15, newPerDay = 1, today = dayStr() } = options
  const budget = minutes * 60

  const fresh = []
  const due = []
  for (const item of items) {
    const entry = schedule[item.id]
    if (!entry) fresh.push(item)
    else if (entry.due <= today) due.push({ ...item, entry })
  }

  due.sort(
    (a, b) => a.entry.due.localeCompare(b.entry.due) || (a.entry.rung ?? 0) - (b.entry.rung ?? 0),
  )

  const picked = []
  let seconds = 0

  for (const item of due) {
    const cost = estimateSeconds(item, false)
    // Always allow at least one review through, even on a tight budget.
    if (seconds + cost > budget && picked.length > 0) break
    picked.push({ ...item, isNew: false })
    seconds += cost
  }

  for (const item of fresh.slice(0, newPerDay)) {
    const cost = estimateSeconds(item, true)
    if (seconds + cost > budget && picked.length > 0) break
    picked.push({ ...item, isNew: true })
    seconds += cost
  }

  const reserved = picked.filter((item) => item.isNew).length

  return {
    items: picked,
    seconds,
    minutes: Math.round(seconds / 60),
    newCount: reserved,
    reviewCount: picked.length - reserved,
    dueTotal: due.length,
    freshTotal: fresh.length,
    heldBack: due.length - (picked.length - reserved),
  }
}
