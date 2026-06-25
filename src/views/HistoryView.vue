<template>
  <div class="history-view">

    <!-- Per-verse drill overlay -->
    <template v-if="activeDrillVerse">
      <div class="drill-header">
        <button class="back-btn" @click="activeDrillVerse = null">← Back</button>
        <span class="drill-ref">{{ activeDrillVerse.ref }}</span>
      </div>
      <NewVerseDrillView
        :verse="activeDrillVerse"
        :lesson-index="0"
        @done="activeDrillVerse = null"
      />
    </template>

    <template v-else>
      <div class="history-header">
        <button class="back-btn" @click="emit('back')">← Back</button>
        <h2 class="history-title">History</h2>
      </div>

      <div v-if="history.length === 0" class="empty-state">
        No completed paths yet. Finish a path to see it here.
      </div>

      <div v-else class="history-list">
        <div
          v-for="entry in history"
          :key="entry.id"
          class="history-entry"
        >
          <div class="entry-header" @click="toggle(entry.id)">
            <div class="entry-meta">
              <div class="entry-label">{{ entry.label }}</div>
              <div class="entry-date">{{ formatDate(entry.completedAt) }} · {{ uniqueVerseCount(entry.verses) }} verses · ⚡{{ entry.xpEarned }}</div>
            </div>
            <span class="entry-chevron">{{ expanded === entry.id ? '▼' : '▶' }}</span>
          </div>

          <div v-if="expanded === entry.id" class="entry-body">
            <div class="entry-verse-list">
              <div v-for="v in uniqueVerses(entry.verses)" :key="v.ref" class="entry-verse">
                <span class="entry-verse-ref">{{ v.ref }}</span>
                <button class="btn-drill-verse" @click="openDrill(v)">Drill →</button>
              </div>
            </div>
            <button class="btn-rerun" @click="rerun(entry)">↩ Re-run this path</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useHistory } from '../composables/useHistory.js'
import { useVerseList } from '../composables/useVerseList.js'
import NewVerseDrillView from '../components/NewVerseDrillView.vue'

const emit = defineEmits(['back', 'navigate'])

const { history } = useHistory()
const { setVerses } = useVerseList()

const expanded = ref(null)
const activeDrillVerse = ref(null)

function toggle(id) {
  expanded.value = expanded.value === id ? null : id
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function uniqueVerses(verses) {
  const seen = new Set()
  return (verses ?? []).filter(v => {
    if (seen.has(v.ref)) return false
    seen.add(v.ref)
    return true
  })
}

function uniqueVerseCount(verses) {
  return uniqueVerses(verses).length
}

function rerun(entry) {
  const verses = (entry.verses ?? []).map(v => ({ ...v, drilledAt: undefined }))
  setVerses(verses)
  if (entry.goalMeta) {
    localStorage.setItem('goalMeta', JSON.stringify(entry.goalMeta))
  }
  emit('navigate', 'home')
}

function openDrill(v) {
  activeDrillVerse.value = { ...v, drilledAt: undefined }
}
</script>

<style scoped>
.history-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
}

.history-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 16px 8px;
}

.drill-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #1f2937;
}

.drill-ref {
  font-size: 15px;
  font-weight: 700;
  color: #58cc02;
}

.back-btn {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
}
.back-btn:hover { color: #9ca3af; }

.history-title {
  font-size: 20px;
  font-weight: 800;
  color: #f9fafb;
}

.empty-state {
  padding: 40px 24px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
}

.history-list {
  display: flex;
  flex-direction: column;
  padding: 8px 0 40px;
}

.history-entry {
  border-bottom: 1px solid #1f2937;
}

.entry-header {
  display: flex;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  gap: 12px;
}
.entry-header:hover { background: #1a2332; }

.entry-meta { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.entry-label { font-size: 16px; font-weight: 700; color: #f9fafb; }
.entry-date { font-size: 12px; color: #6b7280; }
.entry-chevron { font-size: 12px; color: #4b5563; }

.entry-body {
  padding: 0 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.entry-verse-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.entry-verse {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 4px 6px 4px 10px;
  font-size: 13px;
  color: #9ca3af;
}

.entry-verse-ref { flex: 1; }

.btn-drill-verse {
  background: none;
  border: none;
  color: #58cc02;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 6px;
  white-space: nowrap;
}
.btn-drill-verse:hover { color: #86efac; }

.btn-rerun {
  background: #1f2937;
  border: 2px solid #374151;
  border-radius: 12px;
  color: #58cc02;
  font-size: 14px;
  font-weight: 700;
  padding: 12px 16px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s;
}
.btn-rerun:hover { border-color: #58cc02; }
</style>
