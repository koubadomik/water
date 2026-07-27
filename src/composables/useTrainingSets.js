import { computed } from 'vue'
import { useStorage } from './useStorage.js'
import { uid } from '../lib/uid.js'

const KEY = 'trainingSets_v1'

// What you are working on now, as opposed to everything you own.
//
// The library holds all your material. A training set is the slice of it you
// have chosen to memorise at the moment, and Today draws only from that. When
// you move on, the set is closed and kept — so the record of what you trained,
// and when, survives.

let state = null

export function useTrainingSets() {
  if (!state) state = useStorage(KEY, [])

  const current = computed(() => state.value.find((s) => !s.endedAt) ?? null)

  const history = computed(() =>
    state.value.filter((s) => s.endedAt).sort((a, b) => b.endedAt.localeCompare(a.endedAt)),
  )

  const currentIds = computed(() => current.value?.itemIds ?? [])

  function startSet(name, itemIds = []) {
    const now = new Date().toISOString()
    const closed = state.value.map((s) => (s.endedAt ? s : { ...s, endedAt: now }))
    state.value = [
      ...closed,
      { id: uid('set-'), name: name?.trim() || 'Untitled set', itemIds: [...itemIds], startedAt: now, endedAt: null },
    ]
  }

  function finishCurrent() {
    if (!current.value) return
    const now = new Date().toISOString()
    state.value = state.value.map((s) => (s.id === current.value.id ? { ...s, endedAt: now } : s))
  }

  function renameCurrent(name) {
    if (!current.value) return
    state.value = state.value.map((s) => (s.id === current.value.id ? { ...s, name: name.trim() || s.name } : s))
  }

  // Deduped here rather than at each call site: ranges routinely overlap, and
  // an item listed twice would be scheduled twice.
  function setItems(itemIds) {
    const unique = [...new Set(itemIds)]
    if (!current.value) return startSet('Current set', unique)
    state.value = state.value.map((s) => (s.id === current.value.id ? { ...s, itemIds: unique } : s))
  }

  function toggleItems(ids = []) {
    const list = Array.isArray(ids) ? ids : [ids]
    if (!list.length) return
    const have = new Set(currentIds.value)
    // All in already means the tap was meant to remove them.
    const removing = list.every((id) => have.has(id))
    for (const id of list) {
      if (removing) have.delete(id)
      else have.add(id)
    }
    setItems([...have])
  }

  function includes(id) {
    return currentIds.value.includes(id)
  }

  // Switching back reopens the set itself rather than cloning it, so its
  // progress — recorded against that set's id — carries straight over.
  function resumeSet(id) {
    const now = new Date().toISOString()
    state.value = state.value.map((s) => {
      if (s.id === id) return { ...s, endedAt: null, resumedAt: now }
      return s.endedAt ? s : { ...s, endedAt: now }
    })
  }

  function removeSet(id) {
    state.value = state.value.filter((s) => s.id !== id)
  }

  return {
    sets: state,
    current,
    currentIds,
    history,
    startSet,
    resumeSet,
    finishCurrent,
    renameCurrent,
    setItems,
    toggleItems,
    includes,
    removeSet,
  }
}
