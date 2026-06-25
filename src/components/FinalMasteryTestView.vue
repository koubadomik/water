<template>
  <div class="mastery-test">

    <!-- Summary screen -->
    <template v-if="done">
      <div class="summary">
        <div class="summary-icon">{{ failedVerses.length === 0 ? '🏆' : '💪' }}</div>
        <h2 class="summary-title">{{ failedVerses.length === 0 ? 'Path Complete!' : 'Test Done' }}</h2>
        <p class="summary-stats">{{ masteredCount }} / {{ verses.length }} mastered</p>
        <div class="summary-actions">
          <button data-testid="new-goal" class="btn btn-primary" @click="emit('done', { action: 'new', failedVerses })">
            🎯 Set New Goal
          </button>
          <button
            v-if="failedVerses.length > 0"
            data-testid="extend-path"
            class="btn btn-secondary"
            @click="emit('done', { action: 'extend', failedVerses })"
          >
            🔄 Extend Path ({{ failedVerses.length }} need work)
          </button>
        </div>
      </div>
    </template>

    <!-- Test screen -->
    <template v-else>
      <div class="test-header">
        <div class="test-title">Final Mastery Test</div>
        <div class="test-progress">{{ testIdx + 1 }} / {{ verses.length }}</div>
      </div>

      <div class="card">
        <div class="ref-large">{{ current.ref }}</div>

        <textarea
          v-if="!submitted"
          v-model="answer"
          class="textarea"
          rows="5"
          placeholder="Type the full verse from memory…"
          @keydown.ctrl.enter="submit"
        />

        <template v-if="submitted">
          <div class="diff-output" v-html="diffHtml" />
          <div class="self-assess">
            <p class="assess-prompt">Did you get it?</p>
            <div class="assess-row">
              <button data-testid="got-it" class="btn assess-yes" @click="assess(true)">✓ Got it</button>
              <button data-testid="needs-more" class="btn assess-no" @click="assess(false)">✗ Needs more work</button>
            </div>
          </div>
        </template>
      </div>

      <button v-if="!submitted" data-testid="submit" class="btn" @click="submit">Submit</button>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  verses: { type: Array, required: true },
})
const emit = defineEmits(['done'])

const testIdx = ref(0)
const answer = ref('')
const submitted = ref(false)
const diffHtml = ref('')
const failedVerses = ref([])
const done = ref(false)

const current = computed(() => props.verses[testIdx.value])
const masteredCount = computed(() => props.verses.length - failedVerses.value.length)

function normalize(s) {
  return s.trim().toLowerCase().replace(/[^a-záéíóúůýžšřčďťňě0-9\s]/g, '')
}

function buildDiff(target, attempt) {
  const tw = target.split(' ')
  const aw = attempt.trim().split(/\s+/).filter(Boolean)
  let html = ''
  const len = Math.max(tw.length, aw.length)
  for (let i = 0; i < len; i++) {
    const t = tw[i] || ''
    const a = aw[i] || ''
    if (!a) html += `<span class="d-missing">[${t}]</span> `
    else if (normalize(a) === normalize(t)) html += `<span class="d-correct">${a}</span> `
    else if (!t) html += `<span class="d-extra">${a}</span> `
    else html += `<span class="d-wrong">${a}</span><span class="d-expected">(${t})</span> `
  }
  return html.trim()
}

function submit() {
  diffHtml.value = buildDiff(current.value.text, answer.value)
  submitted.value = true
}

function assess(gotIt) {
  if (!gotIt) {
    failedVerses.value = [...failedVerses.value, current.value]
  }
  if (testIdx.value < props.verses.length - 1) {
    testIdx.value++
    answer.value = ''
    submitted.value = false
    diffHtml.value = ''
  } else {
    done.value = true
  }
}
</script>

<style scoped>
.mastery-test {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 16px;
  gap: 16px;
  overflow-y: auto;
}

.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.test-title {
  font-size: 13px;
  font-weight: 700;
  color: #58cc02;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.test-progress {
  font-size: 13px;
  color: #6b7280;
}

.card {
  background: #1f2937;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ref-large {
  font-size: 24px;
  font-weight: 800;
  color: #58cc02;
  text-align: center;
}

.textarea {
  background: #111827;
  border: 2px solid #374151;
  border-radius: 12px;
  color: #f9fafb;
  font-size: 16px;
  padding: 12px;
  resize: none;
  outline: none;
  width: 100%;
}
.textarea:focus { border-color: #58cc02; }

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

.self-assess { display: flex; flex-direction: column; gap: 10px; }
.assess-prompt { font-size: 14px; color: #9ca3af; }
.assess-row { display: flex; gap: 10px; }

.btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  background: #58cc02;
  color: #fff;
  width: 100%;
}

.btn-primary { background: #58cc02; color: #fff; box-shadow: 0 4px 0 #3d8f00; }
.btn-secondary { background: #1f2937; border: 2px solid #374151; color: #9ca3af; box-shadow: none; }
.assess-yes { background: #58cc02; color: #fff; }
.assess-no  { background: #374151; color: #d1d5db; }

/* Summary */
.summary {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px 16px;
  text-align: center;
}

.summary-icon { font-size: 64px; }
.summary-title { font-size: 28px; font-weight: 800; color: #f9fafb; }
.summary-stats { font-size: 18px; color: #9ca3af; }
.summary-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 320px;
  margin-top: 8px;
}
</style>
