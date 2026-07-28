<template>
  <div class="td">
    <!-- ── Working through one item ─────────────────────── -->
    <template v-if="active">
      <header class="td-run-head">
        <button class="td-back" data-testid="run-back" @click="leaveActive">← Today</button>
        <span class="td-run-label">{{ active.label }}</span>
      </header>

      <VerseScaffold
        v-if="active.kind === 'verse' && versePhase === 'warmup'"
        :key="`${active.id}-${warmupMode}`"
        :verse="active.payload"
        :mode="warmupMode"
        @done="versePhase = 'recall'"
        @next="nextExercise"
      />

      <VerseRecall
        v-else-if="active.kind === 'verse'"
        :key="active.id"
        :verse="active.payload"
        :note="noteFor(active.payload)"
        @done="finish"
      />

      <QuestionTrainer
        v-else-if="active.kind === 'question'"
        :key="active.id"
        :cards="[active.payload]"
        assess
        @assess="finish"
      />

      <template v-else>
        <ClozeTrainer :key="active.id" :passage="active.payload" @progress="clozeStats = $event" />
        <button
          class="btn btn-primary td-finish"
          data-testid="cloze-finish"
          :disabled="!clozeStats.finished"
          @click="finish(gradeCloze(clozeStats))"
        >
          {{ clozeStats.finished ? 'Done' : `${clozeStats.total - clozeStats.correct - clozeStats.revealed} left` }}
        </button>
      </template>
    </template>

    <template v-else-if="detail">
      <header class="td-run-head">
        <button class="td-back" data-testid="detail-back" @click="detail = null">← Today</button>
        <span class="td-run-label">Verse details</span>
      </header>

      <article class="td-detail">
        <p class="prose-ref">{{ detail.payload.ref }}</p>
        <p class="prose td-detail-text">{{ detail.payload.text }}</p>

        <section class="td-detail-status">
          <p class="td-detail-label">Memory status</p>
          <p>{{ isKnown(detail.id) ? 'Known' : 'Learning' }}</p>
          <button
            v-if="isKnown(detail.id)"
            class="btn btn-ghost"
            data-testid="mark-learning"
            @click="markLearning(detail.id)"
          >
            Mark as learning again
          </button>
        </section>
      </article>
    </template>

    <!-- ── The day's list ───────────────────────────────── -->
    <template v-else>
      <header class="td-head">
        <div>
          <p class="td-kicker">Your rhythm</p>
          <h2 class="td-title">Today</h2>
        </div>
        <span class="td-count" data-testid="today-count">{{ done }} / {{ orderedItems.length }}</span>
      </header>

      <p v-if="currentSet" class="td-set" data-testid="current-set">
        {{ currentSet.name }}
        <button class="td-change" data-testid="change-set" @click="picking = !picking">
          {{ picking ? 'Close' : 'Change' }}
        </button>
      </p>

      <SetPicker v-if="picking || !currentSet" data-testid="set-picker" @chosen="picking = false" />

      <div v-if="!currentSet" />

      <div v-else-if="picking" />

      <div v-else-if="orderedItems.length === 0" class="td-empty" data-testid="today-empty">
        <p class="td-empty-title">This set is empty</p>
        <p class="td-empty-sub">
          Add verses or a study set to start practising.
        </p>
      </div>

      <template v-else>
        <ul class="td-list">
          <li v-for="(item, index) in orderedItems" :key="item.id" class="td-row" :style="{ '--item-index': index }">
            <button
                class="td-item"
                data-testid="today-item"
                :class="{ done: isDoneToday(item.id), known: isKnown(item.id) }"
                :disabled="isDoneToday(item.id)"
                @click="start(item)"
              >
                <span class="td-mark">{{ isKnown(item.id) ? '✓' : '○' }}</span>
                <span class="td-item-label">{{ item.label }}</span>
                <span class="td-kind">{{ kindLabel(item) }}</span>
            </button>
            <button
              v-if="item.kind === 'verse'"
              class="td-detail-button"
              data-testid="verse-detail"
              :aria-label="`Details for ${item.label}`"
              @click="detail = item"
            >•••</button>
          </li>
        </ul>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import VerseRecall from '../components/study/VerseRecall.vue'
import VerseScaffold from '../components/study/VerseScaffold.vue'
import QuestionTrainer from '../components/study/QuestionTrainer.vue'
import ClozeTrainer from '../components/study/ClozeTrainer.vue'
import SetPicker from '../components/SetPicker.vue'
import { useQueue } from '../composables/useQueue.js'
import { usePalaceNotes } from '../composables/usePalaceNotes.js'

const emit = defineEmits(['navigate'])

const picking = ref(false)

const { items, orderedItems, isDoneToday, isKnown, markLearning, grade, currentSet } =
  useQueue()

const { getNote } = usePalaceNotes()

const active = ref(null)
const detail = ref(null)
const versePhase = ref('warmup')
const warmupMode = ref('blanks')
const clozeStats = ref({ total: 0, correct: 0, revealed: 0, finished: false })

const done = computed(() => orderedItems.value.filter((item) => isDoneToday(item.id)).length)

function kindLabel(item) {
  if (item.kind === 'verse') return 'verse'
  if (item.kind === 'question') return 'question'
  return `${item.blankCount} blanks`
}

function noteFor(verse) {
  if (!verse?.book) return ''
  return getNote(verse.book, verse.chapter, verse.verseIdx)
}

// A cloze grades itself: the app already knows how many you recovered
// unaided, so asking you to rate it as well would be busywork.
function gradeCloze({ total, correct }) {
  if (!total) return 'shaky'
  if (correct === total) return 'got'
  return correct / total >= 0.5 ? 'shaky' : 'lost'
}

function finish(result) {
  if (active.value?.kind === 'verse' && result !== 'got') {
    // A warm-up helps, but only a clean full recall completes this verse.
    // You can always use ← Today to stop for now without receiving credit.
    versePhase.value = 'warmup'
    warmupMode.value = Math.random() < 0.5 ? 'blanks' : 'initials'
    return
  }
  if (active.value) grade(active.value.id, result)
  leaveActive()
  clozeStats.value = { total: 0, correct: 0, revealed: 0, finished: false }
}

function start(item) {
  active.value = item
  versePhase.value = 'warmup'
  warmupMode.value = Math.random() < 0.5 ? 'blanks' : 'initials'
}

function nextExercise() {
  // With two scaffold types, switching guarantees a genuinely different
  // exercise instead of occasionally serving the same one twice in a row.
  warmupMode.value = warmupMode.value === 'blanks' ? 'initials' : 'blanks'
}

function leaveActive() {
  active.value = null
  versePhase.value = 'warmup'
}
</script>

<style scoped>
.td {
  padding: var(--space-5) var(--space-4) var(--space-10);
}

.td-kicker { margin-bottom: 1px; color: var(--primary); font-size: 10px; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }

.td-set {
  font-size: var(--text-sm);
  color: var(--muted-foreground);
  margin-bottom: var(--space-1);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.td-change {
  background: none;
  border: none;
  color: var(--primary);
  font: inherit;
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  padding: var(--space-2) 0;
  min-height: 44px;
}

.td-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.td-title {
  font-size: var(--text-2xl);
  font-weight: 700;
  letter-spacing: -.045em;
}

.td-count {
  font-size: var(--text-sm);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--primary);
  background: var(--accent);
  border-radius: var(--radius-full);
  padding: 5px 9px;
}

.td-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.td-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  animation: item-in 360ms both;
  animation-delay: calc(var(--item-index) * 45ms);
}

.td-item {
  width: 100%;
  flex: 1;
  min-height: 56px;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background: linear-gradient(135deg, var(--card), color-mix(in srgb, var(--card) 88%, var(--accent)));
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  color: var(--foreground);
  font: inherit;
  text-align: left;
  padding: var(--space-3) var(--space-4);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: border-color var(--transition), transform var(--transition), box-shadow var(--transition);
}

.td-item:hover:not(:disabled) { border-color: var(--primary); transform: translateY(-2px); box-shadow: var(--shadow-md); }

.td-item.done {
  color: var(--muted-foreground);
  background: color-mix(in srgb, var(--card) 55%, transparent);
}

.td-item.known .td-mark {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--primary-foreground);
}

.td-mark {
  display: grid;
  width: 25px;
  height: 25px;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--primary) 35%, var(--border));
  border-radius: var(--radius-full);
  color: var(--primary);
  flex-shrink: 0;
}

.td-item-label {
  flex: 1;
  font-weight: 500;
}

.td-kind {
  font-size: var(--text-xs);
  color: var(--muted-foreground);
  flex-shrink: 0;
}

.td-detail-button {
  min-width: 32px;
  min-height: 32px;
  border: 0;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--muted-foreground);
  font: inherit;
  font-size: var(--text-xs);
  letter-spacing: 1px;
  cursor: pointer;
}

.td-detail-button:hover { background: var(--muted); color: var(--foreground); }

@keyframes item-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

.td-detail { padding: var(--space-2) var(--space-1); }
.td-detail-text { margin: var(--space-4) 0 var(--space-8); }
.td-detail-status { border-top: 1px solid var(--border); padding-top: var(--space-5); }
.td-detail-label { margin-bottom: var(--space-1); color: var(--muted-foreground); font-size: var(--text-xs); font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.td-detail-status .btn { margin-top: var(--space-4); }

.td-empty {
  text-align: center;
  padding: var(--space-12) var(--space-4);
}

.td-empty-title {
  font-size: var(--text-lg);
  font-weight: 700;
  margin-bottom: var(--space-2);
}

.td-empty-sub {
  font-size: var(--text-sm);
  color: var(--muted-foreground);
  line-height: var(--leading-normal);
}

.td-run-head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.td-back {
  background: none;
  border: none;
  color: var(--muted-foreground);
  font: inherit;
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  padding: var(--space-2) 0;
  min-height: 44px;
}

.td-run-label {
  font-size: var(--text-sm);
  color: var(--muted-foreground);
}

.td-finish {
  width: 100%;
  margin-top: var(--space-5);
}
</style>
