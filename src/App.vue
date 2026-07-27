<template>
  <AppShell v-model="activeTab">
    <template #default>
      <TopBar />
      <button v-if="isZen" class="exit-zen" @click="setZen(false)">× Exit zen mode</button>

      <main class="main">
        <Transition name="page" mode="out-in">
          <div :key="activeTab" class="page-frame">
            <TodayView   v-if="activeTab === 'home'"    @navigate="activeTab = $event" />
            <PalaceView  v-else-if="activeTab === 'palace'"  />
            <SearchView  v-else-if="activeTab === 'search'"  />
            <TestsView   v-else-if="activeTab === 'new'"     />
            <MoreView    v-else-if="activeTab === 'more'"    @navigate="activeTab = $event" />
          </div>
        </Transition>
      </main>
    </template>
  </AppShell>
</template>

<script setup>
import { ref, watch } from 'vue'
import AppShell   from './components/AppShell.vue'
import TopBar     from './components/TopBar.vue'
import TodayView  from './views/TodayView.vue'
import PalaceView from './views/PalaceView.vue'
import SearchView from './views/SearchView.vue'
import TestsView  from './views/TestsView.vue'
import MoreView   from './views/MoreView.vue'
import { useQueue } from './composables/useQueue.js'
import { useZen } from './composables/useZen.js'

const TABS = ['home', 'palace', 'search', 'new', 'more']

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

const { orderedItems, isDoneToday } = useQueue()
const { isZen, setZen } = useZen()
watch(orderedItems, (items) => {
  const remaining = items.filter(item => !isDoneToday(item.id)).length
  if (remaining) navigator.setAppBadge?.(1)
  else navigator.clearAppBadge?.()
}, { immediate: true, deep: true })
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
.exit-zen { position: fixed; z-index: 9999; top: max(12px, env(safe-area-inset-top)); right: 12px; min-height: 44px; padding: 10px 14px; border: 2px solid var(--primary-foreground); border-radius: var(--radius-full); background: var(--primary); color: var(--primary-foreground); font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: var(--shadow-lg); }
.page-frame { display: flex; min-height: 100%; flex: 1; flex-direction: column; }
.page-enter-active, .page-leave-active { transition: opacity 180ms ease, transform 180ms ease; }
.page-enter-from { opacity: 0; transform: translateY(8px); }
.page-leave-to { opacity: 0; transform: translateY(-5px); }
@media (min-width: 760px) { .page-frame { width: min(100%, 760px); margin: 0 auto; border-inline: 1px solid var(--border); box-shadow: 0 0 56px color-mix(in srgb, var(--foreground) 5%, transparent); } }
</style>
