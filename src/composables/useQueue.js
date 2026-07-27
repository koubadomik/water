import { computed, watch } from 'vue'
import { useStorage } from './useStorage.js'
import { useReview } from './useReview.js'
import { useStudySets } from './useStudySets.js'
import { useTrainingSets } from './useTrainingSets.js'
import { buildItems, selectToday } from '../lib/queue.js'
import { applyResult, dayStr, initialSchedule } from '../lib/scheduler.js'

const SCHEDULE_KEY = 'reviewSchedule_v1'
const SETTINGS_KEY = 'routineSettings_v1'
const PLAN_KEY = 'todayPlan_v1'

const DEFAULT_SETTINGS = { minutes: 15, newPerDay: 1 }

let schedule = null
let settings = null
let plan = null

export function useQueue() {
  const { verses } = useReview()
  const { sets, parsed } = useStudySets()
  const { currentIds, current } = useTrainingSets()

  if (!schedule) {
    schedule = useStorage(SCHEDULE_KEY, null)
    if (schedule.value === null) schedule.value = seedFromVerses(verses.value)
  }
  if (!settings) settings = useStorage(SETTINGS_KEY, { ...DEFAULT_SETTINGS })
  if (!plan) plan = useStorage(PLAN_KEY, null)

  const parsedSets = computed(() => sets.value.map((s) => parsed(s.id)).filter(Boolean))

  // Everything you own…
  const allItems = computed(() => buildItems(verses.value, parsedSets.value))

  // …but the day is drawn only from what you are currently training.
  const items = computed(() => {
    const chosen = new Set(currentIds.value)
    return allItems.value.filter((i) => chosen.has(i.id))
  })

  // The active set is a deliberate sequence (usually a Bible range), so it
  // remains visible in that sequence even when only a few items are due.
  const orderedItems = computed(() => {
    const order = new Map(currentIds.value.map((id, index) => [id, index]))
    return [...items.value].sort((a, b) => (order.get(a.id) ?? Infinity) - (order.get(b.id) ?? Infinity))
  })

  // Progress belongs to the training set. The same verse studied under two
  // sets keeps a separate record in each, so switching between them resumes
  // where that set left off rather than inheriting another set's history.
  function isVerse(id) {
    return id.startsWith('verse:')
  }

  function key(id) {
    // Verses belong to the person, not a particular set. Study-set questions
    // and passages remain local to their source set.
    if (isVerse(id)) return id
    return `${current.value?.id ?? 'none'}::${id}`
  }

  // Records written before sets existed were unscoped; fall back to them once
  // so nothing already learned resets to day one.
  function entry(id) {
    if (!isVerse(id)) return schedule.value?.[key(id)] ?? schedule.value?.[id]

    // Older app versions recorded verses under a set id. Honour the strongest
    // of those records once, so prior learning is not lost during migration.
    const candidates = [schedule.value?.[id]]
    for (const [storedKey, value] of Object.entries(schedule.value ?? {})) {
      if (storedKey.endsWith(`::${id}`)) candidates.push(value)
    }
    return candidates.filter(Boolean).sort((a, b) =>
      (b.rung ?? 0) - (a.rung ?? 0) || String(b.lastReviewed ?? '').localeCompare(String(a.lastReviewed ?? '')),
    )[0]
  }

  function scopedSchedule() {
    const out = {}
    for (const item of items.value) {
      const e = entry(item.id)
      if (e) out[item.id] = e
    }
    return out
  }

  function isDoneToday(id) {
    return entry(id)?.lastReviewed === dayStr()
  }

  // A verse is only known after a successful full recall has moved it up at
  // least one rung. It will still be scheduled again at wider intervals.
  function isKnown(id) {
    return (entry(id)?.rung ?? 0) > 0
  }

  function markLearning(id) {
    const previous = entry(id)
    schedule.value = {
      ...schedule.value,
      [key(id)]: { ...initialSchedule(), lapses: previous?.lapses ?? 0 },
    }
  }

  // The day's list is decided once and then held. Recomputing it from the
  // schedule would make each item disappear the moment it was answered,
  // instead of staying put with a tick against it.
  function replan() {
    const t = dayStr()
    const keep = plan.value?.date === t ? plan.value.ids.filter(isDoneToday) : []
    const chosen = selectToday(items.value, scopedSchedule(), {
      minutes: settings.value?.minutes ?? DEFAULT_SETTINGS.minutes,
      newPerDay: settings.value?.newPerDay ?? DEFAULT_SETTINGS.newPerDay,
      today: t,
    })
    plan.value = {
      date: t,
      setId: current.value?.id ?? null,
      ids: [...new Set([...keep, ...chosen.items.map((i) => i.id)])],
      newIds: chosen.items.filter((i) => i.isNew).map((i) => i.id),
      minutes: chosen.minutes,
      heldBack: chosen.heldBack,
      dueTotal: chosen.dueTotal,
      freshTotal: chosen.freshTotal,
    }
  }

  if (!plan.value || plan.value.date !== dayStr() || plan.value.setId !== (current.value?.id ?? null)) replan()

  // A new day, changed settings, or freshly added material all warrant a
  // fresh plan. Grading does not — that would reshuffle the list underfoot.
  watch(
    () =>
      [dayStr(), items.value.length, current.value?.id, settings.value?.minutes, settings.value?.newPerDay].join('|'),
    () => replan(),
  )

  const today = computed(() => {
    const p = plan.value
    const byId = new Map(items.value.map((i) => [i.id, i]))
    const order = new Map(currentIds.value.map((id, index) => [id, index]))
    const list = (p?.ids ?? [])
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((i) => ({ ...i, isNew: p.newIds?.includes(i.id) ?? false }))
      .sort((a, b) => (order.get(a.id) ?? Infinity) - (order.get(b.id) ?? Infinity))
    return {
      items: list,
      minutes: p?.minutes ?? 0,
      heldBack: p?.heldBack ?? 0,
      dueTotal: p?.dueTotal ?? 0,
      freshTotal: p?.freshTotal ?? 0,
    }
  })

  // Pull the next batch in on top of the day's plan, for when you want to keep
  // going. The budget is a guard against a daunting list, not a daily maximum.
  function extendPlan(extraMinutes) {
    const already = new Set(plan.value?.ids ?? [])
    const rest = items.value.filter((i) => !already.has(i.id))
    const chosen = selectToday(rest, scopedSchedule(), {
      minutes: extraMinutes ?? settings.value?.minutes ?? DEFAULT_SETTINGS.minutes,
      newPerDay: settings.value?.newPerDay ?? DEFAULT_SETTINGS.newPerDay,
      today: dayStr(),
    })
    if (!chosen.items.length) return 0

    plan.value = {
      ...plan.value,
      ids: [...(plan.value?.ids ?? []), ...chosen.items.map((i) => i.id)],
      newIds: [...(plan.value?.newIds ?? []), ...chosen.items.filter((i) => i.isNew).map((i) => i.id)],
      minutes: (plan.value?.minutes ?? 0) + chosen.minutes,
      heldBack: chosen.heldBack,
    }
    return chosen.items.length
  }

  // Anything due that today's plan has not picked up.
  const moreAvailable = computed(() => {
    const already = new Set(plan.value?.ids ?? [])
    const t = dayStr()
    return items.value.filter(
      (i) => !already.has(i.id) && (!entry(i.id) || entry(i.id).due <= t),
    ).length
  })

  const remaining = computed(() => today.value.items.filter((i) => !isDoneToday(i.id)))
  const doneToday = computed(() => today.value.items.length - remaining.value.length)

  // result: 'got' | 'shaky' | 'lost'
  function grade(id, result) {
    schedule.value = { ...schedule.value, [key(id)]: applyResult(entry(id), result) }
  }

  function setSettings(patch) {
    settings.value = { ...settings.value, ...patch }
  }

  // Practising something off-schedule is practice, not a review. It counts
  // only when the item was genuinely on today's list and unanswered —
  // otherwise drilling one verse repeatedly would inflate its interval.
  function creditIfDue(id, result) {
    if (!(plan.value?.ids ?? []).includes(id) || isDoneToday(id)) return false
    grade(id, result)
    return true
  }

  // How far a given set has got, for the switcher.
  function progressFor(set) {
    const ids = set?.itemIds ?? []
    const done = ids.filter((id) => {
      if (isVerse(id)) return Boolean(entry(id))
      return Boolean(schedule.value?.[`${set.id}::${id}`] ?? schedule.value?.[id])
    }).length
    return { done, total: ids.length }
  }

  return {
    items,
    orderedItems,
    allItems,
    progressFor,
    currentSet: current,
    today,
    remaining,
    doneToday,
    isDoneToday,
    isKnown,
    markLearning,
    grade,
    extendPlan,
    moreAvailable,
    creditIfDue,
    settings,
    setSettings,
    replan,
  }
}

// Progress recorded before the queue existed lives on the verse records
// themselves. Carry it across so nothing resets to day one.
export function seedFromVerses(verses = []) {
  const seeded = {}
  for (const v of verses) {
    if (!v?.ref || v.due == null) continue
    seeded[`verse:${v.ref}`] = {
      rung: v.rung ?? 0,
      due: v.due,
      lapses: v.lapses ?? 0,
      lastResult: v.lastResult ?? null,
      lastReviewed: v.lastReviewed ?? null,
    }
  }
  return seeded
}
