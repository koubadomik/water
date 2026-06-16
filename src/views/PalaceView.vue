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
      <p>{{ error || 'Bible not loaded' }}</p>
      <p class="hint">The Bible data is fetched automatically. Check your connection and refresh.</p>
    </div>

    <!-- Verse detail -->
    <template v-else-if="selectedVerse">
      <div class="detail-header">
        <button class="back-btn" @click="selectedVerse = null">← Back</button>
        <span class="detail-ref">{{ selectedVerse.ref }}</span>
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
      <!-- Book picker -->
      <div v-if="!selectedBook" class="list">
        <div class="list-header">Choose a book</div>
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
import { ref, computed, watch } from 'vue'
import { useBible, bookNames, getChapter } from '../composables/useBible.js'
import { useVerseList } from '../composables/useVerseList.js'
import { usePalaceNotes } from '../composables/usePalaceNotes.js'

const { bible, loading, error } = useBible()
const { hasVerse, addVerse, removeVerse } = useVerseList()
const { getNote, setNote } = usePalaceNotes()

const selectedBook = ref(null)
const selectedChapter = ref(null)
const selectedVerse = ref(null)
const noteInput = ref('')

const books = computed(() => bookNames(bible.value))

const chapterCount = computed(() => {
  if (!bible.value || !selectedBook.value) return 0
  return bible.value[selectedBook.value]?.chapters?.length ?? 0
})

const chapterVerses = computed(() => {
  if (!bible.value || !selectedBook.value || !selectedChapter.value) return []
  return getChapter(bible.value, selectedBook.value, selectedChapter.value)
})

function openVerse(idx, text) {
  const ref = `${selectedBook.value} ${selectedChapter.value}:${idx + 1}`
  selectedVerse.value = { ref, text, book: selectedBook.value, chapter: selectedChapter.value, verseIdx: idx }
  noteInput.value = getNote(selectedBook.value, selectedChapter.value, idx)
}

function toggleVerse() {
  if (!selectedVerse.value) return
  const v = selectedVerse.value
  if (hasVerse(v.ref)) {
    removeVerse(v.ref)
  } else {
    addVerse({ ref: v.ref, text: v.text, note: noteInput.value, book: v.book, chapter: v.chapter, verseIdx: v.verseIdx })
  }
}

function saveNote() {
  if (!selectedVerse.value) return
  const v = selectedVerse.value
  setNote(v.book, v.chapter, v.verseIdx, noteInput.value)
  // also update verse list note if saved
  if (hasVerse(v.ref)) {
    const { updateNote } = useVerseList()
    updateNote(v.ref, noteInput.value)
  }
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
  gap: 12px;
  padding: 40px;
  text-align: center;
  color: #9ca3af;
}

.icon { font-size: 48px; }
.hint { font-size: 13px; color: #6b7280; }

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #374151;
  border-top-color: #58cc02;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

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
  padding: 14px 16px;
  font-size: 16px;
  font-weight: 700;
  color: #f9fafb;
  border-bottom: 1px solid #1f2937;
  position: sticky;
  top: 0;
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
  transition: background 0.1s;
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
}

.verse-preview {
  flex: 1;
  font-size: 14px;
  color: #d1d5db;
  line-height: 1.5;
}

.saved-dot {
  color: #58cc02;
  font-size: 10px;
  margin-top: 4px;
}
</style>
