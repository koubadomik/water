<template>
  <div class="palace-walk">
    <template v-if="verses.length === 0">
      <div class="empty">No completed verses to review yet.</div>
      <div class="btn-row"><button data-testid="next" class="btn-next" @click="emit('done')">Continue</button></div>
    </template>
    <template v-else>
      <div class="position">{{ current + 1 }} / {{ verses.length }}</div>
      <div class="card">
        <div class="verse-ref">{{ verse.ref }}</div>
        <div class="verse-text">{{ verse.text }}</div>
        <div v-if="verse.note" class="note"><span class="note-label">Palace note</span><span class="note-text">{{ verse.note }}</span></div>
      </div>
      <div class="btn-row">
        <button v-if="current > 0" data-testid="back" class="btn-back" @click="onBack">← Back</button>
        <button data-testid="next" class="btn-next" @click="onNext">{{ isLast ? 'Done' : 'Next' }}</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
const props = defineProps({ verses: { type: Array, required: true } })
const emit = defineEmits(['done'])
const current = ref(0)
const verse = computed(() => props.verses[current.value])
const isLast = computed(() => current.value === props.verses.length - 1)
function onBack() { if (current.value > 0) current.value-- }
function onNext() { if (isLast.value) emit('done'); else current.value++ }
</script>

<style scoped>
.palace-walk { display: flex; flex-direction: column; align-items: center; gap: 24px; padding: 24px 16px; flex: 1; }
.empty { flex: 1; display: flex; align-items: center; justify-content: center; color: var(--muted-foreground); font-size: 15px; text-align: center; padding: 40px; }
.position { font-size: 13px; color: var(--muted-foreground); letter-spacing: 0.05em; }
.card { width: 100%; background: var(--muted); border-radius: var(--radius-lg); padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.verse-ref { font-size: 13px; font-weight: 600; color: var(--primary); text-transform: uppercase; letter-spacing: 0.08em; }
.verse-text { font-family: var(--font-reading); font-size: var(--text-lg); line-height: var(--leading-reading); color: var(--foreground); text-wrap: pretty; }
.note { display: flex; flex-direction: column; gap: 4px; border-top: 1px solid var(--border); padding-top: 16px; }
.note-label { font-size: 11px; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.1em; }
.note-text { font-size: 15px; color: var(--foreground); font-style: italic; }
.btn-row { display: flex; gap: 12px; width: 100%; max-width: 320px; }
.btn-back { padding: 16px; background: var(--muted); color: var(--muted-foreground); font-size: 16px; font-weight: 700; border: 2px solid var(--border); border-radius: var(--radius-md); cursor: pointer; white-space: nowrap; }
.btn-next { flex: 1; padding: 16px; background: var(--primary); color: var(--primary-foreground); font-size: 16px; font-weight: 700; border: none; border-radius: var(--radius-md); cursor: pointer; }
</style>
