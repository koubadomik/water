<template>
  <header class="top-bar">
    <div class="stats-row">
      <div data-testid="streak" class="stat">
        <span class="stat-icon">🔥</span>
        <span class="stat-value">{{ streak }}</span>
      </div>
      <div data-testid="xp" class="stat">
        <span class="stat-icon">⚡</span>
        <span class="stat-value">{{ xp }}</span>
      </div>
    </div>

    <div class="week-row" aria-label="This week">
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
  // Start from Monday (ISO week)
  const dow = today.getDay() // 0=Sun
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
  padding: 8px 16px 6px;
  background: #111827;
  border-bottom: 1px solid #1f2937;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stats-row {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 700;
  font-size: 15px;
  color: #f9fafb;
}

.stat-icon { font-size: 18px; }

.week-row {
  display: flex;
  justify-content: center;
  gap: 4px;
  padding: 2px 0;
}

.day-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.day-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #1f2937;
  border: 2px solid #374151;
  transition: background 0.2s;
}

.day-dot.done {
  background: #58cc02;
  border-color: #3d8f00;
}

.day-dot.today {
  border-color: #58cc02;
}

.day-dot.today.done {
  box-shadow: 0 0 0 2px #14532d;
}

.day-label {
  font-size: 9px;
  font-weight: 700;
  color: #4b5563;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
