import { useStorage } from './useStorage.js'

const LS_KEY = 'memoryPalaceNotes'

let notes = null

export function usePalaceNotes() {
  if (!notes) notes = useStorage(LS_KEY, {})

  function noteKey(book, chapter) {
    return `${book}_${chapter}`
  }

  function getNote(book, chapter, verseIdx) {
    const k = noteKey(book, chapter)
    return notes.value[k]?.[verseIdx] ?? ''
  }

  function setNote(book, chapter, verseIdx, text) {
    const k = noteKey(book, chapter)
    if (!notes.value[k]) notes.value[k] = {}
    notes.value[k][verseIdx] = text
    // trigger reactivity
    notes.value = { ...notes.value }
  }

  function getAllNotes() {
    const result = []
    for (const [key, chapterNotes] of Object.entries(notes.value)) {
      for (const [idx, note] of Object.entries(chapterNotes)) {
        if (note) result.push({ key, verseIdx: Number(idx), note })
      }
    }
    return result
  }

  return { notes, getNote, setNote, getAllNotes }
}
