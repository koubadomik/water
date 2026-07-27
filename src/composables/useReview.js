import { computed } from 'vue'
import { useStorage } from './useStorage.js'

const LS_KEY = 'verses_v2'
const LEGACY_KEY = 'verseList_v1'

// Days until the next recall, by rung. A verse climbs one rung each time you
// recall it, holds its rung when it was shaky, and drops to the bottom when
// it's gone. The gaps widen because a verse you've held for a month doesn't
// need asking about tomorrow.
export const LADDER = [1, 3, 7, 16, 35, 90, 180]

export function dayStr(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10)
}

function addDays(days, from = new Date()) {
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  return dayStr(d)
}

function schedule(rung) {
  const capped = Math.max(0, Math.min(rung, LADDER.length - 1))
  return { rung: capped, due: addDays(LADDER[capped]) }
}

let state = null

export function useReview() {
  if (!state) {
    state = useStorage(LS_KEY, null)
    if (state.value === null) state.value = migrateFromPath()
  }

  const verses = computed(() => state.value ?? [])

  const due = computed(() => {
    const today = dayStr()
    return verses.value
      .filter((v) => v.due <= today)
      .sort((a, b) => a.due.localeCompare(b.due) || a.rung - b.rung)
  })

  function addVerse({ ref, text, book, chapter, verseIdx }) {
    if (state.value.some((v) => v.ref === ref)) return
    state.value = [
      ...state.value,
      { ref, text, book, chapter, verseIdx, rung: 0, due: dayStr(), lapses: 0, lastResult: null },
    ]
  }

  // Adding a range is one write, so the list doesn't churn per verse.
  function addVerses(list = []) {
    const seen = new Set(state.value.map((v) => v.ref))
    const fresh = list
      .filter((v) => v?.ref && !seen.has(v.ref))
      .map(({ ref, text, book, chapter, verseIdx }) => ({
        ref,
        text,
        book,
        chapter,
        verseIdx,
        rung: 0,
        due: dayStr(),
        lapses: 0,
        lastResult: null,
      }))
    if (fresh.length) state.value = [...state.value, ...fresh]
    return fresh.length
  }

  function removeVerse(ref) {
    state.value = state.value.filter((v) => v.ref !== ref)
  }

  function hasVerse(ref) {
    return state.value.some((v) => v.ref === ref)
  }

  // result: 'got' | 'shaky' | 'lost'
  function grade(ref, result) {
    state.value = state.value.map((v) => {
      if (v.ref !== ref) return v
      const rung = result === 'got' ? v.rung + 1 : result === 'lost' ? 0 : v.rung
      return {
        ...v,
        ...schedule(rung),
        lapses: result === 'lost' ? v.lapses + 1 : v.lapses,
        lastResult: result,
        lastReviewed: dayStr(),
      }
    })
  }

  return { verses, due, addVerse, addVerses, removeVerse, hasVerse, grade }
}

// verseList_v1 held one row per drill slot — each verse repeated 3× with a
// lessonIndex. Collapse those to one row per verse, crediting a rung for each
// repetition that was actually completed so existing progress carries over.
export function migrateFromPath(raw) {
  let nodes = raw
  if (nodes === undefined) {
    try {
      nodes = JSON.parse(localStorage.getItem(LEGACY_KEY) || '[]')
    } catch {
      nodes = []
    }
  }
  if (!Array.isArray(nodes)) return []

  const byRef = new Map()
  for (const node of nodes) {
    if (!node?.ref) continue
    const seen = byRef.get(node.ref)
    if (seen) {
      if (node.drilledAt) seen.drilled++
      continue
    }
    byRef.set(node.ref, {
      ref: node.ref,
      text: node.text ?? '',
      book: node.book ?? null,
      chapter: node.chapter ?? null,
      verseIdx: node.verseIdx ?? null,
      drilled: node.drilledAt ? 1 : 0,
    })
  }

  return [...byRef.values()].map(({ drilled, ...verse }) => ({
    ...verse,
    ...(drilled > 0 ? schedule(drilled - 1) : { rung: 0, due: dayStr() }),
    lapses: 0,
    lastResult: null,
  }))
}
