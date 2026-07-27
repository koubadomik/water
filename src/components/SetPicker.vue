<template>
  <section class="sp">
    <!-- Switch to something already trained -->
    <template v-if="others.length">
      <h3 class="sp-name">Switch to</h3>
      <ul class="sp-list">
        <li v-for="s in others" :key="s.id" class="sp-set-row">
          <button class="sp-item" data-testid="switch-set" @click="choose(s)">
            <span class="sp-item-main">
              <span class="sp-item-title">{{ s.name }}</span>
              <span class="sp-item-meta">
                {{ s.itemIds.length }} item{{ s.itemIds.length === 1 ? '' : 's' }} ·
                {{ progressOf(s) }}
              </span>
            </span>
            <span class="sp-go">→</span>
          </button>
          <button class="sp-delete" data-testid="delete-set" :aria-label="`Delete ${s.name}`" @click="confirmRemove(s)">✕</button>
        </li>
      </ul>
    </template>

    <!-- Or build a new one -->
    <h3 class="sp-name">{{ others.length ? 'Or start a new set' : 'Start a training set' }}</h3>

    <input
      v-model="name"
      class="input sp-field"
      data-testid="set-name"
      type="text"
      placeholder="Name it, e.g. Zjevení 14"
    />

    <div class="sp-row">
      <input
        v-model="refInput"
        class="input"
        data-testid="ref-input"
        type="text"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        placeholder="Zj 14:1-5"
        @keydown.enter.prevent="addRange"
      />
      <button class="btn btn-ghost" data-testid="ref-add" :disabled="!resolved.ok" @click="addRange">Add</button>
    </div>

    <p v-if="refInput.trim() && resolved.ok" class="sp-hint ok" data-testid="ref-preview">
      {{ resolved.label }} · {{ resolved.verses.length }} verse{{ resolved.verses.length === 1 ? '' : 's' }}
    </p>
    <p v-else-if="resolved.error" class="sp-hint warn" data-testid="ref-error">{{ resolved.error }}</p>
    <p v-else class="sp-hint">A range of verses. Also accepts “Zjevení 14” for a whole chapter.</p>

    <template v-if="tests.length">
      <p class="sp-sub">Include tests</p>
      <ul class="sp-list">
        <li v-for="t in tests" :key="t.id">
          <button
            class="sp-item"
            :class="{ on: pickedTests.includes(t.id) }"
            data-testid="pick-test"
            @click="toggleTest(t.id)"
          >
            <span class="sp-tick">{{ pickedTests.includes(t.id) ? '☑' : '☐' }}</span>
            <span class="sp-item-main">
              <span class="sp-item-title">{{ t.title }}</span>
            </span>
          </button>
        </li>
      </ul>
    </template>

    <p v-if="pendingVerses.length" class="sp-hint ok" data-testid="pending-count">
      {{ pendingVerses.length }} verse{{ pendingVerses.length === 1 ? '' : 's' }} ready
    </p>

    <button class="btn btn-primary sp-wide" data-testid="start-set" :disabled="!canStart" @click="start">
      Start training
    </button>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTrainingSets } from '../composables/useTrainingSets.js'
import { useStudySets } from '../composables/useStudySets.js'
import { useReview } from '../composables/useReview.js'
import { useBible } from '../composables/useBible.js'
import { useQueue } from '../composables/useQueue.js'
import { resolveReference } from '../lib/reference.js'
import { dayStr } from '../lib/scheduler.js'

const emit = defineEmits(['chosen'])

const { current, history, startSet, resumeSet, removeSet } = useTrainingSets()
const { sets: tests, parsed } = useStudySets()
const { addVerses } = useReview()
const { bible } = useBible()
const { allItems, progressFor, replan } = useQueue()

const name = ref('')
const refInput = ref('')
const pendingVerses = ref([])
const pickedTests = ref([])

// Every set except the one running now, newest first.
const others = computed(() =>
  [...history.value].sort((a, b) => (b.endedAt ?? '').localeCompare(a.endedAt ?? '')),
)

const resolved = computed(() => resolveReference(bible.value, refInput.value))
const canStart = computed(() => pendingVerses.value.length > 0 || pickedTests.value.length > 0)

function progressOf(set) {
  const { done, total } = progressFor(set)
  return total ? `${done} of ${total} seen` : 'not started'
}

function addRange() {
  if (!resolved.value.ok) return
  addVerses(resolved.value.verses)
  const ids = resolved.value.verses.map((v) => `verse:${v.ref}`)
  pendingVerses.value = [...new Set([...pendingVerses.value, ...ids])]
  if (!name.value) name.value = resolved.value.label
  refInput.value = ''
}

function toggleTest(id) {
  pickedTests.value = pickedTests.value.includes(id)
    ? pickedTests.value.filter((t) => t !== id)
    : [...pickedTests.value, id]
}

function testItemIds(id) {
  return allItems.value.filter((i) => i.sourceId === id).map((i) => i.id)
}

function start() {
  const ids = [...pendingVerses.value, ...pickedTests.value.flatMap(testItemIds)]
  startSet(name.value || defaultName(), ids)
  replan()
  reset()
  emit('chosen')
}

function defaultName() {
  const first = pickedTests.value[0] ? parsed(pickedTests.value[0])?.title : null
  return first ?? `Set of ${dayStr()}`
}

// Switching keeps the set's own record, so it resumes where it left off.
function choose(set) {
  resumeSet(set.id)
  replan()
  emit('chosen')
}

function confirmRemove(set) {
  if (confirm(`Delete “${set.name}”? This does not delete its verses.`)) removeSet(set.id)
}

function reset() {
  name.value = ''
  refInput.value = ''
  pendingVerses.value = []
  pickedTests.value = []
}
</script>

<style scoped>
.sp {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-bottom: var(--space-6);
}

.sp-name {
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted-foreground);
  margin-bottom: var(--space-2);
}

.sp-sub {
  font-size: var(--text-sm);
  color: var(--muted-foreground);
  margin: var(--space-3) 0 var(--space-2);
}

.sp-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.sp-item {
  width: 100%;
  min-height: 52px;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--foreground);
  font: inherit;
  text-align: left;
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
}

.sp-item:hover { border-color: var(--muted-foreground); }
.sp-item.on { border-color: var(--primary); }
.sp-set-row { display: flex; gap: var(--space-2); }
.sp-set-row .sp-item { flex: 1; }
.sp-delete { width: 44px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--background); color: var(--muted-foreground); cursor: pointer; font: inherit; }
.sp-delete:hover { border-color: var(--destructive); color: var(--destructive); }

.sp-item-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sp-item-title { font-weight: 600; }

.sp-item-meta {
  font-size: var(--text-xs);
  color: var(--muted-foreground);
}

.sp-tick { color: var(--primary); }
.sp-go { color: var(--muted-foreground); }

.sp-field { margin-bottom: var(--space-2); }

.sp-row {
  display: flex;
  gap: var(--space-2);
}

.sp-row .input { flex: 1; }

.sp-hint {
  margin: var(--space-2) 0 var(--space-3);
  font-size: var(--text-sm);
  color: var(--muted-foreground);
}

.sp-hint.ok { color: var(--primary); font-weight: 600; }
.sp-hint.warn { color: var(--warning); font-weight: 600; }

.sp-wide { width: 100%; }
</style>
