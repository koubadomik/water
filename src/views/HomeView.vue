<template>
  <div class="home">

    <!-- Goal setup -->
    <div v-if="showGoalSetup" class="goal-setup">
      <div class="goal-hero">
        <div class="goal-icon">📖</div>
        <h2>Set Your Goal</h2>
        <p>Choose a verse range to memorize.</p>
      </div>

      <div v-if="bibleLoading" class="goal-loading">Loading Bible…</div>
      <div v-else-if="bibleError" class="goal-error">
        Could not load Bible. Go to the Palace tab to upload a local file, then come back.
      </div>

      <template v-else>
        <div class="goal-form">
          <div class="form-group">
            <label class="form-label">Book</label>
            <select v-model="goalBook" class="form-select" @change="goalChapter = 1; goalStartVerse = 1; goalEndVerse = 1">
              <option value="" disabled>Select book…</option>
              <option v-for="b in allBooks" :key="b" :value="b">{{ b }}</option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Chapter</label>
              <select v-model="goalChapter" class="form-select" @change="goalStartVerse = 1; goalEndVerse = 1">
                <option v-for="n in chapterCount" :key="n" :value="n">{{ n }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">From verse</label>
              <select v-model="goalStartVerse" class="form-select">
                <option v-for="n in verseCount" :key="n" :value="n">{{ n }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">To verse</label>
              <select v-model="goalEndVerse" class="form-select">
                <option v-for="n in verseCount" :key="n" :value="n" :disabled="n < goalStartVerse">{{ n }}</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Intensity</label>
            <div class="intensity-row">
              <button
                v-for="opt in intensityOptions"
                :key="opt.value"
                class="intensity-btn"
                :class="{ active: goalIntensity === opt.value }"
                @click="goalIntensity = opt.value"
              >
                <span class="int-label">{{ opt.label }}</span>
                <span class="int-desc">{{ opt.desc }}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="goal-footer">
          <button class="btn-generate" :disabled="!goalBook" @click="generatePath">
            Generate Path
          </button>
          <button v-if="verses.length > 0" class="btn-cancel" @click="showGoalSetup = false">
            Cancel
          </button>
        </div>
      </template>
    </div>

    <!-- Skip button during active session -->
    <button
      v-else-if="sessionActive && phase !== 'celebration'"
      class="btn-skip"
      @click="advance"
    >Skip ›</button>

    <!-- Session in progress -->
    <template v-if="!showGoalSetup && sessionActive">
      <PalaceWalkView
        v-if="phase === 'palace-walk'"
        :verses="sessionVerses"
        @done="advance"
      />
      <RandomReviewView
        v-else-if="phase === 'random-review'"
        :verses="reviewVerses"
        @done="onReviewDone"
      />
      <NewVerseDrillView
        v-else-if="phase === 'new-verse-drill'"
        :verse="currentVerse"
        @done="onDrillDone"
      />
      <CelebrationView
        v-else-if="phase === 'celebration'"
        :xp="sessionXp"
        :streak="streak"
        @done="endSession"
      />
    </template>

    <!-- Path map -->
    <template v-else-if="!showGoalSetup && !sessionActive">
      <div class="path-header">
        <div>
          <h2>Your Path</h2>
          <p class="subtitle">{{ goalSummary }}</p>
        </div>
        <button class="btn-change-goal" @click="confirmChangeGoal">Change Goal</button>
      </div>

      <div class="path">
        <div
          v-for="(verse, i) in verses"
          :key="verse.ref"
          class="path-node-row"
          :class="{ offset: i % 2 === 1 }"
        >
          <div class="node-reorder">
            <button class="reorder-btn" :disabled="i === 0" @click="moveUp(verse.ref)">▲</button>
            <button class="reorder-btn" :disabled="i === verses.length - 1" @click="moveDown(verse.ref)">▼</button>
          </div>
          <button class="path-node" :class="{ drilled: verse.drilledAt }" @click="startSessionFor(verse)">
            <span class="node-num">{{ i + 1 }}</span>
            <span v-if="verse.drilledAt" class="node-check">✓</span>
          </button>
          <div class="node-label">
            {{ verse.ref }}
            <span v-if="verse.note || palaceNote(verse)" class="note-badge">📝</span>
          </div>
          <button class="btn-delete-verse" :aria-label="'Remove ' + verse.ref" @click="confirmRemove(verse)">×</button>
        </div>
      </div>

      <div class="start-bar">
        <button class="btn-start" @click="startSession">Start Today's Session</button>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import PalaceWalkView from '../components/PalaceWalkView.vue'
import RandomReviewView from '../components/RandomReviewView.vue'
import NewVerseDrillView from '../components/NewVerseDrillView.vue'
import CelebrationView from '../components/CelebrationView.vue'
import { useVerseList } from '../composables/useVerseList.js'
import { useProgress } from '../composables/useProgress.js'
import { useSession } from '../composables/useSession.js'
import { usePalaceNotes } from '../composables/usePalaceNotes.js'
import { useBible, bookNames, getChapter } from '../composables/useBible.js'

const { verses, updateDrilled, updateNote, moveUp, moveDown, removeVerse, setVerses } = useVerseList()
const { streak, completeSession } = useProgress()
const session = useSession()
const { phase, advance, addXp } = session
const { getNote, setNote } = usePalaceNotes()
const { bible, loading: bibleLoading, error: bibleError } = useBible()

// --- Goal setup ---
const savedGoal = (() => {
  try { return JSON.parse(localStorage.getItem('goalMeta') || 'null') } catch { return null }
})()

const showGoalSetup = ref(verses.value.length === 0)
const goalBook = ref(savedGoal?.book ?? '')
const goalChapter = ref(savedGoal?.chapter ?? 1)
const goalStartVerse = ref(savedGoal?.startVerse ?? 1)
const goalEndVerse = ref(savedGoal?.endVerse ?? 1)
const goalIntensity = ref(savedGoal?.intensity ?? 3)

const intensityOptions = [
  { value: 1, label: 'Fast',         desc: '1× per verse' },
  { value: 3, label: 'Rigorous',     desc: '3× per verse' },
  { value: 5, label: 'Deep Mastery', desc: '5× per verse' },
]

const allBooks = computed(() => bookNames(bible.value))

const chapterCount = computed(() => {
  if (!bible.value || !goalBook.value) return 1
  return bible.value[goalBook.value]?.chapters?.length ?? 1
})

const verseCount = computed(() => {
  if (!bible.value || !goalBook.value) return 1
  const ch = getChapter(bible.value, goalBook.value, goalChapter.value)
  return ch.length || 1
})

// clamp chapter/verse when book changes
watch(chapterCount, (max) => { if (goalChapter.value > max) goalChapter.value = max })
watch(verseCount, (max) => {
  if (goalStartVerse.value > max) goalStartVerse.value = max
  if (goalEndVerse.value > max) goalEndVerse.value = max
})

const goalSummary = computed(() => {
  if (!savedGoal) return `${verses.value.length} verse${verses.value.length !== 1 ? 's' : ''}`
  const { book, chapter, startVerse, endVerse } = savedGoal
  const range = endVerse > startVerse ? `${startVerse}–${endVerse}` : `${startVerse}`
  return `${book} ${chapter}:${range} · ${verses.value.length} verse${verses.value.length !== 1 ? 's' : ''}`
})

function generatePath() {
  if (!bible.value || !goalBook.value) return
  const ch = getChapter(bible.value, goalBook.value, goalChapter.value)
  const start = Math.min(goalStartVerse.value, goalEndVerse.value)
  const end = Math.max(goalStartVerse.value, goalEndVerse.value)
  const newVerses = []
  for (let vi = start - 1; vi <= end - 1; vi++) {
    const text = ch[vi]
    if (!text) continue
    for (let rep = 0; rep < goalIntensity.value; rep++) {
      newVerses.push({
        ref: `${goalBook.value} ${goalChapter.value}:${vi + 1}`,
        text,
        book: goalBook.value,
        chapter: goalChapter.value,
        verseIdx: vi,
      })
    }
  }
  if (newVerses.length === 0) return alert('No verses found in that range.')
  setVerses(newVerses)
  const meta = {
    book: goalBook.value, chapter: goalChapter.value,
    startVerse: start, endVerse: end, intensity: goalIntensity.value,
  }
  localStorage.setItem('goalMeta', JSON.stringify(meta))
  showGoalSetup.value = false
}

function confirmChangeGoal() {
  if (confirm('Set a new goal? Your current progress badges will be kept but the verse list will be replaced.')) {
    showGoalSetup.value = true
  }
}

// --- Session ---
const sessionActive = ref(false)
const sessionXp = ref(0)
const currentVerse = ref(null)

function palaceNote(verse) {
  if (!verse.book) return ''
  return getNote(verse.book, verse.chapter, verse.verseIdx)
}

const sessionVerses = computed(() => verses.value.map(v => ({
  ref: v.ref,
  text: v.text,
  note: (v.book ? getNote(v.book, v.chapter, v.verseIdx) : '') || v.note || '',
})))

const reviewVerses = computed(() => {
  const shuffled = [...verses.value].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(2, shuffled.length))
})

function startSession() {
  if (verses.value.length === 0) return
  currentVerse.value = verses.value[Math.floor(Math.random() * verses.value.length)]
  sessionXp.value = 0
  session.reset()
  sessionActive.value = true
}

function startSessionFor(verse) {
  currentVerse.value = verse
  sessionXp.value = 0
  session.reset()
  sessionActive.value = true
}

function onReviewDone() {
  sessionXp.value += 20
  addXp(20)
  advance()
}

function onDrillDone(payload) {
  sessionXp.value += 50
  addXp(50)
  const v = currentVerse.value
  if (v) {
    updateDrilled(v.ref)
    const note = payload?.note ?? ''
    if (note) {
      updateNote(v.ref, note)
      if (v.book) setNote(v.book, v.chapter, v.verseIdx, note)
    }
  }
  advance()
}

function confirmRemove(verse) {
  if (confirm('Remove ' + verse.ref + ' from your list?')) removeVerse(verse.ref)
}

function endSession() {
  completeSession(sessionXp.value)
  sessionActive.value = false
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  position: relative;
}

/* ---- Goal setup ---- */
.goal-setup {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px 16px 40px;
  flex: 1;
}

.goal-hero {
  text-align: center;
}

.goal-icon { font-size: 48px; }

.goal-hero h2 {
  font-size: 24px;
  font-weight: 800;
  color: #f9fafb;
  margin: 8px 0 4px;
}

.goal-hero p { font-size: 14px; color: #6b7280; }

.goal-loading, .goal-error {
  text-align: center;
  color: #6b7280;
  font-size: 14px;
  padding: 20px;
}

.goal-error { color: #f59e0b; }

.goal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #1f2937;
  border-radius: 16px;
  padding: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.form-select {
  background: #111827;
  border: 1px solid #374151;
  border-radius: 10px;
  color: #f9fafb;
  font-size: 15px;
  padding: 10px 12px;
  outline: none;
  width: 100%;
}

.form-select:focus { border-color: #58cc02; }

.form-row {
  display: flex;
  gap: 10px;
}

.intensity-row {
  display: flex;
  gap: 8px;
}

.intensity-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: #111827;
  border: 2px solid #374151;
  border-radius: 12px;
  padding: 10px 4px;
  cursor: pointer;
  transition: border-color 0.15s;
}

.intensity-btn.active {
  border-color: #58cc02;
  background: #14532d;
}

.int-label {
  font-size: 13px;
  font-weight: 700;
  color: #f9fafb;
}

.int-desc {
  font-size: 11px;
  color: #6b7280;
}

.goal-footer {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-generate {
  width: 100%;
  padding: 18px;
  background: #58cc02;
  color: #fff;
  font-size: 17px;
  font-weight: 800;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  box-shadow: 0 4px 0 #3d8f00;
}

.btn-generate:disabled {
  opacity: 0.4;
  cursor: default;
  box-shadow: none;
}

.btn-cancel {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 14px;
  cursor: pointer;
  padding: 8px;
  text-align: center;
}

/* ---- Path map ---- */
.path-header {
  padding: 20px 16px 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.path-header h2 {
  font-size: 22px;
  font-weight: 800;
  color: #f9fafb;
}

.subtitle {
  font-size: 13px;
  color: #6b7280;
  margin-top: 2px;
}

.btn-change-goal {
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 10px;
  color: #9ca3af;
  font-size: 12px;
  padding: 6px 12px;
  cursor: pointer;
  white-space: nowrap;
  margin-top: 2px;
}

.path {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 16px 100px;
}

.path-node-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  position: relative;
}

.path-node-row.offset {
  align-self: flex-end;
  margin-right: 60px;
}

.node-reorder {
  position: absolute;
  left: -44px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.reorder-btn {
  background: none;
  border: none;
  color: #4b5563;
  font-size: 12px;
  padding: 2px 6px;
  cursor: pointer;
  line-height: 1;
}

.reorder-btn:disabled { opacity: 0.2; cursor: default; }
.reorder-btn:not(:disabled):hover { color: #9ca3af; }

.path-node {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #58cc02;
  border: 4px solid #3d8f00;
  box-shadow: 0 4px 0 #2d6b00;
  color: #fff;
  font-size: 20px;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s, box-shadow 0.1s;
}

.path-node:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 #2d6b00;
}

.path-node.drilled {
  background: #3d8f00;
  border-color: #2d6b00;
}

.node-check {
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 11px;
  font-weight: 900;
  color: #a3e635;
  line-height: 1;
}

.node-label {
  font-size: 11px;
  color: #9ca3af;
  text-align: center;
  max-width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.note-badge { font-size: 12px; }

.btn-delete-verse {
  position: absolute;
  right: -36px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #4b5563;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 4px 6px;
}

.btn-delete-verse:hover { color: #ef4444; }

.start-bar {
  position: fixed;
  bottom: 70px;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: linear-gradient(to top, #111827 70%, transparent);
  display: flex;
  justify-content: center;
}

.btn-start {
  width: 100%;
  max-width: 400px;
  padding: 18px;
  background: #58cc02;
  color: #fff;
  font-size: 17px;
  font-weight: 800;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  box-shadow: 0 4px 0 #3d8f00;
}

.btn-skip {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  color: #4b5563;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
  z-index: 10;
}

.btn-skip:hover { color: #9ca3af; }
</style>
