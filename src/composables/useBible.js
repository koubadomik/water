import { shallowRef, ref } from 'vue'

const BIBLE_URL = 'https://raw.githubusercontent.com/koubadomik/water/main/resources/bible.json'
const LS_KEY = 'bibleJSON'

const bible = shallowRef(null)
const loading = ref(false)
const error = ref(null)

let initiated = false

export function useBible() {
  if (!initiated) {
    initiated = true
    _load()
  }
  return { bible, loading, error, reload: _load }
}

async function _load() {
  loading.value = true
  error.value = null

  try {
    const cached = localStorage.getItem(LS_KEY)
    if (cached) {
      bible.value = JSON.parse(cached)
      loading.value = false
      return
    }
  } catch {}

  try {
    const res = await fetch(BIBLE_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    localStorage.setItem(LS_KEY, JSON.stringify(data))
    bible.value = data
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

export function getVerse(bibleData, book, chapter, verseIdx) {
  try {
    return bibleData[book].chapters[chapter - 1][verseIdx] ?? null
  } catch {
    return null
  }
}

export function getChapter(bibleData, book, chapter) {
  try {
    return bibleData[book].chapters[chapter - 1] ?? []
  } catch {
    return []
  }
}

export function bookNames(bibleData) {
  return bibleData ? Object.keys(bibleData) : []
}
