<template>
  <div class="symbols">
    <!-- Verse selector -->
    <div v-if="!activeVerse" class="list">
      <div class="list-header">Choose a verse to assign symbols</div>
      <div v-if="verses.length === 0" class="empty">
        <p>Add verses in the <strong>Palace</strong> tab first.</p>
      </div>
      <button
        v-for="v in verses"
        :key="v.ref"
        class="list-item"
        @click="loadVerse(v)"
      >
        <span class="ref">{{ v.ref }}</span>
        <span class="preview">{{ v.text.slice(0, 50) }}…</span>
      </button>
    </div>

    <!-- Symbol designer -->
    <template v-else>
      <div class="designer-header">
        <button class="back-btn" @click="activeVerse = null">← Back</button>
        <span class="ref">{{ activeVerse.ref }}</span>
      </div>

      <div class="words-grid">
        <div
          v-for="(item, i) in resolvedWords"
          :key="i"
          class="word-cell"
        >
          <div class="emoji-display">{{ item.emoji || '·' }}</div>
          <button class="word-btn" @click="editWord = item.word; emojiInput = item.emoji">
            {{ item.word }}
          </button>
        </div>
      </div>

      <!-- Emoji editor modal -->
      <div v-if="editWord" class="modal-overlay" @click.self="editWord = null">
        <div class="modal">
          <div class="modal-title">Assign emoji to <strong>{{ editWord }}</strong></div>
          <input
            v-model="emojiInput"
            class="emoji-input"
            placeholder="Paste emoji here…"
            maxlength="4"
          />
          <div class="quick-emojis">
            <button v-for="e in quickEmojis" :key="e" class="quick-btn" @click="emojiInput = e">{{ e }}</button>
          </div>
          <div class="modal-actions">
            <button class="btn-save" @click="saveEmoji">Save</button>
            <button class="btn-clear" @click="clearEmoji">Clear</button>
          </div>
        </div>
      </div>

      <!-- Symbolic reveal preview -->
      <div class="preview-section">
        <div class="preview-label">Preview</div>
        <div class="preview-words">
          <div v-for="(item, i) in resolvedWords" :key="i" class="preview-cell">
            <div class="preview-emoji">{{ item.emoji }}</div>
            <span class="preview-word">{{ item.word }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useVerseList } from '../composables/useVerseList.js'
import { useStorage } from '../composables/useStorage.js'

const { verses } = useVerseList()
const emojiMap = useStorage('userCustomEmojis', {})

const activeVerse = ref(null)
const editWord = ref(null)
const emojiInput = ref('')

const resolvedWords = computed(() => {
  if (!activeVerse.value) return []
  const raw = activeVerse.value.text.replace(/[.,;:!?]/g, '').split(' ').filter(Boolean)
  const result = []
  let i = 0
  while (i < raw.length) {
    let matched = false
    for (let len = 3; len >= 1; len--) {
      if (i + len > raw.length) continue
      const phrase = raw.slice(i, i + len).map(w => w.toLowerCase().replace(/[^a-z]/g, '')).join(' ')
      if (emojiMap.value[phrase]) {
        result.push({ word: raw[i], phrase, emoji: emojiMap.value[phrase], span: len })
        for (let j = 1; j < len; j++) result.push({ word: raw[i + j], phrase: null, emoji: '', span: 0 })
        i += len
        matched = true
        break
      }
    }
    if (!matched) {
      const key = raw[i].toLowerCase().replace(/[^a-z]/g, '')
      result.push({ word: raw[i], phrase: null, emoji: emojiMap.value[key] || '', span: 1 })
      i++
    }
  }
  return result
})

const quickEmojis = ['❤️', '🌍', '✝️', '🙏', '🕊️', '⚡', '🔥', '🌊', '🏔️', '🌿', '👑', '🗝️', '⚔️', '🛡️', '🌟']

function loadVerse(v) {
  activeVerse.value = v
  editWord.value = null
}

function saveEmoji() {
  if (!editWord.value) return
  const key = editWord.value.toLowerCase().replace(/[^a-z]/g, '')
  emojiMap.value = { ...emojiMap.value, [key]: emojiInput.value }
  editWord.value = null
}

function clearEmoji() {
  if (!editWord.value) return
  const key = editWord.value.toLowerCase().replace(/[^a-z]/g, '')
  const updated = { ...emojiMap.value }
  delete updated[key]
  emojiMap.value = updated
  editWord.value = null
}
</script>

<style scoped>
.symbols {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
}

.list { display: flex; flex-direction: column; }

.list-header {
  padding: 16px;
  font-size: 14px;
  color: #6b7280;
  border-bottom: 1px solid #1f2937;
}

.empty {
  padding: 40px 20px;
  text-align: center;
  color: #6b7280;
}

.empty strong { color: #58cc02; }

.list-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  border-bottom: 1px solid #1f2937;
  padding: 14px 16px;
  text-align: left;
  cursor: pointer;
  width: 100%;
}

.ref { font-size: 13px; font-weight: 700; color: #58cc02; }
.preview { font-size: 13px; color: #9ca3af; }

.designer-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #1f2937;
}

.back-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 14px;
  cursor: pointer;
}

.words-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 16px;
}

.word-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.emoji-display {
  font-size: 20px;
  min-height: 24px;
  text-align: center;
}

.word-btn {
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 8px;
  color: #f9fafb;
  font-size: 14px;
  padding: 6px 10px;
  cursor: pointer;
}

.word-btn:active { background: #374151; }

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: flex-end;
  z-index: 100;
}

.modal {
  background: #1f2937;
  border-radius: 20px 20px 0 0;
  padding: 24px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-title { font-size: 16px; color: #f9fafb; }
.modal-title strong { color: #58cc02; }

.emoji-input {
  background: #111827;
  border: 2px solid #374151;
  border-radius: 10px;
  color: #f9fafb;
  font-size: 28px;
  padding: 12px;
  text-align: center;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}

.quick-emojis {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-btn {
  background: #111827;
  border: none;
  border-radius: 8px;
  font-size: 24px;
  padding: 8px;
  cursor: pointer;
}

.modal-actions { display: flex; gap: 12px; }

.btn-save {
  flex: 1;
  padding: 14px;
  background: #58cc02;
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

.btn-clear {
  padding: 14px 20px;
  background: #374151;
  border: none;
  border-radius: 12px;
  color: #9ca3af;
  font-size: 16px;
  cursor: pointer;
}

.preview-section {
  padding: 16px;
  border-top: 1px solid #1f2937;
  margin-top: auto;
}

.preview-label {
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 10px;
}

.preview-words {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.preview-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.preview-emoji { font-size: 18px; min-height: 22px; }

.preview-word { font-size: 13px; color: #d1d5db; }
</style>
