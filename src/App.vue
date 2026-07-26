<template>
  <AppShell v-model="activeTab">
    <template #default>
      <TopBar :streak="streak" :xp="xp" :weekly-progress="weeklyProgress" />

      <main class="main">
        <HomeView    v-if="activeTab === 'home'"    />
        <PalaceView  v-else-if="activeTab === 'palace'"  />
        <StudyView   v-else-if="activeTab === 'new'"     />
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
import StudyView  from './views/StudyView.vue'
import MoreView   from './views/MoreView.vue'
import { useProgress } from './composables/useProgress.js'

const TABS = ['home', 'palace', 'new', 'more']

// Sections are addressable by hash — /next/#/new opens the study sets.
function tabFromHash() {
  const name = (location.hash || '').replace(/^#\/?/, '')
  return TABS.includes(name) ? name : null
}

// A tab that no longer exists (a removed section, a stale saved value)
// must not leave the shell rendering nothing.
function knownTab(name) {
  return TABS.includes(name) ? name : null
}

const activeTab = ref(tabFromHash() ?? knownTab(localStorage.getItem('lastTab')) ?? 'home')

watch(activeTab, val => {
  localStorage.setItem('lastTab', val)
  const target = `#/${val}`
  if (location.hash !== target) history.replaceState(null, '', target)
}, { immediate: true })

window.addEventListener('hashchange', () => {
  const next = tabFromHash()
  if (next && next !== activeTab.value) activeTab.value = next
})
const { streak, xp, state: progressState } = useProgress()
const weeklyProgress = computed(() => progressState.value.weeklyProgress ?? {})
</script>

<!-- Global tokens, base styles and shared controls live in src/styles/theme.css -->

<style scoped>
.main {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>
