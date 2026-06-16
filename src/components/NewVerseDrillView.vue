<template>
  <div class="drill">
    <div data-testid="step-indicator" class="step-indicator">
      Step {{ stepIdx + 1 }} / {{ STEPS.length }} &middot; {{ stepLabel }}
    </div>

    <!-- READ -->
    <template v-if="step === 'read'">
      <div class="card">
        <div class="ref">{{ verse.ref }}</div>
        <div class="text">{{ verse.text }}</div>
      </div>
      <button data-testid="continue" class="btn" @click="next">Got it</button>
    </template>

    <!-- SYMBOLIC -->
    <template v-else-if="step === 'symbolic'">
      <div class="card">
        <div class="ref">{{ verse.ref }}</div>
        <div class="words">
          <span v-for="w in words" :key="w" class="word">{{ w }}</span>
        </div>
      </div>
      <button data-testid="continue" class="btn" @click="next">Continue</button>
    </template>

    <!-- SCRAMBLE -->
    <template v-else-if="step === 'scramble'">
      <div class="card">
        <div class="built">{{ built.join(' ') || '…tap words below…' }}</div>
        <div class="scramble-words">
          <button
            v-for="(w, i) in scrambled"
            :key="i"
            class="word-btn"
            :disabled="used.includes(i)"
            @click="pick(i)"
          >{{ w }}</button>
        </div>
      </div>
      <button data-testid="continue" class="btn" @click="next">Skip / Reveal</button>
    </template>

    <!-- MISSING WORD -->
    <template v-else-if="step === 'missing-word'">
      <div class="card">
        <div class="text">{{ gappedText }}</div>
        <template v-if="!feedback">
          <input type="text" v-model="answer" class="input" placeholder="Type the missing word…" />
        </template>
        <div v-else data-testid="feedback" :class="correct ? 'correct' : 'incorrect'">
          {{ correct ? 'Correct!' : `It was: "${missingWord}"` }}
        </div>
      </div>
      <button data-testid="continue" class="btn" @click="feedback ? next() : checkMissing()">
        {{ feedback ? 'Continue' : 'Check' }}
      </button>
    </template>

    <!-- SPOT ERROR -->
    <template v-else-if="step === 'spot-error'">
      <div class="card">
        <div class="text">
          <span
            v-for="(w, i) in errorWords"
            :key="i"
            class="word-tap"
            :class="{ selected: tapped === i, wrong: feedback && i === errorIdx, right: feedback && i !== errorIdx }"
            @click="tapWord(i)"
          >{{ w }} </span>
        </div>
        <div v-if="feedback" data-testid="feedback" :class="spotOk ? 'correct' : 'incorrect'">
          {{ spotOk ? 'Found it!' : `The error was "${errorWords[errorIdx]}"` }}
        </div>
      </div>
      <button data-testid="continue" class="btn" @click="feedback ? next() : skipSpot()">
        {{ feedback ? 'Continue' : 'Skip' }}
      </button>
    </template>

    <!-- FULL RECALL -->
    <template v-else-if="step === 'full-recall'">
      <div class="card">
        <div class="ref">{{ verse.ref }}</div>
        <textarea v-if="!feedback" v-model="answer" class="textarea" rows="4" placeholder="Type the whole verse…" />
        <template v-if="feedback">
          <div data-testid="feedback" :class="correct ? 'correct' : 'incorrect'">
            {{ correct ? 'Excellent!' : 'Keep going!' }}
          </div>
          <div class="text">{{ verse.text }}</div>
        </template>
      </div>
      <button data-testid="continue" class="btn" @click="feedback ? next() : checkRecall()">
        {{ feedback ? 'Continue' : 'Check' }}
      </button>
    </template>

    <!-- PALACE NOTE -->
    <template v-else-if="step === 'palace-note'">
      <div class="card">
        <div class="label">Write your memory palace note:</div>
        <textarea v-model="noteInput" class="textarea" rows="3" placeholder="e.g. Picture a glowing heart…" />
      </div>
      <button data-testid="continue" class="btn" @click="saveNote">Save &amp; Done</button>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  verse: { type: Object, required: true },
})

const emit = defineEmits(['done'])

const STEPS = ['read', 'symbolic', 'scramble', 'missing-word', 'spot-error', 'full-recall', 'palace-note']
const LABELS = {
  'read': 'Read',
  'symbolic': 'Symbolic Reveal',
  'scramble': 'Word Scramble',
  'missing-word': 'Missing Word',
  'spot-error': 'Spot the Error',
  'full-recall': 'Full Recall',
  'palace-note': 'Palace Note',
}

const stepIdx = ref(0)
const step = computed(() => STEPS[stepIdx.value])
const stepLabel = computed(() => LABELS[step.value])

// shared state reset per step
const answer = ref('')
const feedback = ref(false)
const correct = ref(false)

function next() {
  answer.value = ''
  feedback.value = false
  correct.value = false
  tapped.value = null
  built.value = []
  used.value = []
  if (stepIdx.value < STEPS.length - 1) {
    stepIdx.value++
  } else {
    emit('done')
  }
}

// Computed helpers
const words = computed(() => props.verse.text.split(' '))

// --- SCRAMBLE ---
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const scrambled = computed(() => shuffle(words.value))
const built = ref([])
const used = ref([])

function pick(i) {
  built.value.push(scrambled.value[i])
  used.value.push(i)
}

// --- MISSING WORD ---
const missingIdx = computed(() => Math.floor(words.value.length / 2))
const missingWord = computed(() => words.value[missingIdx.value])
const gappedText = computed(() =>
  words.value.map((w, i) => (i === missingIdx.value ? '___' : w)).join(' ')
)

function checkMissing() {
  correct.value = answer.value.trim().toLowerCase() === missingWord.value.toLowerCase()
  feedback.value = true
}

// --- SPOT ERROR ---
const errorIdx = computed(() => Math.floor(words.value.length * 0.6))
const errorWords = computed(() => {
  const ws = [...words.value]
  ws[errorIdx.value] = ws[errorIdx.value] + 's'
  return ws
})
const tapped = ref(null)
const spotOk = ref(false)

function tapWord(i) {
  tapped.value = i
  spotOk.value = i === errorIdx.value
  feedback.value = true
}

function skipSpot() {
  feedback.value = true
  spotOk.value = false
}

// --- FULL RECALL ---
function normalize(s) {
  return s.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '')
}

function checkRecall() {
  correct.value = normalize(answer.value) === normalize(props.verse.text)
  feedback.value = true
}

// --- PALACE NOTE ---
const noteInput = ref(props.verse.note || '')

function saveNote() {
  emit('done', { note: noteInput.value })
}
</script>

<style scoped>
.drill {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 16px;
  flex: 1;
}

.step-indicator {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.card {
  width: 100%;
  max-width: 480px;
  background: #1f2937;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ref {
  font-size: 12px;
  font-weight: 700;
  color: #58cc02;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.text {
  font-size: 18px;
  line-height: 1.6;
  color: #f9fafb;
}

.words {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.word {
  background: #374151;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 16px;
  color: #f9fafb;
}

.built {
  font-size: 16px;
  color: #d1d5db;
  min-height: 28px;
  line-height: 1.5;
}

.scramble-words {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.word-btn {
  background: #374151;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  color: #f9fafb;
  font-size: 15px;
  cursor: pointer;
}

.word-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.input {
  width: 100%;
  background: #111827;
  border: 2px solid #374151;
  border-radius: 10px;
  color: #f9fafb;
  font-size: 16px;
  padding: 10px 12px;
  outline: none;
}

.input:focus { border-color: #58cc02; }

.textarea {
  width: 100%;
  background: #111827;
  border: 2px solid #374151;
  border-radius: 10px;
  color: #f9fafb;
  font-size: 16px;
  padding: 10px 12px;
  outline: none;
  resize: none;
  box-sizing: border-box;
}

.textarea:focus { border-color: #58cc02; }

.word-tap {
  cursor: pointer;
  border-radius: 4px;
  padding: 1px 2px;
  transition: background 0.1s;
}

.word-tap.selected { background: #374151; }
.word-tap.wrong     { background: #ff4b4b44; color: #ff4b4b; }
.word-tap.right     { opacity: 0.5; }

.correct   { color: #58cc02; font-weight: 700; font-size: 15px; }
.incorrect { color: #ff4b4b; font-weight: 700; font-size: 15px; }

.label {
  font-size: 14px;
  color: #9ca3af;
}

.btn {
  width: 100%;
  max-width: 480px;
  padding: 16px;
  background: #58cc02;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  border: none;
  border-radius: 12px;
  cursor: pointer;
}
</style>
