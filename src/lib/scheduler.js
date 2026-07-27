// When something should be seen again.
//
// A rung on a ladder of widening gaps. Recall it and you climb; be shaky and
// you hold; lose it and you drop to the bottom. Nothing here knows what is
// being scheduled — verses, questions and cloze passages all use it.

export const LADDER = [1, 3, 7, 16, 35, 90, 180]

export function dayStr(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export function addDays(days, from = new Date()) {
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  return dayStr(d)
}

export function rungFor(current = 0, result) {
  if (result === 'got') return current + 1
  if (result === 'lost') return 0
  return current // shaky holds
}

export function nextSchedule(current = 0, result, from = new Date()) {
  const rung = Math.max(0, Math.min(rungFor(current, result), LADDER.length - 1))
  return { rung, due: addDays(LADDER[rung], from) }
}

// A fresh item is due immediately.
export function initialSchedule() {
  return { rung: 0, due: dayStr(), lapses: 0, lastResult: null, lastReviewed: null }
}

export function applyResult(entry, result, from = new Date()) {
  const base = entry ?? initialSchedule()
  return {
    ...base,
    ...nextSchedule(base.rung, result, from),
    lapses: result === 'lost' ? (base.lapses ?? 0) + 1 : (base.lapses ?? 0),
    lastResult: result,
    lastReviewed: dayStr(from),
  }
}
