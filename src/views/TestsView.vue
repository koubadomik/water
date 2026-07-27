<template>
  <div class="lb">
    <!-- ── Paste a test ────────────────────────────────── -->
    <template v-if="screen === 'paste'">
      <header class="lb-head">
        <button class="lb-back" @click="screen = 'list'">← Tests</button>
        <h2 class="lb-title">Paste a test</h2>
        <p class="lb-sub">
          Question with ①②③ markers, <code>Odpověď:</code>, the answers, then the passage with
          <code>( ① … )</code> blanks. Any part can be left out.
        </p>
      </header>

      <textarea
        v-model="draft"
        class="lb-textarea"
        data-testid="paste-box"
        rows="14"
        placeholder="1. Ve „svatyni stánku svědectví“ ve Zjevení 15:5, ① kdo svědčí…?&#10;&#10;Odpověď:&#10;&#10;① Ti, kteří zvítězili&#10;&#10;Zj 15:1-8&#10;&#10;:1 Tu jsem uviděl v nebi ( ① jiné veliké a podivuhodné znamení )…"
      />

      <div v-if="draft.trim()" class="lb-preview" data-testid="paste-preview">
        <span v-if="preview.cards.length">{{ preview.cards.length }} question{{ preview.cards.length === 1 ? '' : 's' }}</span>
        <span v-if="preview.passage">{{ preview.passage.verses.length }} verses · {{ preview.blankCount }} blanks</span>
        <span v-if="!preview.cards.length && !preview.passage" class="lb-warn">Nothing recognised yet</span>
      </div>

      <button class="btn btn-primary lb-wide" :disabled="!canSave" @click="saveSet">Save test</button>
    </template>

    <!-- ── Working through one test ────────────────────── -->
    <template v-else-if="screen === 'train' && active">
      <header class="lb-head lb-head-row">
        <button class="lb-back" @click="screen = 'list'">← Tests</button>
        <span class="lb-active-title">{{ active.title }}</span>
      </header>

      <div class="lb-tabs">
        <button v-if="active.cards.length" :class="['lb-tab', { on: tab === 'questions' }]" @click="tab = 'questions'">
          Questions
        </button>
        <button v-if="active.passage" :class="['lb-tab', { on: tab === 'passage' }]" @click="tab = 'passage'">
          Passage
        </button>
      </div>

      <QuestionTrainer v-if="tab === 'questions' && active.cards.length" :key="active.id + '-q'" :cards="active.cards" />
      <ClozeTrainer v-else-if="tab === 'passage' && active.passage" :key="active.id + '-p'" :passage="active.passage" />
    </template>

    <!-- ── The tests ───────────────────────────────────── -->
    <template v-else>
      <header class="lb-head">
        <h2 class="lb-title">Tests</h2>
        <p class="lb-sub">Everything you have pasted. Open one to work through it.</p>
      </header>

      <p v-if="!sets.length" class="lb-hint" data-testid="no-tests">Nothing pasted yet.</p>

      <ul v-else class="lb-list">
        <li v-for="s in sets" :key="s.id" class="lb-item">
          <button class="lb-item-main lb-open" data-testid="open-set" @click="openSet(s.id)">
            <span class="lb-item-title">{{ s.title }}</span>
            <span class="lb-item-meta">{{ summarise(s.id) }}</span>
          </button>
          <button class="lb-del" :title="`Delete ${s.title}`" @click="confirmRemove(s)">✕</button>
        </li>
      </ul>

      <button class="btn btn-primary lb-wide" data-testid="new-set" @click="startPaste">+ Paste a test</button>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import QuestionTrainer from '../components/study/QuestionTrainer.vue'
import ClozeTrainer from '../components/study/ClozeTrainer.vue'
import { useStudySets } from '../composables/useStudySets.js'
import { parseStudySet } from '../lib/parseStudySet.js'

const { sets, parsed, addSet, removeSet } = useStudySets()

const screen = ref('list')
const draft = ref('')
const activeId = ref(null)
const tab = ref('questions')

const preview = computed(() => parseStudySet(draft.value))
const canSave = computed(() => preview.value.cards.length > 0 || preview.value.passage !== null)
const active = computed(() => (activeId.value ? parsed(activeId.value) : null))

function summarise(id) {
  const set = parsed(id)
  if (!set) return ''
  const bits = []
  if (set.cards.length) bits.push(`${set.cards.length} question${set.cards.length === 1 ? '' : 's'}`)
  if (set.blankCount) bits.push(`${set.blankCount} blanks`)
  return bits.join(' · ')
}

function startPaste() {
  draft.value = ''
  screen.value = 'paste'
}

function saveSet() {
  const set = addSet(draft.value)
  if (!set) return
  draft.value = ''
  openSet(set.id)
}

function openSet(id) {
  activeId.value = id
  const set = parsed(id)
  tab.value = set?.cards.length ? 'questions' : 'passage'
  screen.value = 'train'
}

function confirmRemove(set) {
  if (confirm(`Delete “${set.title}”?`)) removeSet(set.id)
}
</script>

<style scoped>
.lb-current {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-bottom: var(--space-6);
}

.lb-name {
  margin-bottom: var(--space-1);
  font-weight: 600;
}

.lb-current .lb-hint { margin-bottom: var(--space-3); }

.lb-tick {
  background: none;
  border: none;
  border-right: 1px solid var(--border);
  color: var(--muted-foreground);
  font-size: var(--text-lg);
  min-width: 48px;
  cursor: pointer;
}

.lb-tick.on { color: var(--primary); }

.lb {
  padding: var(--space-5) var(--space-4) var(--space-10);
}

.lb-head { margin-bottom: var(--space-5); }

.lb-head-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.lb-title {
  font-size: var(--text-2xl);
  font-weight: 700;
}

.lb-sub {
  margin-top: var(--space-1);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  color: var(--muted-foreground);
}

.lb-sub code {
  background: var(--muted);
  border-radius: var(--radius-sm);
  padding: 1px 5px;
}

.lb-back {
  background: none;
  border: none;
  color: var(--muted-foreground);
  font: inherit;
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  padding: var(--space-2) 0;
  min-height: 44px;
  text-align: left;
}

.lb-active-title { font-weight: 700; }

.lb-add {
  margin-bottom: var(--space-8);
}

.lb-label {
  display: block;
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted-foreground);
  margin-bottom: var(--space-2);
}

.lb-row {
  display: flex;
  gap: var(--space-2);
}

.lb-row .input { flex: 1; }

.lb-hint {
  margin-top: var(--space-2);
  font-size: var(--text-sm);
  color: var(--muted-foreground);
}

.lb-hint.ok { color: var(--primary); font-weight: 600; }
.lb-hint.warn { color: var(--warning); font-weight: 600; }

.lb-section { margin-bottom: var(--space-8); }

.lb-section-name {
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted-foreground);
  margin-bottom: var(--space-2);
}

.lb-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.lb-item {
  display: flex;
  align-items: stretch;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.lb-item-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
  padding: var(--space-3) var(--space-4);
  min-height: 56px;
  justify-content: center;
}

.lb-open {
  background: none;
  border: none;
  color: var(--foreground);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.lb-open:hover { background: var(--muted); }

.lb-item-title { font-weight: 600; }

.lb-item-meta {
  font-size: var(--text-xs);
  color: var(--muted-foreground);
}

.lb-del {
  background: none;
  border: none;
  border-left: 1px solid var(--border);
  color: var(--muted-foreground);
  font: inherit;
  padding: 0 var(--space-4);
  min-width: 44px;
  cursor: pointer;
}

.lb-del:hover { color: var(--destructive); }

.lb-offer { margin-bottom: var(--space-2); }

.lb-wide { width: 100%; }

.lb-textarea {
  width: 100%;
  background: var(--card);
  border: 1px solid var(--input);
  border-radius: var(--radius-md);
  color: var(--foreground);
  font-family: var(--font-ui);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  padding: var(--space-3);
  resize: vertical;
}

.lb-textarea:focus {
  outline: 2px solid var(--ring);
  outline-offset: 1px;
  border-color: var(--primary);
}

.lb-preview {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
  margin-top: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--primary);
}

.lb-warn { color: var(--warning); }

.lb-tabs {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
}

.lb-tab {
  background: var(--muted);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  color: var(--muted-foreground);
  font: inherit;
  font-size: var(--text-sm);
  font-weight: 700;
  min-height: 44px;
  padding: 0 var(--space-4);
  cursor: pointer;
}

.lb-tab.on {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--primary-foreground);
}
</style>
