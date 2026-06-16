<template>
  <div class="more">
    <!-- ByHeart mode -->
    <template v-if="mode === 'byheart'">
      <div class="mode-header">
        <button class="back-btn" @click="mode = null">← More</button>
        <span>ByHeart</span>
      </div>

      <div v-if="!byHeartVerse" class="list">
        <div class="list-header">Pick a verse</div>
        <button
          v-for="v in verses"
          :key="v.ref"
          class="list-item"
          @click="startByHeart(v)"
        >{{ v.ref }}</button>
      </div>

      <template v-else>
        <div class="byheart-card">
          <div class="ref">{{ byHeartVerse.ref }}</div>
          <div class="byheart-words">
            <span
              v-for="(w, i) in bhWords"
              :key="i"
              class="bh-word"
              :class="{ blank: bhBlanks.includes(i), revealed: bhRevealed.includes(i), active: i === bhCurrent }"
            >
              <template v-if="bhBlanks.includes(i) && !bhRevealed.includes(i)">
                <span v-if="i === bhCurrent" class="bh-input-wrapper">
                  <input
                    ref="bhInputEl"
                    v-model="bhInput"
                    class="bh-input"
                    @keydown.enter="checkBhWord"
                    @keydown.space.prevent="checkBhWord"
                  />
                </span>
                <span v-else class="blank-line">{{ '_'.repeat(w.length) }}</span>
              </template>
              <template v-else>{{ w }}</template>
            </span>
          </div>
        </div>

        <div class="bh-controls">
          <div class="difficulty-row">
            <span class="diff-label">Difficulty:</span>
            <button
              v-for="d in difficulties"
              :key="d.label"
              :class="['diff-btn', { active: difficulty === d.ratio }]"
              @click="difficulty = d.ratio; resetByHeart()"
            >{{ d.label }}</button>
          </div>
          <button class="btn-reveal" @click="revealNext">Reveal next</button>
          <button class="btn-reset" @click="resetByHeart">Reset</button>
        </div>
      </template>
    </template>

    <!-- Drill mode -->
    <template v-else-if="mode === 'drill'">
      <div class="mode-header">
        <button class="back-btn" @click="mode = null">← More</button>
        <span>Drill Mode</span>
      </div>

      <div v-if="!drillVerse" class="list">
        <div class="list-header">Pick a verse</div>
        <button
          v-for="v in verses"
          :key="v.ref"
          class="list-item"
          @click="startDrill(v)"
        >{{ v.ref }}</button>
      </div>

      <template v-else>
        <div class="drill-card">
          <div class="ref">{{ drillVerse.ref }}</div>
          <textarea
            v-model="drillInput"
            class="drill-input"
            rows="5"
            placeholder="Type the verse from memory…"
          />
          <button v-if="!drillResult" class="btn-check" @click="checkDrill">Check</button>
          <div v-else class="drill-result">
            <div class="diff-html" v-html="drillResult" />
            <button class="btn-reset" @click="resetDrill">Try again</button>
          </div>
        </div>
      </template>
    </template>

    <!-- More menu -->
    <template v-else>
      <div class="menu-header">More</div>

      <div class="menu-list">
        <button class="menu-item" @click="mode = 'byheart'">
          <span class="menu-icon">🧠</span>
          <div class="menu-text">
            <div class="menu-title">ByHeart</div>
            <div class="menu-desc">Fill in missing words</div>
          </div>
          <span class="chevron">›</span>
        </button>

        <button class="menu-item" @click="mode = 'drill'">
          <span class="menu-icon">✍️</span>
          <div class="menu-text">
            <div class="menu-title">Drill Mode</div>
            <div class="menu-desc">Type the full verse, see diffs</div>
          </div>
          <span class="chevron">›</span>
        </button>
      </div>

      <div class="stats-section">
        <div class="stats-title">Your Stats</div>
        <div class="stat-row">
          <span>🔥 Streak</span><strong>{{ streak }} days</strong>
        </div>
        <div class="stat-row">
          <span>⚡ Total XP</span><strong>{{ xp }}</strong>
        </div>
        <div class="stat-row">
          <span>📚 Verses saved</span><strong>{{ verses.length }}</strong>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useVerseList } from '../composables/useVerseList.js'
import { useProgress } from '../composables/useProgress.js'

const { verses } = useVerseList()
const { streak, xp } = useProgress()

const mode = ref(null)

// --- ByHeart ---
const byHeartVerse = ref(null)
const difficulty = ref(0.5)
const difficulties = [
  { label: 'Easy', ratio: 0.2 },
  { label: 'Medium', ratio: 0.5 },
  { label: 'Hard', ratio: 0.8 },
  { label: 'Extreme', ratio: 1.0 },
]

const bhWords = computed(() => byHeartVerse.value?.text.split(' ') ?? [])
const bhBlanks = ref([])
const bhRevealed = ref([])
const bhCurrent = ref(-1)
const bhInput = ref('')
const bhInputEl = ref(null)

function startByHeart(v) {
  byHeartVerse.value = v
  resetByHeart()
}

function resetByHeart() {
  const words = byHeartVerse.value?.text.split(' ') ?? []
  const count = Math.ceil(words.length * difficulty.value)
  const indices = [...Array(words.length).keys()].sort(() => Math.random() - 0.5).slice(0, count)
  bhBlanks.value = indices.sort((a, b) => a - b)
  bhRevealed.value = []
  bhCurrent.value = bhBlanks.value[0] ?? -1
  bhInput.value = ''
}

function checkBhWord() {
  const word = bhWords.value[bhCurrent.value]
  const correct = bhInput.value.trim().toLowerCase() === word.toLowerCase()
  if (correct) {
    bhRevealed.value = [...bhRevealed.value, bhCurrent.value]
    bhInput.value = ''
    const nextIdx = bhBlanks.value.find(i => !bhRevealed.value.includes(i) && i > bhCurrent.value)
    bhCurrent.value = nextIdx ?? -1
  }
}

function revealNext() {
  const next = bhBlanks.value.find(i => !bhRevealed.value.includes(i))
  if (next !== undefined) bhRevealed.value = [...bhRevealed.value, next]
}

// --- Drill ---
const drillVerse = ref(null)
const drillInput = ref('')
const drillResult = ref(null)

function startDrill(v) {
  drillVerse.value = v
  drillInput.value = ''
  drillResult.value = null
}

function checkDrill() {
  const target = drillVerse.value.text.split(' ')
  const attempt = drillInput.value.trim().split(/\s+/)
  let html = ''
  const maxLen = Math.max(target.length, attempt.length)
  for (let i = 0; i < maxLen; i++) {
    const t = target[i] || ''
    const a = attempt[i] || ''
    if (a.toLowerCase() === t.toLowerCase()) {
      html += `<span class="correct">${a}</span> `
    } else if (!a) {
      html += `<span class="missing">[${t}]</span> `
    } else {
      html += `<span class="wrong">${a}</span><span class="expected">(${t})</span> `
    }
  }
  drillResult.value = html.trim()
}

function resetDrill() {
  drillInput.value = ''
  drillResult.value = null
}
</script>

<style scoped>
.more {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
}

.mode-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #1f2937;
  font-size: 16px;
  font-weight: 700;
  color: #f9fafb;
}

.back-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 14px;
  cursor: pointer;
}

.list { display: flex; flex-direction: column; }

.list-header {
  padding: 14px 16px;
  font-size: 13px;
  color: #6b7280;
  border-bottom: 1px solid #1f2937;
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

/* ByHeart */
.byheart-card {
  background: #1f2937;
  margin: 16px;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ref { font-size: 12px; font-weight: 700; color: #58cc02; text-transform: uppercase; letter-spacing: 0.1em; }

.byheart-words {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  line-height: 2;
}

.bh-word { font-size: 16px; color: #f9fafb; }

.blank-line { color: #374151; letter-spacing: 2px; }

.bh-input {
  background: #111827;
  border: 2px solid #58cc02;
  border-radius: 6px;
  color: #f9fafb;
  font-size: 15px;
  padding: 2px 6px;
  width: 80px;
  outline: none;
}

.bh-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 16px 16px;
}

.difficulty-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.diff-label { font-size: 13px; color: #6b7280; }

.diff-btn {
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 13px;
  padding: 6px 10px;
  cursor: pointer;
}

.diff-btn.active { border-color: #58cc02; color: #58cc02; }

.btn-reveal, .btn-reset {
  padding: 12px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.btn-reveal { background: #374151; color: #f9fafb; }
.btn-reset  { background: #1f2937; color: #9ca3af; }

/* Drill */
.drill-card {
  background: #1f2937;
  margin: 16px;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.drill-input {
  background: #111827;
  border: 2px solid #374151;
  border-radius: 10px;
  color: #f9fafb;
  font-size: 16px;
  padding: 12px;
  resize: none;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}

.drill-input:focus { border-color: #58cc02; }

.btn-check {
  background: #58cc02;
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  padding: 14px;
  cursor: pointer;
}

.diff-html :deep(.correct)  { color: #58cc02; }
.diff-html :deep(.wrong)    { color: #ff4b4b; text-decoration: line-through; }
.diff-html :deep(.missing)  { color: #f59e0b; }
.diff-html :deep(.expected) { color: #6b7280; font-size: 12px; }

/* Menu */
.menu-header {
  padding: 20px 16px 8px;
  font-size: 22px;
  font-weight: 800;
  color: #f9fafb;
}

.menu-list { display: flex; flex-direction: column; gap: 1px; padding: 8px 0; }

.menu-item {
  display: flex;
  align-items: center;
  gap: 14px;
  background: none;
  border: none;
  border-bottom: 1px solid #1f2937;
  padding: 16px;
  cursor: pointer;
  width: 100%;
  text-align: left;
}

.menu-icon { font-size: 28px; }

.menu-text { flex: 1; display: flex; flex-direction: column; gap: 2px; }

.menu-title { font-size: 16px; font-weight: 600; color: #f9fafb; }

.menu-desc { font-size: 13px; color: #6b7280; }

.chevron { font-size: 22px; color: #4b5563; }

.stats-section {
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stats-title { font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; }

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  color: #d1d5db;
}

.stat-row strong { color: #f9fafb; font-size: 16px; }
</style>
