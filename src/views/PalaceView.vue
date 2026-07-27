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

    <PalaceChapterWalk
      v-else-if="walkActive"
      :verses="walkVerses"
      :chapter-label="`${selectedBook} ${selectedChapter}`"
      @close="walkActive = false"
    />

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
      <div class="palace-jump-wrap">
        <form class="palace-jump" @submit.prevent="jumpToReference">
          <input
            v-model="jumpInput"
            class="search-input"
            data-testid="palace-jump"
            type="search"
            placeholder="Go to chapter or verse, e.g. Zj 1:3"
          />
          <button class="jump-button" :disabled="!jumpResult.ok">Go</button>
        </form>
        <ul v-if="jumpInput.trim().length >= 2 && jumpSuggestions.length" class="jump-results">
          <li v-for="result in jumpSuggestions" :key="result.ref">
            <button @click="jumpToVerse(result)">
              <span class="prose-ref">{{ result.ref }}</span>
              <span>{{ result.text }}</span>
            </button>
          </li>
        </ul>
        <p v-if="jumpInput.trim() && !jumpResult.ok" class="jump-error">{{ jumpResult.error }}</p>
      </div>

      <!-- Book picker -->
      <div v-if="!selectedBook" class="list">
        <div class="list-header">Books</div>
        <div class="book-search-bar">
          <input
            v-model="bookSearch"
            class="book-search-input"
            placeholder="Search books…"
            type="search"
          />
        </div>
        <button
          v-for="book in filteredBooks"
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
        <div class="book-search-bar">
          <input v-model="chapterQuery" class="book-search-input" type="search" inputmode="numeric" placeholder="Find chapter…" />
        </div>
        <div class="chapter-grid">
          <button
            v-for="n in filteredChapters"
            :key="n"
            class="chapter-btn"
            @click="selectChapter(n)"
          >{{ n }}</button>
        </div>
      </div>

      <!-- Chapter bulk view -->
      <div v-else class="list">
        <div class="list-header chapter-bulk-header">
          <button class="back-btn" @click="selectedChapter = null">← {{ selectedBook }}</button>
          <span>Chapter {{ selectedChapter }}</span>
          <div class="chapter-actions">
            <button class="walk-btn" @click="startWalk">Walk</button>
            <button class="save-all-btn" @click="saveAllNotes">Save All</button>
          </div>
        </div>
        <div class="book-search-bar">
          <input v-model="verseQuery" class="book-search-input" type="search" placeholder="Find verse number or words…" />
        </div>
        <p v-if="!filteredChapterVerses.length" class="empty-results">No verses match this chapter search.</p>
        <div
          v-for="entry in filteredChapterVerses"
          :key="entry.idx"
          class="verse-block"
        >
          <div class="verse-block-header">
            <span class="verse-num">{{ entry.idx + 1 }}</span>
            <span v-if="getNote(selectedBook, selectedChapter, entry.idx)" class="note-pin">📌</span>
            <button class="detail-btn" @click="openVerse(entry.idx, entry.text)">Detail →</button>
          </div>
          <div class="verse-block-text">{{ entry.text }}</div>
          <textarea
            v-model="chapterNotes[entry.idx]"
            class="verse-block-note"
            rows="2"
            placeholder="Memory note…"
            @blur="autoSaveNote(entry.idx)"
          />
        </div>
        <div v-if="savedFeedback" class="save-feedback">✓ Saved</div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useBible, bookNames, getChapter } from '../composables/useBible.js'
import { usePalaceNotes } from '../composables/usePalaceNotes.js'
import { resolveReference } from '../lib/reference.js'
import { searchBible } from '../lib/bibleSearch.js'
import PalaceChapterWalk from '../components/PalaceChapterWalk.vue'

const { bible, loading, error, reload } = useBible()
const { getNote, setNote } = usePalaceNotes()

const selectedBook = ref(null)
const selectedChapter = ref(null)
const selectedVerse = ref(null)
const detailSource = ref(null) // 'list' | 'search'
const noteInput = ref('')
const bookSearch = ref('')
const chapterQuery = ref('')
const verseQuery = ref('')
const jumpInput = ref('')
const chapterNotes = ref({})
const savedFeedback = ref(false)
const walkActive = ref(false)

const books = computed(() => bookNames(bible.value))
const filteredBooks = computed(() => {
  const q = bookSearch.value.trim().toLowerCase()
  if (!q) return books.value
  return books.value.filter(b => b.toLowerCase().includes(q))
})

const chapterCount = computed(() => {
  if (!bible.value || !selectedBook.value) return 0
  return bible.value[selectedBook.value]?.chapters?.length ?? 0
})

const chapterVerses = computed(() => {
  if (!bible.value || !selectedBook.value || !selectedChapter.value) return []
  return getChapter(bible.value, selectedBook.value, selectedChapter.value)
})

const filteredChapters = computed(() => {
  const wanted = chapterQuery.value.trim()
  return Array.from({ length: chapterCount.value }, (_, index) => index + 1)
    .filter((chapter) => !wanted || String(chapter).includes(wanted))
})

const filteredChapterVerses = computed(() => {
  const wanted = verseQuery.value.trim().toLocaleLowerCase()
  return chapterVerses.value
    .map((text, idx) => ({ text, idx }))
    .filter(({ text, idx }) => !wanted || String(idx + 1).includes(wanted) || text.toLocaleLowerCase().includes(wanted))
})

const walkVerses = computed(() => chapterVerses.value.map((text, verseIdx) => ({
  ref: `${selectedBook.value} ${selectedChapter.value}:${verseIdx + 1}`,
  text,
  note: getNote(selectedBook.value, selectedChapter.value, verseIdx),
})))

const jumpResult = computed(() => resolveReference(bible.value, jumpInput.value))
const jumpSuggestions = computed(() => searchBible(bible.value, jumpInput.value, 8).slice(0, 8))

function selectChapter(n) {
  selectedChapter.value = n
  verseQuery.value = ''
  // load notes for this chapter
  const notes = {}
  const verses = getChapter(bible.value, selectedBook.value, n)
  for (let i = 0; i < verses.length; i++) {
    notes[i] = getNote(selectedBook.value, n, i)
  }
  chapterNotes.value = notes
}

function jumpToReference() {
  if (!jumpResult.value.ok) return
  const result = jumpResult.value
  selectedBook.value = result.book
  selectChapter(result.chapter)
  if (result.from !== 1 || result.to !== chapterVerses.value.length) {
    const verse = result.verses[0]
    selectedVerse.value = verse
    detailSource.value = 'list'
    noteInput.value = getNote(verse.book, verse.chapter, verse.verseIdx)
  }
  jumpInput.value = ''
}

function jumpToVerse(verse) {
  selectedBook.value = verse.book
  selectChapter(verse.chapter)
  selectedVerse.value = verse
  detailSource.value = 'list'
  noteInput.value = getNote(verse.book, verse.chapter, verse.verseIdx)
  jumpInput.value = ''
}

function autoSaveNote(idx) {
  if (!selectedBook.value || !selectedChapter.value) return
  setNote(selectedBook.value, selectedChapter.value, idx, chapterNotes.value[idx] || '')
}

function saveAllNotes() {
  if (!selectedBook.value || !selectedChapter.value) return
  const count = chapterVerses.value.length
  for (let i = 0; i < count; i++) {
    setNote(selectedBook.value, selectedChapter.value, i, chapterNotes.value[i] || '')
  }
  savedFeedback.value = true
  setTimeout(() => { savedFeedback.value = false }, 1500)
}

function startWalk() {
  if (!chapterVerses.value.length) return
  saveAllNotes()
  walkActive.value = true
}

function openVerse(idx, text) {
  const ref = `${selectedBook.value} ${selectedChapter.value}:${idx + 1}`
  selectedVerse.value = { ref, text, book: selectedBook.value, chapter: selectedChapter.value, verseIdx: idx }
  detailSource.value = 'list'
  noteInput.value = getNote(selectedBook.value, selectedChapter.value, idx)
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

.palace-jump-wrap { position: relative; z-index: 2; }

.palace-jump {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-4) 0;
}

.palace-jump .search-input { flex: 1; }
.jump-button { min-width: 48px; border: 0; border-radius: var(--radius-md); background: var(--primary); color: var(--primary-foreground); font: inherit; font-size: var(--text-sm); font-weight: 600; cursor: pointer; }
.jump-button:disabled { opacity: 0.45; cursor: default; }
.jump-results { position: absolute; top: calc(100% - var(--space-1)); right: var(--space-4); left: var(--space-4); z-index: 3; max-height: min(360px, 55dvh); overflow-y: auto; list-style: none; margin: 0; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--card); box-shadow: var(--shadow-md); }
.jump-results button { display: flex; width: 100%; flex-direction: column; gap: 2px; border: 0; border-bottom: 1px solid var(--border); background: transparent; color: var(--foreground); cursor: pointer; padding: var(--space-3); text-align: left; font-family: var(--font-reading); font-size: var(--text-sm); }
.jump-results li:last-child button { border-bottom: none; }
.jump-results button:hover { background: var(--muted); }
.jump-error { padding: var(--space-2) var(--space-4) 0; color: var(--warning); font-size: var(--text-sm); }

.center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 14px;
  padding: 40px;
  text-align: center;
  color: var(--muted-foreground);
}

.icon { font-size: 48px; }
.hint { font-size: 13px; color: var(--muted-foreground); }

.upload-btn {
  background: var(--primary);
  color: var(--primary-foreground);
  font-size: 15px;
  font-weight: 700;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  cursor: pointer;
}

.file-input { display: none; }

.retry-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--muted-foreground);
  font-size: 14px;
  padding: 10px 20px;
  cursor: pointer;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: var(--background);
  z-index: 2;
}

.search-input {
  flex: 1;
  background: var(--muted);
  border: none;
  border-radius: var(--radius-md);
  color: var(--foreground);
  font-size: 15px;
  padding: 10px 14px;
  outline: none;
}

.search-input::placeholder { color: var(--muted-foreground); }

.clear-btn {
  background: none;
  border: none;
  color: var(--muted-foreground);
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
}

.empty-results {
  padding: 24px;
  text-align: center;
  color: var(--muted-foreground);
  font-size: 14px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.detail-ref {
  flex: 1;
  font-weight: 700;
  color: var(--primary);
  font-size: 15px;
}

.back-btn {
  background: none;
  border: none;
  color: var(--muted-foreground);
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
}

.nav-btn {
  background: none;
  border: none;
  color: var(--muted-foreground);
  font-size: 22px;
  cursor: pointer;
  padding: 2px 6px;
  line-height: 1;
}

.nav-btn:disabled {
  color: var(--muted-foreground);
  cursor: default;
}

.verse-card {
  background: var(--muted);
  margin: 16px;
  border-radius: var(--radius-lg);
  padding: 20px;
}

.verse-text {
  font-family: var(--font-reading);
  font-size: var(--text-lg);
  line-height: var(--leading-reading);
  color: var(--foreground);
  text-wrap: pretty;
}

.note-section {
  padding: 0 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.note-label {
  font-size: 12px;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.note-input {
  background: var(--muted);
  border: 2px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--foreground);
  font-size: 15px;
  padding: 12px;
  resize: none;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}

.note-input:focus { border-color: var(--primary); }

.book-search-bar {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--background);
}

.book-search-input {
  width: 100%;
  background: var(--muted);
  border: none;
  border-radius: var(--radius-sm);
  color: var(--foreground);
  font-size: 14px;
  padding: 8px 12px;
  outline: none;
  box-sizing: border-box;
}

.book-search-input::placeholder { color: var(--muted-foreground); }

.chapter-bulk-header {
  justify-content: space-between;
}

.chapter-actions { display: flex; align-items: center; gap: 8px; }

.walk-btn {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--muted);
  color: var(--foreground);
  font-size: 12px;
  font-weight: 700;
  padding: 6px 10px;
  cursor: pointer;
}

.save-all-btn {
  background: var(--primary);
  border: none;
  border-radius: var(--radius-sm);
  color: var(--primary-foreground);
  font-size: 12px;
  font-weight: 700;
  padding: 6px 12px;
  cursor: pointer;
}

.verse-block {
  border-bottom: 1px solid var(--border);
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.verse-block-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--primary);
  font-size: 12px;
  cursor: pointer;
}

.verse-block-text {
  font-size: 14px;
  color: var(--foreground);
  line-height: 1.5;
}

.verse-block-note {
  background: var(--muted);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--foreground);
  font-size: 13px;
  padding: 8px 10px;
  resize: none;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}

.verse-block-note:focus { border-color: var(--primary); }

.save-feedback {
  padding: 12px;
  text-align: center;
  color: var(--primary);
  font-weight: 700;
  font-size: 14px;
}

.list { display: flex; flex-direction: column; }

.list-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 700;
  color: var(--foreground);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 53px;
  background: var(--background);
  z-index: 1;
}

.list-item {
  background: none;
  border: none;
  border-bottom: 1px solid var(--border);
  color: var(--foreground);
  text-align: left;
  padding: 14px 16px;
  font-size: 15px;
  cursor: pointer;
}

.list-item:active { background: var(--muted); }

.chapter-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  padding: 16px;
}

.chapter-btn {
  background: var(--muted);
  border: none;
  border-radius: var(--radius-md);
  color: var(--foreground);
  font-size: 16px;
  font-weight: 600;
  padding: 14px 0;
  cursor: pointer;
}

.chapter-btn:active { background: var(--muted); }

.verse-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: none;
  border: none;
  border-bottom: 1px solid var(--border);
  padding: 12px 16px;
  text-align: left;
  cursor: pointer;
  width: 100%;
}

.verse-num {
  font-size: 12px;
  color: var(--primary);
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
  color: var(--primary);
}

.verse-preview {
  font-size: 14px;
  color: var(--foreground);
  line-height: 1.5;
}

.verse-preview :deep(mark) {
  background: var(--warning-surface);
  color: var(--warning);
  border-radius: 2px;
  padding: 0 1px;
}

.note-pin {
  font-size: 12px;
  flex-shrink: 0;
}
</style>
