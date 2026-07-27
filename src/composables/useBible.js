import { shallowRef, ref } from 'vue'
import { cacheBible, readCachedBible } from '../lib/bibleCache.js'

const BIBLE_URL = 'https://raw.githubusercontent.com/koubadomik/water/main/resources/bible.json'

const bible = shallowRef(null)
const loading = ref(false)
const error = ref(null)
const source = ref(null)

let initiated = false

export function useBible() {
  if (!initiated) {
    initiated = true
    _load()
  }
  return { bible, loading, error, source, reload: _load }
}

async function _load() {
  loading.value = true
  error.value = null

  try {
    const cached = await readCachedBible()
    if (cached) {
      bible.value = cached
      source.value = 'offline'
      loading.value = false
      return
    }
  } catch {}

  try {
    const res = await fetch(BIBLE_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    bible.value = data
    source.value = 'network'
    // IndexedDB handles multi-megabyte content much more reliably on iOS.
    // A cache failure is never allowed to turn a successful download into an error.
    cacheBible(data).catch(() => {})
  } catch (e) {
    error.value = navigator.onLine === false
      ? 'You are offline and no Bible has been saved on this device yet.'
      : e.message
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
