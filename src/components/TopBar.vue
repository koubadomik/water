<template>
  <header class="top-bar">
    <div data-testid="streak" class="stat">
      <span class="stat-icon">🔥</span>
      <span class="stat-value">{{ streak }}</span>
    </div>
    <div data-testid="xp" class="stat">
      <span class="stat-icon">⚡</span>
      <span class="stat-value">{{ xp }}</span>
    </div>
  </header>
</template>

<script setup>
defineProps({
  streak: { type: Number, default: 0 },
  xp:     { type: Number, default: 0 },
})
</script>

<style scoped>
.top-bar {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding: 10px 16px;
  background: #111827;
  border-bottom: 1px solid #1f2937;
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 700;
  font-size: 15px;
  color: #f9fafb;
}

.stat-icon {
  font-size: 18px;
}
</style>
