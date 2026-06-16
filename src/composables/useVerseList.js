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

  return { verses, addVerse, removeVerse, hasVerse, updateNote }
}
