<template>
  <div class="more">
    <!-- History view overlay -->
    <HistoryView
      v-if="showHistory"
      @back="showHistory = false"
      @navigate="emit('navigate', $event)"
    />

    <template v-else>
    <!-- Header -->
      <div class="menu-header">More</div>

      <div class="menu-list">
        <button class="menu-item" @click="showHistory = true">
          <span class="menu-icon">📜</span>
          <div class="menu-text">
            <div class="menu-title">History</div>
            <div class="menu-desc">Past paths and completed verses</div>
          </div>
          <span class="chevron">›</span>
        </button>

        <a class="menu-item" href="../" target="_blank">
          <span class="menu-icon">🧠</span>
          <div class="menu-text">
            <div class="menu-title">ByHeart</div>
            <div class="menu-desc">Opens in original app ↗</div>
          </div>
          <span class="chevron">›</span>
        </a>

        <a class="menu-item" href="../" target="_blank">
          <span class="menu-icon">✍️</span>
          <div class="menu-text">
            <div class="menu-title">Drill Mode</div>
            <div class="menu-desc">Opens in original app ↗</div>
          </div>
          <span class="chevron">›</span>
        </a>
      </div>

      <!-- Stats -->
      <div class="stats-section">
        <div class="stats-title">Your Stats</div>

        <div class="level-row">
          <span class="level-label">Level {{ level }}</span>
          <div class="xp-bar-track">
            <div class="xp-bar-fill" :style="{ width: xpBarPct + '%' }" />
          </div>
          <span class="xp-hint">{{ xpInLevel }} / 100 XP</span>
        </div>

        <div class="stat-row">
          <span>🔥 Streak</span><strong>{{ streak }} days</strong>
        </div>
        <div class="stat-row">
          <span>⚡ Total XP</span><strong>{{ xp }}</strong>
        </div>
        <div class="stat-row">
          <span>📚 Verses saved</span><strong>{{ verses.length }}</strong>
        </div>
        <div class="stat-row">
          <span>✅ Drills completed</span><strong>{{ drillsCompleted }}</strong>
        </div>
      </div>

      <!-- Utility -->
      <div class="util-section">
        <div class="stats-title">Settings</div>
        <button class="util-btn" @click="clearBibleCache">
          🗑 Clear Bible cache
          <span class="util-desc">Force re-download Bible data</span>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useVerseList } from '../composables/useVerseList.js'
import { useProgress } from '../composables/useProgress.js'
import HistoryView from './HistoryView.vue'

const emit = defineEmits(['navigate'])

const { verses } = useVerseList()
const { streak, xp, state: progressState } = useProgress()
const showHistory = ref(false)

// --- Level / stats ---
const level = computed(() => Math.floor((xp.value ?? 0) / 100) + 1)
const xpInLevel = computed(() => (xp.value ?? 0) % 100)
const xpBarPct = computed(() => xpInLevel.value)
const drillsCompleted = computed(() => verses.value.filter(v => v.drilledAt).length)

// --- Utility ---
function clearBibleCache() {
  if (confirm('Clear the cached Bible data? It will be re-downloaded next time you open the Palace.')) {
    localStorage.removeItem('bibleJSON')
    alert('Cache cleared. Reload the app to fetch fresh data.')
  }
}
</script>

<style scoped>
.more {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
}

/* Menu */
.menu-header {
  padding: 20px 16px 8px;
  font-size: 22px;
  font-weight: 800;
  color: #f9fafb;
}

.menu-list { display: flex; flex-direction: column; gap: 1px; padding: 8px 0; }

.menu-item {
  display: flex;
  align-items: center;
  gap: 14px;
  background: none;
  border: none;
  border-bottom: 1px solid #1f2937;
  padding: 16px;
  cursor: pointer;
  width: 100%;
  text-align: left;
  text-decoration: none;
  color: inherit;
  box-sizing: border-box;
}

.menu-icon { font-size: 28px; }
.menu-text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.menu-title { font-size: 16px; font-weight: 600; color: #f9fafb; }
.menu-desc { font-size: 13px; color: #6b7280; }
.chevron { font-size: 22px; color: #4b5563; }

/* Stats */
.stats-section {
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stats-title {
  font-size: 13px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}

.level-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: #1f2937;
  border-radius: 12px;
}

.level-label {
  font-size: 15px;
  font-weight: 700;
  color: #58cc02;
  min-width: 56px;
}

.xp-bar-track {
  flex: 1;
  height: 8px;
  background: #374151;
  border-radius: 4px;
  overflow: hidden;
}

.xp-bar-fill {
  height: 100%;
  background: #58cc02;
  border-radius: 4px;
  transition: width 0.4s ease;
}

.xp-hint { font-size: 12px; color: #6b7280; white-space: nowrap; }

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  color: #d1d5db;
}

.stat-row strong { color: #f9fafb; font-size: 16px; }

/* Utility */
.util-section {
  padding: 0 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.util-btn {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 12px;
  color: #d1d5db;
  font-size: 15px;
  padding: 14px 16px;
  text-align: left;
  cursor: pointer;
  width: 100%;
}

.util-desc {
  font-size: 12px;
  color: #6b7280;
}
</style>
