<template>
  <div class="review">
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
        <div class="feedback-label" :class="correct ? 'correct' : 'incorrect'">
          {{ correct ? 'Great recall!' : 'Keep practicing' }}
        </div>
        <div class="answer-text">{{ current.text }}</div>
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

const current = computed(() => props.verses[idx.value])
const isLast = computed(() => idx.value === props.verses.length - 1)

function normalize(s) {
  return s.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '')
}

function submit() {
  correct.value = normalize(answer.value) === normalize(current.value.text)
  submitted.value = true
}

function onContinue() {
  if (isLast.value) {
    emit('done')
  } else {
    idx.value++
    answer.value = ''
    submitted.value = false
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

.prompt {
  font-size: 14px;
  color: #6b7280;
}

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
  gap: 8px;
}

.feedback-label {
  font-weight: 700;
  font-size: 15px;
}

.correct   { color: #58cc02; }
.incorrect { color: #ff4b4b; }

.answer-text {
  font-size: 15px;
  color: #d1d5db;
  line-height: 1.5;
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

.position {
  font-size: 13px;
  color: #6b7280;
}
</style>
