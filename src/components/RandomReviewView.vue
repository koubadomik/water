<template>
  <div class="review">
    <div v-if="current.isWildcard" class="wildcard-badge">📚 From history</div>
    <div class="prompt">Type this verse from memory:</div>
    <div class="verse-ref">{{ current.ref }}</div>

    <template v-if="!submitted">
      <textarea
        v-model="answer"
        class="input"
        placeholder="Type the verse…"
        rows="4"
      />
      <button data-testid="submit" class="btn" @click="submit">Check</button>
    </template>

    <template v-else>
      <div data-testid="feedback" class="feedback">
        <div class="feedback-label" :class="correct ? 'label-correct' : 'label-incorrect'">
          {{ correct ? 'Great recall!' : 'Keep practicing' }}
        </div>
        <div class="diff-output" v-html="diffHtml" />
      </div>
      <button data-testid="continue" class="btn" @click="onContinue">
        {{ isLast ? 'Done' : 'Next verse' }}
      </button>
    </template>

    <div class="position">{{ idx + 1 }} / {{ verses.length }}</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  verses: { type: Array, required: true },
})

const emit = defineEmits(['done'])

const idx = ref(0)
const answer = ref('')
const submitted = ref(false)
const correct = ref(false)
const diffHtml = ref('')

const current = computed(() => props.verses[idx.value])
const isLast = computed(() => idx.value === props.verses.length - 1)

function normalize(s) {
  return s.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '')
}

function buildDiff(target, attempt) {
  const tw = target.split(' ')
  const aw = attempt.trim().split(/\s+/).filter(Boolean)
  let html = ''
  const len = Math.max(tw.length, aw.length)
  for (let i = 0; i < len; i++) {
    const t = tw[i] || ''
    const a = aw[i] || ''
    if (!a) {
      html += `<span class="d-missing">[${t}]</span> `
    } else if (normalize(a) === normalize(t)) {
      html += `<span class="d-correct">${a}</span> `
    } else if (!t) {
      html += `<span class="d-extra">${a}</span> `
    } else {
      html += `<span class="d-wrong">${a}</span><span class="d-expected">(${t})</span> `
    }
  }
  return html.trim()
}

function similarity(attempt, target) {
  const aw = normalize(attempt).split(/\s+/).filter(Boolean)
  const tw = normalize(target).split(/\s+/).filter(Boolean)
  if (tw.length === 0) return 1
  let matches = 0
  const len = Math.max(aw.length, tw.length)
  for (let i = 0; i < tw.length; i++) {
    if (aw[i] === tw[i]) matches++
  }
  return matches / len
}

function submit() {
  correct.value = similarity(answer.value, current.value.text) >= 0.8
  diffHtml.value = buildDiff(current.value.text, answer.value)
  submitted.value = true
}

function onContinue() {
  if (isLast.value) {
    emit('done')
  } else {
    idx.value++
    answer.value = ''
    submitted.value = false
    diffHtml.value = ''
  }
}
</script>

<style scoped>
.review {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px 16px;
  flex: 1;
}

.prompt { font-size: 14px; color: #6b7280; }
.wildcard-badge { font-size: 12px; font-weight: 700; color: #58cc02; background: #14532d; border-radius: 20px; padding: 4px 10px; }

.verse-ref {
  font-size: 18px;
  font-weight: 700;
  color: #58cc02;
}

.input {
  width: 100%;
  max-width: 480px;
  background: #1f2937;
  border: 2px solid #374151;
  border-radius: 12px;
  color: #f9fafb;
  font-size: 16px;
  padding: 12px;
  resize: none;
  outline: none;
}

.input:focus { border-color: #58cc02; }

.feedback {
  width: 100%;
  max-width: 480px;
  background: #1f2937;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.feedback-label { font-weight: 700; font-size: 15px; }
.label-correct  { color: #58cc02; }
.label-incorrect { color: #ff4b4b; }

.diff-output {
  font-size: 15px;
  line-height: 1.8;
  color: #d1d5db;
}

.diff-output :deep(.d-correct)  { color: #58cc02; }
.diff-output :deep(.d-wrong)    { color: #ff4b4b; text-decoration: line-through; }
.diff-output :deep(.d-missing)  { color: #f59e0b; }
.diff-output :deep(.d-extra)    { color: #9ca3af; font-style: italic; }
.diff-output :deep(.d-expected) { color: #6b7280; font-size: 12px; margin-left: 1px; }

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

.position { font-size: 13px; color: #6b7280; }
</style>
