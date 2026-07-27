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

          <button
            v-else-if="state[seg.marker]?.done"
            :class="['cz-filled', state[seg.marker].outcome]"
            data-testid="cloze-filled"
            :title="`Hide ${seg.marker} again`"
            @click="hide(seg.marker)"
          >
            <span class="cz-marker">{{ seg.marker }}</span>

            <template v-if="state[seg.marker].diff?.attempted">
              <template v-for="(w, wi) in state[seg.marker].diff.words" :key="wi"
                ><span :class="['cz-w', w.status]">{{ w.value }}</span>{{ ' ' }}</template
              >
              <s v-if="state[seg.marker].diff.extra.length" class="cz-extra" data-testid="cloze-extra">{{
                state[seg.marker].diff.extra.join(' ')
              }}</s>
            </template>
            <template v-else>{{ seg.value }}</template>
          </button>

          <button
            v-else-if="mode === 'reveal'"
            class="cz-blank"
            data-testid="cloze-blank"
            @click="reveal(seg.marker, seg.value)"
          >
            <span class="cz-marker">{{ seg.marker }}</span><span class="cz-rule" />
          </button>

          <span v-else :class="['cz-input-wrap', { wrong: wrong[seg.marker] }]">
            <span class="cz-marker">{{ seg.marker }}</span>
            <input
              :ref="(el) => setInputRef(seg.marker, el)"
              v-model="typed[seg.marker]"
              class="cz-input"
              data-testid="cloze-input"
              type="text"
              autocomplete="off"
              autocapitalize="off"
              autocorrect="off"
              spellcheck="false"
              :enterkeyhint="isLastBlank(seg.marker) ? 'done' : 'next'"
              @input="onInput(seg.marker)"
              @focus="scrollIntoView($event.target)"
              @keydown.enter.prevent="submit(seg.marker, seg.value)"
              @blur="check(seg.marker, seg.value)"
            />
            <button class="cz-give" title="Show me" @click="reveal(seg.marker, seg.value)">?</button>
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
import { ref, computed, reactive, watch, nextTick } from 'vue'
import { answersMatch } from '../../lib/matchAnswer.js'
import { diffWords } from '../../lib/diffWords.js'

const props = defineProps({
  passage: { type: Object, required: true },
})

// The queue grades a cloze from its own result, so the tally is published
// rather than the user being asked to rate what the app already measured.
const emit = defineEmits(['progress'])

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

const stats = computed(() => {
  const entries = blanks.value.map((b) => state[b.marker])
  return {
    total: total.value,
    correct: entries.filter((e) => e?.outcome === 'correct').length,
    revealed: entries.filter((e) => e?.outcome === 'revealed').length,
    finished: entries.every((e) => e?.done),
  }
})

watch(stats, (val) => emit('progress', val), { immediate: true })

// Inputs keep a fixed width. Growing them with the typed text re-wrapped the
// whole paragraph on every keystroke, and sizing them to the answer would
// give away its length.

const inputEls = {}

function setInputRef(marker, el) {
  if (el) inputEls[marker] = el
  else delete inputEls[marker]
}

function isLastBlank(marker) {
  const remaining = blanks.value.filter((b) => !state[b.marker]?.done)
  return remaining[remaining.length - 1]?.marker === marker
}

function scrollIntoView(el) {
  // Without this the field you just focused can sit behind the keyboard.
  el?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
}

// Enter checks and moves on, so the keyboard never has to be dismissed to
// reach the next blank.
async function submit(marker, expected) {
  check(marker, expected)
  await nextTick()
  const order = blanks.value.map((b) => b.marker)
  const rest = order.slice(order.indexOf(marker) + 1).concat(order.slice(0, order.indexOf(marker)))
  const next = rest.find((m) => inputEls[m])
  if (next) {
    inputEls[next].focus()
    scrollIntoView(inputEls[next])
  }
}

function solve(marker) {
  state[marker] = { done: true, outcome: 'correct', diff: null }
  delete wrong[marker]
}

// Handing over the answer is only useful alongside what you had — the diff
// says which words you were missing rather than just what the phrase was.
function reveal(marker, expected) {
  state[marker] = { done: true, outcome: 'revealed', diff: diffWords(typed[marker], expected) }
  delete wrong[marker]
}

function hide(marker) {
  delete state[marker]
}

function check(marker, expected, { force = false } = {}) {
  if (state[marker]?.done) return
  const attempt = typed[marker]?.trim()
  // Blur fires this too, so an untouched field stays neutral rather than
  // flashing an error just because you tapped elsewhere. Check all forces
  // the verdict, and an empty answer is a wrong one.
  if (!attempt && !force) return
  if (attempt && answersMatch(attempt, expected)) solve(marker)
  else wrong[marker] = true
}

function checkAll() {
  for (const b of blanks.value) check(b.marker, b.value, { force: true })
}

// Editing clears the verdict so the next check reads as a fresh attempt.
function onInput(marker) {
  delete wrong[marker]
}

function revealAll() {
  for (const b of blanks.value) if (!state[b.marker]?.done) reveal(b.marker, b.value)
}

function reset() {
  for (const k of Object.keys(state)) delete state[k]
  for (const k of Object.keys(typed)) delete typed[k]
  for (const k of Object.keys(wrong)) delete wrong[k]
}

// Tap and Type are separate exercises, not two views of one. Switching
// starts the passage over rather than carrying answers across.
function setMode(next) {
  if (next === mode.value) return
  reset()
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
  min-height: 44px;
  padding: 0 var(--space-4);
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
  position: relative;
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

.cz-blank::after,
.cz-filled::after {
  content: '';
  position: absolute;
  inset-inline: 0;
  top: 50%;
  height: 44px;
  transform: translateY(-50%);
}

.cz-rule {
  display: inline-block;
  width: 5em;
  border-bottom: 1.5px dotted var(--muted-foreground);
}

/* Recalled and given-up read differently, so a glance over the
   passage shows what you actually knew. Tapping one hides it again. */
.cz-filled {
  position: relative;
  border: none;
  border-radius: var(--radius-sm);
  padding: 1px var(--space-2);
  margin: 0 2px;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: var(--success-surface);
}

.cz-filled.revealed {
  background: var(--warning-surface);
}

/* Words you had, versus the ones you were missing. */
.cz-w.missing {
  font-weight: 600;
  color: var(--warning);
  text-decoration: underline;
  text-decoration-style: wavy;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}

.cz-extra {
  color: var(--muted-foreground);
  font-size: 0.9em;
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
  width: 9em;
  max-width: 55vw;
  background: none;
  border: none;
  outline: none;
  color: var(--foreground);
  font-family: var(--font-reading);
  font-size: var(--text-base); /* 16px — stops iOS zoom-on-focus */
  padding: 0;
}

.cz-give {
  position: relative;
  background: none;
  border: none;
  color: var(--muted-foreground);
  font-family: var(--font-ui);
  font-size: var(--text-base);
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  padding: 0 var(--space-1);
}

/* The glyph stays small so it sits in the line, but the tap area is a
   full-size target. Absolutely placed, so growing it shifts nothing. */
.cz-give::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 44px;
  height: 44px;
  transform: translate(-50%, -50%);
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
