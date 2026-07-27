<template>
  <div class="qt">
    <div class="qt-head">
      <span v-if="cards.length > 1" class="qt-count">Question {{ index + 1 }} of {{ cards.length }}</span>
      <span v-else class="qt-count">Question</span>
      <button v-if="revealedCount > 0" class="qt-reset" @click="hideAll">Hide</button>
    </div>

    <p class="qt-question" data-testid="question-text" v-html="highlighted" />

    <ul class="qt-answers">
      <li v-for="a in card.answers" :key="a.marker" class="qt-answer">
        <span class="qt-marker">{{ a.marker }}</span>
        <button
          v-if="!revealed.includes(a.marker)"
          class="qt-reveal"
          data-testid="reveal-answer"
          @click="reveal(a.marker)"
        >
          Reveal
        </button>
        <span v-else class="qt-text" data-testid="answer-text">{{ a.text }}</span>
      </li>
    </ul>

    <div v-if="assess" class="qt-assess">
      <p v-if="revealedCount < card.answers.length" class="qt-assess-hint">
        Recall it, then reveal to check yourself.
      </p>
      <template v-else>
        <p class="qt-assess-hint">How did that go?</p>
        <div class="qt-assess-row">
          <button class="btn btn-ghost" data-testid="assess-lost" @click="emit('assess', 'lost')">
            Lost it
          </button>
          <button class="btn btn-ghost" data-testid="assess-shaky" @click="emit('assess', 'shaky')">
            Shaky
          </button>
          <button class="btn btn-primary" data-testid="assess-got" @click="emit('assess', 'got')">
            Got it
          </button>
        </div>
      </template>
      <button v-if="revealedCount < card.answers.length" class="btn btn-primary qt-wide" @click="revealAll">
        Reveal all
      </button>
    </div>

    <div v-else class="qt-actions">
      <button class="btn btn-ghost" :disabled="index === 0" @click="go(-1)">Back</button>
      <button v-if="revealedCount < card.answers.length" class="btn btn-primary" @click="revealAll">
        Reveal all
      </button>
      <button v-else class="btn btn-primary" :disabled="index >= cards.length - 1" @click="go(1)">
        Next
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  cards: { type: Array, required: true },
  // Only you know whether the answer you recalled matched, so a question is
  // the one item type the app cannot grade for you.
  assess: { type: Boolean, default: false },
})

const emit = defineEmits(['assess'])

const index = ref(0)
const revealed = ref([])

const card = computed(() => props.cards[index.value] ?? { question: '', answers: [], markers: [] })
const revealedCount = computed(() => revealed.value.length)

// Tint the inline ①②③ so the question reads as the set of sub-questions it is.
const highlighted = computed(() =>
  escapeHtml(card.value.question).replace(/[①-⑳]/g, (m) => `<span class="qt-inline">${m}</span>`),
)

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}

function reveal(marker) {
  if (!revealed.value.includes(marker)) revealed.value = [...revealed.value, marker]
}

function revealAll() {
  revealed.value = card.value.answers.map((a) => a.marker)
}

function hideAll() {
  revealed.value = []
}

function go(delta) {
  const next = index.value + delta
  if (next >= 0 && next < props.cards.length) index.value = next
}

watch(index, hideAll)
</script>

<style scoped>
.qt-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.qt-count {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.qt-reset {
  background: none;
  border: none;
  color: var(--text-muted);
  font: inherit;
  font-size: 0.82rem;
  cursor: pointer;
  padding: 4px 8px;
}

.qt-question {
  font-size: 1.08rem;
  line-height: 1.6;
  margin: 0 0 20px;
  color: var(--text);
}

.qt-question :deep(.qt-inline) {
  color: var(--primary);
  font-weight: 800;
}

.qt-answers {
  list-style: none;
  margin: 0 0 20px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qt-answer {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 12px 14px;
}

.qt-marker {
  color: var(--primary);
  font-weight: 800;
  flex-shrink: 0;
  line-height: 1.5;
}

.qt-reveal {
  background: none;
  border: 1px dashed var(--border-solid);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font: inherit;
  font-size: 0.85rem;
  padding: 3px 12px;
  cursor: pointer;
  transition: color var(--transition), border-color var(--transition);
}

.qt-reveal:hover {
  color: var(--text);
  border-color: var(--primary);
}

.qt-text {
  line-height: 1.5;
  color: var(--text);
}

.qt-actions {
  display: flex;
  gap: 10px;
}

.qt-actions .btn {
  flex: 1;
}

.qt-assess-hint {
  font-size: var(--text-sm);
  color: var(--muted-foreground);
  margin-bottom: var(--space-3);
}

.qt-assess-row {
  display: flex;
  gap: var(--space-2);
}

.qt-assess-row .btn {
  flex: 1;
}

.qt-wide {
  width: 100%;
}
</style>
