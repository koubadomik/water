import { computed } from 'vue'
import { useStorage } from './useStorage.js'

const LS_KEY = 'verseList_v1'

let list = null

export function useVerseList() {
  if (!list) list = useStorage(LS_KEY, [])

  const verses = computed(() => list.value)

  function addVerse(verse) {
    const exists = list.value.some(v => v.ref === verse.ref)
    if (!exists) list.value = [...list.value, verse]
  }

  function removeVerse(ref) {
    list.value = list.value.filter(v => v.ref !== ref)
  }

  function hasVerse(ref) {
    return list.value.some(v => v.ref === ref)
  }

  function updateNote(ref, note) {
    list.value = list.value.map(v => v.ref === ref ? { ...v, note } : v)
  }

  function updateDrilled(ref) {
    list.value = list.value.map(v => v.ref === ref ? { ...v, drilledAt: new Date().toISOString() } : v)
  }

  function moveUp(ref) {
    const idx = list.value.findIndex(v => v.ref === ref)
    if (idx <= 0) return
    const next = [...list.value]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    list.value = next
  }

  function moveDown(ref) {
    const idx = list.value.findIndex(v => v.ref === ref)
    if (idx === -1 || idx >= list.value.length - 1) return
    const next = [...list.value]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    list.value = next
  }

  function setVerses(arr) {
    list.value = arr
  }

  return { verses, addVerse, removeVerse, hasVerse, updateNote, updateDrilled, moveUp, moveDown, setVerses }
}
