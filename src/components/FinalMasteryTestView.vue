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
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.test-progress {
  font-size: 13px;
  color: var(--muted-foreground);
}

.card {
  background: var(--muted);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ref-large {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
  text-align: center;
}

.textarea {
  background: var(--background);
  border: 2px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--foreground);
  font-size: 16px;
  padding: 12px;
  resize: none;
  outline: none;
  width: 100%;
}
.textarea:focus { border-color: var(--primary); }

.diff-output {
  font-size: 15px;
  line-height: 1.8;
  color: var(--foreground);
}
.diff-output :deep(.d-correct)  { color: var(--primary); }
.diff-output :deep(.d-wrong)    { color: var(--destructive); text-decoration: line-through; }
.diff-output :deep(.d-missing)  { color: var(--warning); }
.diff-output :deep(.d-extra)    { color: var(--muted-foreground); font-style: italic; }
.diff-output :deep(.d-expected) { color: var(--muted-foreground); font-size: 12px; margin-left: 1px; }

.self-assess { display: flex; flex-direction: column; gap: 10px; }
.assess-prompt { font-size: 14px; color: var(--muted-foreground); }
.assess-row { display: flex; gap: 10px; }

.btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  background: var(--primary);
  color: var(--primary-foreground);
  width: 100%;
}

.btn-primary { background: var(--primary); color: var(--primary-foreground); box-shadow: var(--shadow-sm); }
.btn-secondary { background: var(--muted); border: 2px solid var(--border); color: var(--muted-foreground); box-shadow: none; }
.assess-yes { background: var(--primary); color: var(--primary-foreground); }
.assess-no  { background: var(--muted); color: var(--foreground); }

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
.summary-title { font-size: 28px; font-weight: 700; color: var(--foreground); }
.summary-stats { font-size: 18px; color: var(--muted-foreground); }
.summary-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 320px;
  margin-top: 8px;
}
</style>
