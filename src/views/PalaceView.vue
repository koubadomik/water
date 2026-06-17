<template>
  <div class="palace">
    <!-- Loading -->
    <div v-if="loading" class="center">
      <div class="spinner"></div>
      <p>Loading Bible…</p>
    </div>

    <!-- Error / no bible -->
    <div v-else-if="error || !bible" class="center">
      <div class="icon">📚</div>
      <p>{{ error ? 'Could not load Bible' : 'Bible not loaded yet' }}</p>
      <p class="hint">Fetching from GitHub failed. Load from a local file:</p>
      <label class="upload-btn">
        Upload bible.json
        <input type="file" accept=".json" class="file-input" @change="onFileUpload" />
      </label>
      <button class="retry-btn" @click="reload">Retry fetch</button>
    </div>

    <!-- Verse detail -->
    <template v-else-if="selectedVerse">
      <div class="detail-header">
        <button class="back-btn" @click="selectedVerse = null">← Back</button>
        <button
          v-if="detailSource === 'list'"
          class="nav-btn"
          :disabled="selectedVerse.verseIdx === 0"
          @click="prevVerse"
        >‹</button>
        <span class="detail-ref">{{ selectedVerse.ref }}</span>
        <button
          v-if="detailSource === 'list'"
          class="nav-btn"
          :disabled="selectedVerse.verseIdx >= chapterVerses.length - 1"
          @click="nextVerse"
        >›</button>
        <button
          class="add-btn"
          :class="{ added: hasVerse(selectedVerse.ref) }"
          @click="toggleVerse"
        >
          {{ hasVerse(selectedVerse.ref) ? '✓ Saved' : '+ Add' }}
        </button>
      </div>

      <div class="verse-card">
        <div class="verse-text">{{ selectedVerse.text }}</div>
      </div>

      <div class="note-section">
        <label class="note-label">Memory Palace Note</label>
        <textarea
          v-model="noteInput"
          class="note-input"
          rows="3"
          placeholder="What image or scene helps you remember this verse?"
          @input="saveNote"
        />
      </div>
    </template>

    <!-- Bible browser -->
    <template v-else>
      <!-- Search bar always visible -->
      <div class="search-bar">
        <input
          v-model="query"
          class="search-input"
          placeholder="Search verses or reference (e.g. John 3)…"
          type="search"
          @focus="showSearch = true"
        />
        <button v-if="query" class="clear-btn" @click="query = ''; showSearch = false">✕</button>
      </div>

      <!-- Search results -->
      <div v-if="query.trim().length >= 2" class="list">
        <div class="list-header">
          {{ searchResults.length }} result{{ searchResults.length !== 1 ? 's' : '' }}
        </div>
        <div v-if="searchResults.length === 0" class="empty-results">No matches found</div>
        <button
          v-for="r in searchResults"
          :key="r.ref"
          class="verse-item"
          @click="openVerseFromSearch(r)"
        >
          <span class="verse-num">{{ r.verseNum }}</span>
          <div class="verse-content">
            <span class="result-ref">{{ r.ref }}</span>
            <span class="verse-preview" v-html="highlight(r.text, query)" />
          </div>
          <span v-if="hasVerse(r.ref)" class="saved-dot">●</span>
        </button>
      </div>

      <!-- Book picker -->
      <div v-else-if="!selectedBook" class="list">
        <div class="list-header">Books</div>
        <button
          v-for="book in books"
          :key="book"
          class="list-item"
          @click="selectedBook = book; selectedChapter = null"
        >
          {{ book }}
        </button>
      </div>

      <!-- Chapter picker -->
      <div v-else-if="!selectedChapter" class="list">
        <div class="list-header">
          <button class="back-btn" @click="selectedBook = null">← Books</button>
          {{ selectedBook }}
        </div>
        <div class="chapter-grid">
          <button
            v-for="n in chapterCount"
            :key="n"
            class="chapter-btn"
            @click="selectedChapter = n"
          >{{ n }}</button>
        </div>
      </div>

      <!-- Verse list -->
      <div v-else class="list">
        <div class="list-header">
          <button class="back-btn" @click="selectedChapter = null">← {{ selectedBook }}</button>
          Chapter {{ selectedChapter }}
        </div>
        <button
          v-for="(text, idx) in chapterVerses"
          :key="idx"
          class="verse-item"
          @click="openVerse(idx, text)"
        >
          <span class="verse-num">{{ idx + 1 }}</span>
          <span class="verse-preview">{{ text.slice(0, 80) }}{{ text.length > 80 ? '…' : '' }}</span>
          <span v-if="hasVerse(`${selectedBook} ${selectedChapter}:${idx + 1}`)" class="saved-dot">●</span>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useBible, bookNames, getChapter } from '../composables/useBible.js'
import { useVerseList } from '../composables/useVerseList.js'
import { usePalaceNotes } from '../composables/usePalaceNotes.js'

const { bible, loading, error, reload } = useBible()
const { hasVerse, addVerse, removeVerse, updateNote } = useVerseList()
const { getNote, setNote } = usePalaceNotes()

const selectedBook = ref(null)
const selectedChapter = ref(null)
const selectedVerse = ref(null)
const detailSource = ref(null) // 'list' | 'search'
const noteInput = ref('')
const query = ref('')
const showSearch = ref(false)

const books = computed(() => bookNames(bible.value))

const chapterCount = computed(() => {
  if (!bible.value || !selectedBook.value) return 0
  return bible.value[selectedBook.value]?.chapters?.length ?? 0
})

const chapterVerses = computed(() => {
  if (!bible.value || !selectedBook.value || !selectedChapter.value) return []
  return getChapter(bible.value, selectedBook.value, selectedChapter.value)
})

// Search across entire Bible, capped at 60 results
const searchResults = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!bible.value || q.length < 2) return []
  const results = []
  for (const book of Object.keys(bible.value)) {
    const chapters = bible.value[book].chapters
    for (let ci = 0; ci < chapters.length; ci++) {
      const verses = chapters[ci]
      for (let vi = 0; vi < verses.length; vi++) {
        const text = verses[vi]
        const ref = `${book} ${ci + 1}:${vi + 1}`
        if (text.toLowerCase().includes(q) || ref.toLowerCase().includes(q)) {
          results.push({ ref, text, book, chapter: ci + 1, verseIdx: vi, verseNum: vi + 1 })
          if (results.length >= 60) return results
        }
      }
    }
  }
  return results
})

function highlight(text, q) {
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>')
}

function openVerse(idx, text) {
  const ref = `${selectedBook.value} ${selectedChapter.value}:${idx + 1}`
  selectedVerse.value = { ref, text, book: selectedBook.value, chapter: selectedChapter.value, verseIdx: idx }
  detailSource.value = 'list'
  noteInput.value = getNote(selectedBook.value, selectedChapter.value, idx)
}

function openVerseFromSearch(r) {
  selectedVerse.value = { ref: r.ref, text: r.text, book: r.book, chapter: r.chapter, verseIdx: r.verseIdx }
  detailSource.value = 'search'
  noteInput.value = getNote(r.book, r.chapter, r.verseIdx)
}

function toggleVerse() {
  if (!selectedVerse.value) return
  const v = selectedVerse.value
  if (hasVerse(v.ref)) {
    if (!confirm(`Remove ${v.ref} from your list?`)) return
    removeVerse(v.ref)
  } else {
    addVerse({ ref: v.ref, text: v.text, note: noteInput.value, book: v.book, chapter: v.chapter, verseIdx: v.verseIdx })
  }
}

function prevVerse() {
  if (!selectedVerse.value || selectedVerse.value.verseIdx === 0) return
  const idx = selectedVerse.value.verseIdx - 1
  openVerse(idx, chapterVerses.value[idx])
}

function nextVerse() {
  if (!selectedVerse.value || selectedVerse.value.verseIdx >= chapterVerses.value.length - 1) return
  const idx = selectedVerse.value.verseIdx + 1
  openVerse(idx, chapterVerses.value[idx])
}

function saveNote() {
  if (!selectedVerse.value) return
  const v = selectedVerse.value
  setNote(v.book, v.chapter, v.verseIdx, noteInput.value)
  if (hasVerse(v.ref)) updateNote(v.ref, noteInput.value)
}

function onFileUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result)
      localStorage.setItem('bibleJSON', JSON.stringify(data))
      location.reload()
    } catch {
      alert('Invalid JSON file')
    }
  }
  reader.readAsText(file)
}
</script>

<style scoped>
.palace {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
}

.center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 14px;
  padding: 40px;
  text-align: center;
  color: #9ca3af;
}

.icon { font-size: 48px; }
.hint { font-size: 13px; color: #6b7280; }

.upload-btn {
  background: #58cc02;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  padding: 12px 24px;
  border-radius: 12px;
  cursor: pointer;
}

.file-input { display: none; }

.retry-btn {
  background: none;
  border: 1px solid #374151;
  border-radius: 10px;
  color: #9ca3af;
  font-size: 14px;
  padding: 10px 20px;
  cursor: pointer;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #374151;
  border-top-color: #58cc02;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid #1f2937;
  position: sticky;
  top: 0;
  background: #111827;
  z-index: 2;
}

.search-input {
  flex: 1;
  background: #1f2937;
  border: none;
  border-radius: 10px;
  color: #f9fafb;
  font-size: 15px;
  padding: 10px 14px;
  outline: none;
}

.search-input::placeholder { color: #6b7280; }

.clear-btn {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
}

.empty-results {
  padding: 24px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #1f2937;
}

.detail-ref {
  flex: 1;
  font-weight: 700;
  color: #58cc02;
  font-size: 15px;
}

.back-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
}

.nav-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 22px;
  cursor: pointer;
  padding: 2px 6px;
  line-height: 1;
}

.nav-btn:disabled {
  color: #374151;
  cursor: default;
}

.add-btn {
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 20px;
  color: #f9fafb;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 14px;
  cursor: pointer;
}

.add-btn.added {
  background: #14532d;
  border-color: #58cc02;
  color: #58cc02;
}

.verse-card {
  background: #1f2937;
  margin: 16px;
  border-radius: 14px;
  padding: 20px;
}

.verse-text {
  font-size: 18px;
  line-height: 1.7;
  color: #f9fafb;
}

.note-section {
  padding: 0 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.note-label {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.note-input {
  background: #1f2937;
  border: 2px solid #374151;
  border-radius: 12px;
  color: #f9fafb;
  font-size: 15px;
  padding: 12px;
  resize: none;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}

.note-input:focus { border-color: #58cc02; }

.list { display: flex; flex-direction: column; }

.list-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 700;
  color: #f9fafb;
  border-bottom: 1px solid #1f2937;
  position: sticky;
  top: 53px;
  background: #111827;
  z-index: 1;
}

.list-item {
  background: none;
  border: none;
  border-bottom: 1px solid #1f2937;
  color: #f9fafb;
  text-align: left;
  padding: 14px 16px;
  font-size: 15px;
  cursor: pointer;
}

.list-item:active { background: #1f2937; }

.chapter-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  padding: 16px;
}

.chapter-btn {
  background: #1f2937;
  border: none;
  border-radius: 10px;
  color: #f9fafb;
  font-size: 16px;
  font-weight: 600;
  padding: 14px 0;
  cursor: pointer;
}

.chapter-btn:active { background: #374151; }

.verse-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: none;
  border: none;
  border-bottom: 1px solid #1f2937;
  padding: 12px 16px;
  text-align: left;
  cursor: pointer;
  width: 100%;
}

.verse-num {
  font-size: 12px;
  color: #58cc02;
  font-weight: 700;
  min-width: 20px;
  margin-top: 2px;
  flex-shrink: 0;
}

.verse-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.result-ref {
  font-size: 12px;
  font-weight: 700;
  color: #58cc02;
}

.verse-preview {
  font-size: 14px;
  color: #d1d5db;
  line-height: 1.5;
}

.verse-preview :deep(mark) {
  background: #854d0e;
  color: #fef08a;
  border-radius: 2px;
  padding: 0 1px;
}

.saved-dot {
  color: #58cc02;
  font-size: 10px;
  margin-top: 4px;
  flex-shrink: 0;
}
</style>
