<template>
  <div class="sv">
    <!-- ── Paste a new set ─────────────────────────────── -->
    <template v-if="screen === 'paste'">
      <header class="sv-head">
        <button v-if="sets.length" class="sv-back" @click="screen = 'list'">← Back</button>
        <h2 class="sv-title">Paste a study set</h2>
        <p class="sv-sub">
          Question with ①②③ markers, <code>Odpověď:</code>, the answers, then the passage with
          <code>( ① … )</code> blanks. Any part can be left out.
        </p>
      </header>

      <textarea
        v-model="draft"
        class="sv-textarea"
        data-testid="paste-box"
        rows="14"
        placeholder="1. Ve „svatyni stánku svědectví“ ve Zjevení 15:5, ① kdo svědčí…?&#10;&#10;Odpověď:&#10;&#10;① Ti, kteří zvítězili&#10;&#10;Zj 15:1-8&#10;&#10;:1 Tu jsem uviděl v nebi ( ① jiné veliké a podivuhodné znamení )…"
      />

      <div v-if="draft.trim()" class="sv-preview" data-testid="paste-preview">
        <span v-if="preview.cards.length">{{ preview.cards.length }} question{{ preview.cards.length === 1 ? '' : 's' }}</span>
        <span v-if="preview.passage">{{ preview.passage.verses.length }} verses · {{ preview.blankCount }} blanks</span>
        <span v-if="!preview.cards.length && !preview.passage" class="sv-warn">Nothing recognised yet</span>
      </div>

      <button class="btn btn-primary sv-save" :disabled="!canSave" @click="save">Save set</button>
    </template>

    <!-- ── The saved sets ──────────────────────────────── -->
    <template v-else-if="screen === 'list'">
      <header class="sv-head">
        <h2 class="sv-title">Study sets</h2>
      </header>

      <ul class="sv-list">
        <li v-for="s in sets" :key="s.id" class="sv-item">
          <button class="sv-open" data-testid="open-set" @click="open(s.id)">
            <span class="sv-item-title">{{ s.title }}</span>
            <span class="sv-item-meta">{{ summarise(s.id) }}</span>
          </button>
          <button class="sv-del" title="Delete set" @click="confirmRemove(s)">✕</button>
        </li>
      </ul>

      <button class="btn btn-primary sv-save" @click="startPaste">+ New set</button>
    </template>

    <!-- ── Training a set ──────────────────────────────── -->
    <template v-else-if="active">
      <header class="sv-head sv-head-row">
        <button class="sv-back" @click="screen = 'list'">← Sets</button>
        <span class="sv-active-title">{{ active.title }}</span>
      </header>

      <div class="sv-tabs">
        <button
          v-if="active.cards.length"
          :class="['sv-tab', { on: tab === 'questions' }]"
          @click="tab = 'questions'"
        >
          Questions
        </button>
        <button
          v-if="active.passage"
          :class="['sv-tab', { on: tab === 'passage' }]"
          @click="tab = 'passage'"
        >
          Passage
        </button>
      </div>

      <QuestionTrainer
        v-if="tab === 'questions' && active.cards.length"
        :key="active.id + '-q'"
        :cards="active.cards"
      />
      <ClozeTrainer
        v-else-if="tab === 'passage' && active.passage"
        :key="active.id + '-p'"
        :passage="active.passage"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import QuestionTrainer from '../components/study/QuestionTrainer.vue'
import ClozeTrainer from '../components/study/ClozeTrainer.vue'
import { useStudySets } from '../composables/useStudySets.js'
import { parseStudySet } from '../lib/parseStudySet.js'

const { sets, parsed, addSet, removeSet } = useStudySets()

const screen = ref(sets.value.length ? 'list' : 'paste')
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

function save() {
  const set = addSet(draft.value)
  if (!set) return
  draft.value = ''
  open(set.id)
}

function open(id) {
  activeId.value = id
  const set = parsed(id)
  tab.value = set?.cards.length ? 'questions' : 'passage'
  screen.value = 'train'
}

function confirmRemove(set) {
  if (confirm(`Delete “${set.title}”?`)) {
    removeSet(set.id)
    if (!sets.value.length) screen.value = 'paste'
  }
}

// If the last set is deleted while listing, fall back to the paste screen.
watch(sets, (val) => {
  if (!val.length && screen.value === 'list') screen.value = 'paste'
})
</script>

<style scoped>
.sv {
  padding: 20px 18px 40px;
  display: flex;
  flex-direction: column;
}

.sv-head { margin-bottom: 16px; }

.sv-head-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sv-title {
  font-size: 1.35rem;
  font-weight: 900;
}

.sv-sub {
  margin-top: 6px;
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--text-muted);
}

.sv-sub code {
  background: var(--surface);
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 0.92em;
}

.sv-back {
  background: none;
  border: none;
  color: var(--text-muted);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  margin-bottom: 8px;
  text-align: left;
}

.sv-back:hover { color: var(--text); }

.sv-active-title {
  font-weight: 800;
  margin-bottom: 8px;
}

.sv-textarea {
  width: 100%;
  background: var(--bg-raised);
  border: 1px solid var(--border-solid);
  border-radius: var(--radius-md);
  color: var(--text);
  font-family: var(--font);
  font-size: 0.9rem;
  line-height: 1.6;
  padding: 14px;
  resize: vertical;
}

.sv-textarea:focus {
  outline: none;
  border-color: var(--primary);
}

.sv-preview {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 10px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--primary);
}

.sv-warn { color: var(--warning); }

.sv-save { margin-top: 18px; }

.sv-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sv-item {
  display: flex;
  align-items: stretch;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.sv-open {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: flex-start;
  background: none;
  border: none;
  color: var(--text);
  font: inherit;
  text-align: left;
  padding: 14px 16px;
  cursor: pointer;
}

.sv-open:hover { background: var(--bg-elevated); }

.sv-item-title { font-weight: 800; }

.sv-item-meta {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.sv-del {
  background: none;
  border: none;
  border-left: 1px solid var(--border);
  color: var(--text-muted);
  font: inherit;
  padding: 0 16px;
  cursor: pointer;
}

.sv-del:hover { color: var(--danger); }

.sv-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.sv-tab {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  color: var(--text-muted);
  font: inherit;
  font-size: 0.83rem;
  font-weight: 800;
  padding: 7px 18px;
  cursor: pointer;
  transition: background var(--transition), color var(--transition);
}

.sv-tab.on {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--primary-foreground);
}
</style>
