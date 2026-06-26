<template>
  <AppShell v-model="activeTab">
    <template #default>
      <TopBar :streak="streak" :xp="xp" :weekly-progress="weeklyProgress" />

      <main class="main">
        <HomeView    v-if="activeTab === 'home'"    />
        <PalaceView  v-else-if="activeTab === 'palace'"  />
        <SymbolsView v-else-if="activeTab === 'symbols'" />
        <MoreView    v-else-if="activeTab === 'more'"    @navigate="activeTab = $event" />
      </main>
    </template>
  </AppShell>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import AppShell   from './components/AppShell.vue'
import TopBar     from './components/TopBar.vue'
import HomeView   from './views/HomeView.vue'
import PalaceView from './views/PalaceView.vue'
import SymbolsView from './views/SymbolsView.vue'
import MoreView   from './views/MoreView.vue'
import { useProgress } from './composables/useProgress.js'

const activeTab = ref(localStorage.getItem('lastTab') ?? 'home')
watch(activeTab, val => localStorage.setItem('lastTab', val))
const { streak, xp, state: progressState } = useProgress()
const weeklyProgress = computed(() => progressState.value.weeklyProgress ?? {})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

:root {
  --bg:           #111827;
  --bg-raised:    #1a2332;
  --bg-elevated:  #1f2937;
  --surface:      rgba(255, 255, 255, 0.04);
  --border:       rgba(255, 255, 255, 0.07);
  --border-solid: #1f2937;
  --primary:      #58cc02;
  --primary-dark: #3d8f00;
  --primary-shadow: #2d6b00;
  --primary-glow: rgba(88, 204, 2, 0.25);
  --text:         #f1f5f9;
  --text-muted:   #64748b;
  --text-dim:     #9ca3af;
  --danger:       #ef4444;
  --warning:      #f59e0b;
  --font:         'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --radius-sm:    8px;
  --radius-md:    12px;
  --radius-lg:    16px;
  --radius-xl:    20px;
  --radius-full:  9999px;
  --shadow-sm:    0 1px 3px rgba(0,0,0,0.4);
  --shadow-md:    0 4px 12px rgba(0,0,0,0.5);
  --shadow-lg:    0 8px 24px rgba(0,0,0,0.6);
  --transition:   150ms cubic-bezier(0.16, 1, 0.3, 1);
  --transition-md: 250ms cubic-bezier(0.16, 1, 0.3, 1);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>

<style scoped>
.main {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>
