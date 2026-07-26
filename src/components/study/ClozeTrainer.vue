<template>
  <div class="cz">
    <div class="cz-head">
      <div class="cz-progress">
        <span class="cz-count">{{ solved }} / {{ total }}</span>
        <div class="cz-bar"><div class="cz-fill" :style="{ width: pct + '%' }" /></div>
      </div>
      <div class="cz-modes">
        <button :class="['cz-mode', { on: mode === 'reveal' }]" @click="setMode('reveal')">Tap</button>
        <button :class="['cz-mode', { on: mode === 'type' }]" @click="setMode('type')">Type</button>
      </div>
    </div>

    <div class="cz-body prose">
      <p v-for="v in passage.verses" :key="v.n" class="prose-verse">
        <span class="prose-num">{{ v.n }}</span>
        <template v-for="(seg, i) in v.segments" :key="i">
          <span v-if="seg.type === 'text'">{{ seg.value }}</span>

          <span v-else-if="state[seg.marker]?.done" :class="['cz-filled', state[seg.marker].missed && 'missed']">
            <span class="cz-marker">{{ seg.marker }}</span>{{ seg.value }}
          </span>

          <button
            v-else-if="mode === 'reveal'"
            class="cz-blank"
            data-testid="cloze-blank"
            @click="give(seg.marker, true)"
          >
            <span class="cz-marker">{{ seg.marker }}</span><span class="cz-rule" />
          </button>

          <span v-else :class="['cz-input-wrap', { wrong: wrong[seg.marker] }]">
            <span class="cz-marker">{{ seg.marker }}</span>
            <input
              v-model="typed[seg.marker]"
              class="cz-input"
              data-testid="cloze-input"
              type="text"
              autocomplete="off"
              autocapitalize="off"
              autocorrect="off"
              spellcheck="false"
              enterkeyhint="done"
              :style="{ width: inputWidth(seg.marker) }"
              @keydown.enter.prevent="check(seg.marker, seg.value)"
              @blur="check(seg.marker, seg.value)"
            />
            <button class="cz-give" title="Show me" @click="give(seg.marker, true)">?</button>
          </span>
        </template>
      </p>
    </div>

    <div class="cz-actions">
      <button class="btn btn-ghost" @click="reset">Reset</button>
      <button v-if="mode === 'type'" class="btn btn-ghost" @click="checkAll">Check all</button>
      <button class="btn btn-primary" @click="revealAll">Reveal all</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { answersMatch } from '../../lib/matchAnswer.js'

const props = defineProps({
  passage: { type: Object, required: true },
})

const mode = ref('reveal')
const state = reactive({})
const typed = reactive({})
const wrong = reactive({})

const blanks = computed(() =>
  props.passage.verses.flatMap((v) => v.segments.filter((s) => s.type === 'blank')),
)
const total = computed(() => blanks.value.length)
const solved = computed(() => Object.values(state).filter((s) => s.done).length)
const pct = computed(() => (total.value ? Math.round((solved.value / total.value) * 100) : 0))

function inputWidth(marker) {
  // Sized by what you've typed, never by the answer — the length is a hint.
  return Math.max(10, (typed[marker]?.length ?? 0) + 2) + 'ch'
}

// missed = the answer was handed over rather than recalled
function give(marker, missed) {
  state[marker] = { done: true, missed }
  delete wrong[marker]
}

function check(marker, expected) {
  // Blur fires this too, so an untouched field must stay neutral rather
  // than flashing an error just because you tapped elsewhere.
  if (state[marker]?.done || !typed[marker]?.trim()) return
  if (answersMatch(typed[marker], expected)) {
    give(marker, false)
  } else {
    wrong[marker] = true
    setTimeout(() => delete wrong[marker], 500)
  }
}

function checkAll() {
  for (const b of blanks.value) {
    if (!state[b.marker]?.done && typed[b.marker]) check(b.marker, b.value)
  }
}

function revealAll() {
  for (const b of blanks.value) if (!state[b.marker]?.done) give(b.marker, true)
}

function reset() {
  for (const k of Object.keys(state)) delete state[k]
  for (const k of Object.keys(typed)) delete typed[k]
  for (const k of Object.keys(wrong)) delete wrong[k]
}

function setMode(next) {
  mode.value = next
}
</script>

<style scoped>
.cz-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}

.cz-progress {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.cz-count {
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.cz-bar {
  flex: 1;
  height: 6px;
  background: var(--surface);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.cz-fill {
  height: 100%;
  background: var(--primary);
  border-radius: var(--radius-full);
  transition: width var(--transition-md);
}

.cz-modes {
  display: flex;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  padding: 2px;
}

.cz-mode {
  background: none;
  border: none;
  color: var(--text-muted);
  font: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 5px 14px;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background var(--transition), color var(--transition);
}

.cz-mode.on {
  background: var(--primary);
  color: var(--primary-foreground);
}

/* Blanks sit inside running text, so they must not disturb the
   line rhythm — extra leading keeps the chips from colliding. */
.cz-body :deep(.prose-verse) { line-height: 2.2; }

.cz-marker {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  color: var(--primary);
  font-weight: 700;
  margin-right: var(--space-1);
  vertical-align: 0.15em;
}

.cz-blank {
  display: inline-flex;
  align-items: baseline;
  background: var(--muted);
  border: 1px solid var(--input);
  border-radius: var(--radius-sm);
  padding: 2px var(--space-2);
  margin: 0 2px;
  font: inherit;
  cursor: pointer;
  transition: border-color var(--transition), background var(--transition);
}

.cz-blank:hover {
  border-color: var(--primary);
}

.cz-rule {
  display: inline-block;
  width: 5em;
  border-bottom: 1.5px dotted var(--muted-foreground);
}

/* Recalled and given-up read differently, so a glance over the
   passage shows what you actually knew. */
.cz-filled {
  background: var(--success-surface);
  border-radius: var(--radius-sm);
  padding: 1px var(--space-2);
  margin: 0 2px;
}

.cz-filled.missed {
  background: var(--warning-surface);
}

.cz-input-wrap {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  background: var(--card);
  border: 1px solid var(--input);
  border-radius: var(--radius-sm);
  padding: 1px var(--space-2);
  margin: 0 2px;
}

.cz-input-wrap:focus-within { border-color: var(--primary); }

.cz-input-wrap.wrong {
  border-color: var(--danger);
  animation: cz-shake 0.35s;
}

@keyframes cz-shake {
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.cz-input {
  background: none;
  border: none;
  outline: none;
  color: var(--text);
  font: inherit;
  padding: 0;
}

.cz-give {
  background: none;
  border: none;
  color: var(--text-muted);
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0 2px;
}

.cz-give:hover {
  color: var(--primary);
}

.cz-actions {
  display: flex;
  gap: 10px;
  margin-top: 22px;
}

.cz-actions .btn {
  flex: 1;
}
</style>
