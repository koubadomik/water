<template>
  <div class="app-shell">
    <slot />
    <nav class="bottom-nav">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        data-testid="nav-tab"
        :data-tab-id="tab.id"
        :class="['nav-tab', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const activeTab = ref('home')

const tabs = [
  { id: 'home',    icon: '🏠', label: 'Home' },
  { id: 'palace',  icon: '🏛️', label: 'Palace' },
  { id: 'symbols', icon: '✨', label: 'Symbols' },
  { id: 'more',    icon: '☰',  label: 'More' },
]
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  background: #111827;
  color: #f9fafb;
}

.bottom-nav {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-top: 1px solid #1f2937;
  background: #111827;
}

.nav-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 0 14px;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 10px;
  cursor: pointer;
  transition: color 0.15s;
}

.nav-tab.active {
  color: #58cc02;
}

.tab-icon {
  font-size: 22px;
}
</style>
