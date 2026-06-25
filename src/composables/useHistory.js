import { useStorage } from './useStorage.js'

const LS_KEY = 'pathHistory_v1'

let state = null

export function useHistory() {
  if (!state) state = useStorage(LS_KEY, [])

  function saveCompletedPath(goalMeta, verses, xpEarned = 0) {
    const entry = {
      id: Date.now(),
      label: buildLabel(goalMeta),
      goalMeta,
      verses,
      completedAt: new Date().toISOString(),
      xpEarned,
    }
    state.value = [entry, ...state.value]
  }

  function buildLabel(meta) {
    if (!meta) return 'Unknown path'
    const range = (meta.endVerse ?? 0) > (meta.startVerse ?? 0)
      ? `${meta.startVerse}–${meta.endVerse}`
      : `${meta.startVerse ?? '?'}`
    return `${meta.book ?? ''} ${meta.chapter ?? ''}:${range}`.trim()
  }

  function removeHistory(id) {
    state.value = state.value.filter(e => e.id !== id)
  }

  function clearHistory() {
    state.value = []
  }

  return { history: state, saveCompletedPath, removeHistory, clearHistory }
}
