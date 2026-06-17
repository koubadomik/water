<template>
  <div class="symbols">
    <!-- Verse selector -->
    <div v-if="!activeVerse" class="selector">
      <div class="selector-header">Symbol Designer</div>
      <div v-if="verses.length === 0" class="empty">No verses in path. Set a goal on the Home tab first.</div>
      <button v-for="v in verses" :key="v.ref" class="verse-btn" @click="loadVerse(v)">
        <span class="v-ref">{{ v.ref }}</span>
        <span class="v-preview">{{ v.text.slice(0, 55) }}…</span>
      </button>
    </div>

    <!-- Designer -->
    <template v-else>
      <div class="designer-header">
        <button class="back-btn" @click="activeVerse = null; selectedIndices = []">← Back</button>
        <span class="d-ref">{{ activeVerse.ref }}</span>
        <button v-if="selectedIndices.length > 0" class="reset-sel-btn" @click="selectedIndices = []">Reset</button>
      </div>

      <!-- Word grid -->
      <div class="words-area">
        <div v-for="(item, i) in resolvedWords" :key="i" class="word-cell">
          <div class="emoji-above">{{ item.span !== 0 ? (item.emoji || '') : '' }}</div>
          <button
            class="word-btn"
            :class="{
              selected: selectedIndices.includes(i),
              'has-emoji': item.emoji && item.span !== 0,
              covered: item.span === 0
            }"
            @click="clickWord(i)"
          >{{ item.word }}</button>
        </div>
      </div>

      <!-- Assignment panel -->
      <div v-if="selectedIndices.length > 0" class="assign-panel">
        <div class="selected-label">
          "<strong>{{ selectedPhrase }}</strong>"
          <button class="usage-link" @click="openSearch" title="Find usages in Bible">🔍</button>
        </div>
        <div class="input-row">
          <div class="ac-wrap">
            <input
              ref="emojiInputEl"
              v-model="emojiInput"
              class="emoji-inp"
              placeholder="Emoji or :shortcode:"
              @input="onEmojiInput"
              @keydown.enter.prevent="saveEmoji"
            />
            <div v-if="autocompleteItems.length > 0" class="autocomplete">
              <button
                v-for="ac in autocompleteItems"
                :key="ac.key"
                class="ac-item"
                @mousedown.prevent="emojiInput = ac.emoji; autocompleteItems = []"
              >
                <span class="ac-emoji">{{ ac.emoji }}</span>
                <span class="ac-key">:{{ ac.key }}:</span>
              </button>
            </div>
          </div>
          <button class="btn-save" @click="saveEmoji">Save</button>
          <button class="btn-del" @click="clearEmoji">✕</button>
        </div>
      </div>

      <!-- Quick emoji picker when nothing selected -->
      <div v-else class="hint-row">Tap words to select, then assign an emoji. Adjacent words form a phrase.</div>

      <!-- Built-in dictionary -->
      <div class="dict-section">
        <button class="dict-toggle" @click="showDict = !showDict">
          {{ showDict ? '▼' : '▶' }} Built-in dictionary ({{ dictEntries.length }})
        </button>
        <div v-if="showDict" class="dict-grid">
          <div v-for="[key, emoji] in dictEntries" :key="key" class="dict-entry">
            <span class="dict-word">{{ key }}</span>
            <span class="dict-emoji">{{ emoji }}</span>
          </div>
        </div>
      </div>
    </template>

    <!-- Usage search modal -->
    <div v-if="searchModal" class="modal-overlay" @click.self="searchModal = false">
      <div class="modal">
        <div class="modal-hdr">
          <span>Usages of "{{ searchPhrase }}"</span>
          <button class="modal-close" @click="searchModal = false">✕</button>
        </div>
        <div class="modal-filter">
          <select v-model="searchBook" class="book-sel">
            <option value="">All books</option>
            <option v-for="b in bibleBooks" :key="b" :value="b">{{ b }}</option>
          </select>
          <button class="btn-search" @click="runSearch">Search</button>
        </div>
        <div class="modal-results">
          <div v-if="searching" class="searching-msg">Searching…</div>
          <div v-else-if="searchRan && searchResults.length === 0" class="no-results">No usages found.</div>
          <button
            v-for="r in searchResults"
            :key="r.ref"
            class="result-item"
            @click="loadVerseFromSearch(r); searchModal = false"
          >
            <div class="result-ref">{{ r.ref }}</div>
            <div class="result-text" v-html="highlightPhrase(r.text)" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useVerseList } from '../composables/useVerseList.js'
import { useStorage } from '../composables/useStorage.js'
import { useBible, bookNames } from '../composables/useBible.js'

const { verses } = useVerseList()
const emojiMap = useStorage('userCustomEmojis', {})
const { bible } = useBible()

// Built-in emoji dictionary (Czech Bible words)
const emojiData = {
  "země": "🌍", "zemi": "🌍", "zem": "🌍",
  "nebe": "🌌", "nebi": "🌌",
  "hlas": "🔊", "hlasem": "🔊",
  "anděl": "😇", "anděla": "😇", "andělu": "😇", "andělů": "😇",
  "trůn": "🪑", "trůnu": "🪑", "trůnem": "🪑",
  "sedm": "7️⃣", "sedmi": "7️⃣",
  "tisíc": "🔢", "dvanáct": "🔢", "čtyři": "4️⃣", "první": "1️⃣",
  "moc": "⚡", "mocným": "⚡", "pravomoc": "⚡",
  "jméno": "📛",
  "město": "🏙️", "města": "🏙️",
  "moře": "🌊", "moři": "🌊",
  "krev": "🩸",
  "slunce": "☀️",
  "smrt": "💀",
  "šelma": "🐉", "šelmy": "🐉", "šelmě": "🐉",
  "drak": "🐉",
  "beránek": "🐑",
  "svitek": "📜", "svitku": "📜",
  "národy": "🌍", "kmene": "👥",
  "hvězd": "⭐", "hvězda": "⭐", "hvězdy": "⭐",
  "skutky": "🤲",
  "duch": "🕊️",
  "svědectví": "📜",
  "slávu": "🌟", "sláva": "🌟",
  "starších": "👴",
  "svatý": "✨", "svatých": "✨", "svatyně": "⛪",
  "amen": "🙏",
  "pán": "👑",
  "zvuk": "🔊",
  "bůh": "👑", "boha": "👑", "bohu": "👑", "boží": "👑",
  "slovo": "📖", "slova": "📖",
  "život": "🌱", "života": "🌱",
  "věky": "♾️", "věků": "♾️",
  "běda": "⚠️",
  "třetina": "3️⃣",
  "napiš": "✍️",
  "otevřel": "🚪",
  "uviděl": "👁️", "spatřil": "👁️", "viděl": "👁️",
  "uslyšel": "👂",
  "hle": "👁️",
  "seděl": "🪑", "sedí": "🪑",
  "vítězí": "🏆",
  "přijdu": "🚶",
  "uši": "👂",
  "veliký": "🔥", "veliké": "🔥", "veliká": "🔥",
  "čas": "⏳",
  "deset": "🔟",
  "vod": "💧",
  "padl": "⬇️",
  "slyš": "👂",
  "sboru": "⛪", "sborům": "⛪",
  "roh": "📯", "rohů": "📯",
  "lidé": "👥", "lidí": "👥", "lidi": "👥",
  "tři": "3️⃣", "třetí": "3️⃣",
  "dým": "🌫️",
  "proroctví": "📜",
  "všemohoucí": "⚡", "mocný": "⚡", "mocná": "⚡",
  "ostrý": "⚔️",
  "hlasy": "🔊",
  "živé": "🌱", "živých": "🌱",
  "bytosti": "🦁", "bytost": "🦁",
  "pane": "👑",
  "pečeť": "🔒",
  "zemětřesení": "🌋",
  "hněv": "⚡", "hněvu": "⚡",
  "zatroubil": "🎺",
  "bezedné": "🕳️", "propast": "🕳️", "propasti": "🕳️",
  "tělo": "🫀", "těla": "🫀",
  "cejch": "🔖",
  "srp": "🌾",
  "vylil": "🫗", "miska": "🫗", "misku": "🫗",
  "duchů": "🕊️",
  "král": "👑", "králů": "👑",
  "krví": "🩸",
  "tvář": "😊",
  "pokání": "🙏",
  "žena": "👩", "ženu": "👩",
  "očí": "👁️", "oko": "👁️", "oči": "👁️",
  "andělé": "😇",
  "obraz": "🖼️", "obrazu": "🖼️",
  "hospodin": "👑", "hospodina": "👑", "hospodinu": "👑",
  "hospodinův": "👑", "hospodinova": "👑", "hospodinem": "👑", "hospodine": "👑",
  "ježíš": "✝️", "ježíše": "✝️", "ježíšovi": "✝️",
  "izrael": "✡️", "izraele": "✡️", "izraeli": "✡️", "izraelovi": "✡️",
  "david": "👑", "davida": "👑", "davidovi": "👑",
  "mojžíš": "📜", "mojžíše": "📜", "mojžíšovi": "📜",
  "jeruzalém": "✡️", "jeruzaléma": "✡️", "jeruzalémě": "✡️",
  "syn": "👦", "syna": "👦", "synu": "👦", "synové": "👦", "syny": "👦", "synů": "👦", "synům": "👦",
  "otec": "👨", "otce": "👨", "otci": "👨", "otcem": "👨",
  "muž": "🧑", "muže": "🧑", "muži": "🧑", "mužem": "🧑",
  "člověk": "🧑", "člověka": "🧑", "člověku": "🧑",
  "lid": "👥", "lidu": "👥", "lide": "👥",
  "dům": "🏠", "domu": "🏠", "domě": "🏠", "domů": "🏠",
  "den": "📅", "dne": "📅", "dny": "📅", "dnů": "📅",
  "srdce": "❤️",
  "oběť": "🔥", "oběti": "🔥", "obětí": "🔥",
  "království": "👑",
  "místo": "📍", "místě": "📍", "místa": "📍",
  "ruka": "🤲", "ruky": "🤲", "ruce": "🤲", "rukou": "🤲",
  "zástup": "👥", "zástupů": "👥", "zástupy": "👥",
  "pokolení": "👥",
  "výrok": "📢",
  "pět": "5️⃣",
  "dva": "2️⃣", "dvě": "2️⃣",
}

const dictEntries = computed(() => Object.entries(emojiData))

// Czech-safe token cleaner
function cleanToken(s) {
  return (s || '').toLowerCase().replace(/[^\wÀ-ɏ'-]/g, '')
}

const activeVerse = ref(null)
const selectedIndices = ref([])
const emojiInput = ref('')
const emojiInputEl = ref(null)
const autocompleteItems = ref([])
const showDict = ref(false)

// Usage search state
const searchModal = ref(false)
const searchPhrase = ref('')
const searchBook = ref('')
const searchResults = ref([])
const searchRan = ref(false)
const searching = ref(false)

const bibleBooks = computed(() => bible.value ? bookNames(bible.value) : [])

// ---- Word data ----
const rawWords = computed(() => {
  if (!activeVerse.value) return []
  return activeVerse.value.text.replace(/[.,;:!?]/g, '').split(/\s+/).filter(Boolean)
})

// resolvedWords: sliding window 3→2→1, custom emoji then built-in
const resolvedWords = computed(() => {
  const words = rawWords.value
  if (!words.length) return []
  const result = []
  let i = 0
  while (i < words.length) {
    let matched = false
    for (let len = 3; len >= 1; len--) {
      if (i + len > words.length) continue
      const phrase = words.slice(i, i + len).map(w => cleanToken(w)).join(' ')
      // Check custom map first
      if (emojiMap.value[phrase]) {
        result.push({ word: words[i], phrase, emoji: emojiMap.value[phrase], span: len })
        for (let j = 1; j < len; j++) result.push({ word: words[i + j], phrase: null, emoji: '', span: 0 })
        i += len
        matched = true
        break
      }
      // Check built-in only for single words
      if (len === 1) {
        const builtIn = emojiData[phrase]
        if (builtIn) {
          result.push({ word: words[i], phrase, emoji: builtIn, span: 1 })
          i++
          matched = true
          break
        }
      }
    }
    if (!matched) {
      result.push({ word: words[i], phrase: null, emoji: '', span: 1 })
      i++
    }
  }
  return result
})

const selectedPhrase = computed(() =>
  selectedIndices.value.map(i => rawWords.value[i] ?? '').join(' ')
)

// ---- Selection logic (adjacent-only) ----
function clickWord(idx) {
  const sel = selectedIndices.value
  if (sel.includes(idx)) {
    selectedIndices.value = sel.filter(i => i !== idx)
  } else if (sel.length === 0) {
    selectedIndices.value = [idx]
  } else {
    const min = Math.min(...sel)
    const max = Math.max(...sel)
    if (idx === min - 1 || idx === max + 1) {
      selectedIndices.value = [...sel, idx].sort((a, b) => a - b)
    } else {
      selectedIndices.value = [idx]
    }
  }
  // Pre-fill emoji input with existing mapping
  const key = selectedIndices.value.map(i => cleanToken(rawWords.value[i] ?? '')).join(' ')
  const existing = emojiMap.value[key] || ''
  emojiInput.value = existing
  autocompleteItems.value = []
  nextTick(() => emojiInputEl.value?.focus())
}

// ---- Emoji autocomplete ----
function onEmojiInput() {
  const val = emojiInput.value
  if (val.startsWith(':') && val.length > 1) {
    const q = val.slice(1).toLowerCase()
    autocompleteItems.value = Object.entries(emojiData)
      .filter(([k]) => k.includes(q))
      .slice(0, 5)
      .map(([key, emoji]) => ({ key, emoji }))
  } else {
    autocompleteItems.value = []
  }
}

// ---- Save / clear ----
function saveEmoji() {
  if (!selectedIndices.value.length || !emojiInput.value.trim()) return
  const key = selectedIndices.value.map(i => cleanToken(rawWords.value[i] ?? '')).join(' ')
  emojiMap.value = { ...emojiMap.value, [key]: emojiInput.value.trim() }
  selectedIndices.value = []
  emojiInput.value = ''
  autocompleteItems.value = []
}

function clearEmoji() {
  if (!selectedIndices.value.length) return
  const key = selectedIndices.value.map(i => cleanToken(rawWords.value[i] ?? '')).join(' ')
  const updated = { ...emojiMap.value }
  delete updated[key]
  emojiMap.value = updated
  emojiInput.value = ''
  selectedIndices.value = []
}

// ---- Verse loading ----
function loadVerse(v) {
  activeVerse.value = v
  selectedIndices.value = []
  emojiInput.value = ''
}

function loadVerseFromSearch(r) {
  activeVerse.value = { ref: r.ref, text: r.text }
  selectedIndices.value = []
  emojiInput.value = ''
}

// ---- Usage search ----
function openSearch() {
  searchPhrase.value = selectedPhrase.value
  searchResults.value = []
  searchRan.value = false
  searchBook.value = ''
  searchModal.value = true
}

function runSearch() {
  if (!bible.value || !searchPhrase.value) return
  searching.value = true
  searchResults.value = []
  const phrase = searchPhrase.value.toLowerCase()
  setTimeout(() => {
    const results = []
    const books = searchBook.value ? [searchBook.value] : Object.keys(bible.value)
    for (const bk of books) {
      const chapters = bible.value[bk]?.chapters ?? []
      for (let ci = 0; ci < chapters.length; ci++) {
        for (let vi = 0; vi < chapters[ci].length; vi++) {
          const text = chapters[ci][vi]
          if (text.toLowerCase().includes(phrase)) {
            results.push({ ref: `${bk} ${ci + 1}:${vi + 1}`, text })
            if (results.length >= 80) { searching.value = false; searchRan.value = true; searchResults.value = results; return }
          }
        }
      }
    }
    searchResults.value = results
    searching.value = false
    searchRan.value = true
  }, 10)
}

function highlightPhrase(text) {
  const escaped = searchPhrase.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>')
}
</script>

<style scoped>
.symbols {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
}

/* Selector */
.selector { display: flex; flex-direction: column; }

.selector-header {
  padding: 16px;
  font-size: 18px;
  font-weight: 700;
  color: #f9fafb;
  border-bottom: 1px solid #1f2937;
}

.empty {
  padding: 40px 20px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}

.verse-btn {
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

.v-ref { font-size: 13px; font-weight: 700; color: #58cc02; }
.v-preview { font-size: 13px; color: #9ca3af; }

/* Designer header */
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

.d-ref {
  flex: 1;
  font-weight: 700;
  font-size: 14px;
  color: #58cc02;
}

.reset-sel-btn {
  background: #374151;
  border: none;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 12px;
  padding: 6px 10px;
  cursor: pointer;
}

/* Word grid */
.words-area {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 8px;
  padding: 16px;
}

.word-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.emoji-above {
  font-size: 18px;
  min-height: 22px;
  text-align: center;
  line-height: 1;
}

.word-btn {
  background: #1f2937;
  border: 2px solid #374151;
  border-radius: 8px;
  color: #f9fafb;
  font-size: 14px;
  padding: 6px 10px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.word-btn.has-emoji {
  border-color: #3b82f6;
  color: #bfdbfe;
}

.word-btn.selected {
  background: #1d4ed8;
  border-color: #60a5fa;
  color: #fff;
}

.word-btn.covered {
  opacity: 0.4;
  cursor: default;
}

/* Assignment panel */
.assign-panel {
  background: #1f2937;
  border-top: 1px solid #374151;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.selected-label {
  font-size: 14px;
  color: #d1d5db;
  display: flex;
  align-items: center;
  gap: 8px;
}

.selected-label strong { color: #f9fafb; }

.usage-link {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  line-height: 1;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ac-wrap {
  flex: 1;
  position: relative;
}

.emoji-inp {
  width: 100%;
  background: #111827;
  border: 2px solid #374151;
  border-radius: 10px;
  color: #f9fafb;
  font-size: 18px;
  padding: 10px 12px;
  outline: none;
  box-sizing: border-box;
}

.emoji-inp:focus { border-color: #58cc02; }

.autocomplete {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #111827;
  border: 1px solid #374151;
  border-radius: 10px;
  overflow: hidden;
  z-index: 20;
}

.ac-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  background: none;
  border: none;
  border-bottom: 1px solid #1f2937;
  padding: 10px 12px;
  cursor: pointer;
  text-align: left;
}

.ac-item:last-child { border-bottom: none; }
.ac-item:active { background: #1f2937; }

.ac-emoji { font-size: 22px; }
.ac-key { font-size: 13px; color: #9ca3af; font-family: monospace; }

.btn-save {
  background: #58cc02;
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  padding: 10px 16px;
  cursor: pointer;
  white-space: nowrap;
}

.btn-del {
  background: #374151;
  border: none;
  border-radius: 10px;
  color: #9ca3af;
  font-size: 16px;
  padding: 10px 12px;
  cursor: pointer;
}

.hint-row {
  padding: 12px 16px;
  font-size: 13px;
  color: #6b7280;
  font-style: italic;
}

/* Dictionary */
.dict-section {
  border-top: 1px solid #1f2937;
  padding: 12px 16px;
}

.dict-toggle {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.dict-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.dict-entry {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #1f2937;
  border-radius: 8px;
  padding: 4px 8px;
}

.dict-word { font-size: 12px; color: #9ca3af; }
.dict-emoji { font-size: 16px; }

/* Search modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: flex-end;
  z-index: 100;
}

.modal {
  background: #111827;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-hdr {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #1f2937;
  font-size: 15px;
  font-weight: 700;
  color: #f9fafb;
}

.modal-close {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 20px;
  cursor: pointer;
}

.modal-filter {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #1f2937;
}

.book-sel {
  flex: 1;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 8px;
  color: #f9fafb;
  font-size: 14px;
  padding: 8px 10px;
  outline: none;
}

.btn-search {
  background: #3b82f6;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  padding: 8px 16px;
  cursor: pointer;
}

.modal-results {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.searching-msg, .no-results {
  padding: 24px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  border-bottom: 1px solid #1f2937;
  padding: 12px 16px;
  text-align: left;
  cursor: pointer;
  width: 100%;
}

.result-ref {
  font-size: 12px;
  font-weight: 700;
  color: #58cc02;
}

.result-text {
  font-size: 13px;
  color: #d1d5db;
  line-height: 1.5;
}

.result-text :deep(mark) {
  background: #854d0e;
  color: #fef08a;
  border-radius: 2px;
  padding: 0 1px;
}
</style>
