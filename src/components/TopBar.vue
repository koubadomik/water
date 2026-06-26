<template>
  <header class="top-bar">
    <div class="stats-row">
      <div data-testid="streak" class="stat-pill">
        <svg class="stat-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" fill="#f97316" stroke="#ea580c" stroke-width="1"/>
          <path d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" fill="#fed7aa" stroke="none"/>
        </svg>
        <span class="stat-value">{{ streak }}</span>
      </div>

      <div data-testid="xp" class="stat-pill xp-pill">
        <svg class="stat-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M13 10V3L4 14h7v7l9-11h-7z" fill="#fbbf24" stroke="#d97706" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="stat-value">{{ xp }}</span>
      </div>
    </div>

    <div class="week-row" aria-label="This week's progress">
      <div
        v-for="day in weekDays"
        :key="day.str"
        class="day-col"
        :title="day.str"
      >
        <div class="day-dot" :class="{ done: day.done, today: day.isToday }" />
        <span class="day-label">{{ day.label }}</span>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  streak:         { type: Number, default: 0 },
  xp:             { type: Number, default: 0 },
  weeklyProgress: { type: Object, default: () => ({}) },
})

const weekDays = computed(() => {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const dow = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dow + 6) % 7))

  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const str = d.toISOString().split('T')[0]
    const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
    days.push({ str, done: !!props.weeklyProgress[str], isToday: str === todayStr, label: labels[i] })
  }
  return days
})
</script>

<style scoped>
.top-bar {
  padding: 10px 16px 8px;
  background: rgba(17, 24, 39, 0.88);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.stats-row {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  padding: 4px 12px 4px 8px;
}

.xp-pill {
  background: rgba(251, 191, 36, 0.08);
  border-color: rgba(251, 191, 36, 0.2);
}

.stat-svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.stat-value {
  font-size: 14px;
  font-weight: 800;
  color: var(--text);
  line-height: 1;
  letter-spacing: -0.01em;
}

.week-row {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.day-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.day-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--bg-elevated);
  border: 2px solid #374151;
  transition: background var(--transition-md), border-color var(--transition-md), box-shadow var(--transition-md);
}

.day-dot.done {
  background: var(--primary);
  border-color: var(--primary-dark);
}

.day-dot.today {
  border-color: var(--primary);
}

.day-dot.today.done {
  box-shadow: 0 0 0 3px rgba(88, 204, 2, 0.2);
}

.day-label {
  font-size: 9px;
  font-weight: 800;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
</style>
