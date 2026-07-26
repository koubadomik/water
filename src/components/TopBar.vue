<template>
  <header class="top-bar">
    <div class="stats-row">
      <div data-testid="streak" class="stat-pill">
        <svg class="stat-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>
        <span class="stat-value">{{ streak }}</span>
      </div>

      <div data-testid="xp" class="stat-pill xp-pill">
        <svg class="stat-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
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
  padding: var(--space-3) var(--space-4) var(--space-2);
  background: var(--background);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-shrink: 0;
}

.stats-row {
  display: flex;
  gap: var(--space-4);
  order: 2;
}

/* Counters read as quiet metadata, not as trophies. */
.stat-pill {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--muted-foreground);
}

.stat-svg {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  fill: none;
}

.stat-value {
  font-size: var(--text-sm);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.week-row {
  display: flex;
  gap: var(--space-2);
  order: 1;
}

.day-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
}

.day-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: transparent;
  border: 1.5px solid var(--border);
  transition: background var(--transition), border-color var(--transition);
}

.day-dot.done {
  background: var(--primary);
  border-color: var(--primary);
}

.day-dot.today {
  border-color: var(--muted-foreground);
}

.day-label {
  font-size: 9px;
  font-weight: 600;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
</style>
