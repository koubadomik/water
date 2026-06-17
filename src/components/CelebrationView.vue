<template>
  <div class="confetti-wrap">
    <div v-for="p in pieces" :key="p.id" class="confetti-piece" :style="p.style" />
  </div>
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
import { ref, onMounted } from 'vue'

defineProps({
  xp:     { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
})

const emit = defineEmits(['done'])

const pieces = ref([])
onMounted(() => {
  const colors = ['#58cc02', '#ffd700', '#ff6b6b', '#4fc3f7', '#ce93d8', '#ffb74d']
  pieces.value = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    style: {
      left: Math.random() * 100 + 'vw',
      width: (6 + Math.random() * 6) + 'px',
      height: (6 + Math.random() * 6) + 'px',
      background: colors[Math.floor(Math.random() * colors.length)],
      animationDuration: (0.8 + Math.random() * 0.8) + 's',
      animationDelay: (Math.random() * 0.5) + 's',
    }
  }))
})
</script>

<style scoped>
.confetti-wrap {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
  overflow: hidden;
}

.confetti-piece {
  position: absolute;
  top: -20px;
  border-radius: 2px;
  animation: confetti-fall linear forwards;
}

@keyframes confetti-fall {
  0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
  80%  { opacity: 1; }
  100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
}

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
