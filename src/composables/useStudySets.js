import { computed } from 'vue'
import { useStorage } from './useStorage.js'
import { parseStudySet } from '../lib/parseStudySet.js'

const LS_KEY = 'studySets_v1'

let state = null

export function useStudySets() {
  if (!state) state = useStorage(LS_KEY, [])

  const sets = computed(() => state.value ?? [])

  // The raw paste is the source of truth — sets are re-parsed on read so any
  // later fix to the parser applies to everything already saved.
  function parsed(id) {
    const set = sets.value.find((s) => s.id === id)
    return set ? { ...parseStudySet(set.raw), id: set.id, savedTitle: set.title } : null
  }

  function addSet(raw) {
    const result = parseStudySet(raw)
    if (!result.cards.length && !result.passage) return null
    const set = {
      id: String(Date.now()),
      title: result.title,
      raw,
      createdAt: new Date().toISOString(),
    }
    state.value = [set, ...state.value]
    return set
  }

  function removeSet(id) {
    state.value = state.value.filter((s) => s.id !== id)
  }

  function renameSet(id, title) {
    state.value = state.value.map((s) => (s.id === id ? { ...s, title } : s))
  }

  return { sets, parsed, addSet, removeSet, renameSet }
}
