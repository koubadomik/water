<template>
  <div class="palace-walk">
    <div class="position">{{ current + 1 }} / {{ verses.length }}</div>

    <div class="card">
      <div class="verse-ref">{{ verse.ref }}</div>
      <div class="verse-text">{{ verse.text }}</div>
      <div v-if="verse.note" class="note">
        <span class="note-label">Palace note</span>
        <span class="note-text">{{ verse.note }}</span>
      </div>
    </div>

    <div class="btn-row">
      <button v-if="current > 0" data-testid="back" class="btn-back" @click="onBack">
        ← Back
      </button>
      <button data-testid="next" class="btn-next" @click="onNext">
        {{ isLast ? 'Done' : 'Next' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  verses: { type: Array, required: true },
})

const emit = defineEmits(['done'])

const current = ref(0)
const verse = computed(() => props.verses[current.value])
const isLast = computed(() => current.value === props.verses.length - 1)

function onBack() {
  if (current.value > 0) {
    current.value--
  }
}

function onNext() {
  if (isLast.value) {
    emit('done')
  } else {
    current.value++
  }
}
</script>

<style scoped>
.palace-walk {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 24px 16px;
  flex: 1;
}

.position {
  font-size: 13px;
  color: #6b7280;
  letter-spacing: 0.05em;
}

.card {
  width: 100%;
  background: #1f2937;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.verse-ref {
  font-size: 13px;
  font-weight: 600;
  color: #58cc02;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.verse-text {
  font-size: 20px;
  line-height: 1.5;
  color: #f9fafb;
}

.note {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-top: 1px solid #374151;
  padding-top: 16px;
}

.note-label {
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.note-text {
  font-size: 15px;
  color: #d1d5db;
  font-style: italic;
}

.btn-row {
  display: flex;
  gap: 12px;
  width: 100%;
  max-width: 320px;
}

.btn-back {
  padding: 16px;
  background: #1f2937;
  color: #9ca3af;
  font-size: 16px;
  font-weight: 700;
  border: 2px solid #374151;
  border-radius: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.btn-next {
  flex: 1;
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
