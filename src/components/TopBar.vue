<template>
  <header class="top-bar">
    <div class="brand" aria-label="Bible memorisation"><PaperBird v-if="birdEnabled" compact /></div>
  </header>
</template>

<script setup>
import PaperBird from './PaperBird.vue'
import { usePaperBird } from '../composables/usePaperBird.js'

const { enabled: birdEnabled } = usePaperBird()
</script>

<style scoped>
.top-bar {
  padding: var(--space-3) var(--space-4) var(--space-2);
  background: color-mix(in srgb, var(--background) 86%, transparent);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-shrink: 0;
}
.brand { display: flex; align-items: center; height: 38px; }

.stats-row {
  display: flex;
  gap: var(--space-4);
  order: 3;
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
  order: 2;
  margin-left: auto;
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
