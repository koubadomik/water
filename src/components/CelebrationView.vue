<template>
  <div class="celebration">
    <div class="trophy">🏆</div>
    <h2 class="title">Session Complete!</h2>

    <div class="stats">
      <div class="stat">
        <span class="stat-icon">⚡</span>
        <span class="stat-value">{{ xp }}</span>
        <span class="stat-label">XP earned</span>
      </div>
      <div class="stat">
        <span class="stat-icon">🔥</span>
        <span class="stat-value">{{ streak }}</span>
        <span class="stat-label">Day streak</span>
      </div>
    </div>

    <button data-testid="done" class="btn" @click="emit('done')">Continue</button>
  </div>
</template>

<script setup>
defineProps({
  xp:     { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
})

const emit = defineEmits(['done'])
</script>

<style scoped>
.celebration {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 40px 16px;
  flex: 1;
  text-align: center;
}

.trophy { font-size: 72px; }

.title {
  font-size: 28px;
  font-weight: 800;
  color: #f9fafb;
  margin: 0;
}

.stats {
  display: flex;
  gap: 32px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-icon  { font-size: 28px; }
.stat-value { font-size: 36px; font-weight: 800; color: #f9fafb; }
.stat-label { font-size: 13px; color: #6b7280; }

.btn {
  width: 100%;
  max-width: 320px;
  padding: 16px;
  background: #58cc02;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  border: none;
  border-radius: 14px;
  cursor: pointer;
}
</style>
