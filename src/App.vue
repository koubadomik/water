<template>
  <AppShell v-model="activeTab">
    <template #default>
      <TopBar :streak="streak" :xp="xp" />

      <main class="main">
        <HomeView    v-if="activeTab === 'home'"    />
        <PalaceView  v-else-if="activeTab === 'palace'"  />
        <SymbolsView v-else-if="activeTab === 'symbols'" />
        <MoreView    v-else-if="activeTab === 'more'"    />
      </main>
    </template>
  </AppShell>
</template>

<script setup>
import { ref } from 'vue'
import AppShell   from './components/AppShell.vue'
import TopBar     from './components/TopBar.vue'
import HomeView   from './views/HomeView.vue'
import PalaceView from './views/PalaceView.vue'
import SymbolsView from './views/SymbolsView.vue'
import MoreView   from './views/MoreView.vue'
import { useProgress } from './composables/useProgress.js'

const activeTab = ref('home')
const { streak, xp } = useProgress()
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: #111827;
  color: #f9fafb;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
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
