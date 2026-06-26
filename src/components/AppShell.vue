<template>
  <div class="app-shell">
    <slot />
    <nav class="bottom-nav" role="navigation" aria-label="Main navigation">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        data-testid="nav-tab"
        :data-tab-id="tab.id"
        :class="['nav-tab', { active: activeTab === tab.id }]"
        :aria-label="tab.label"
        :aria-current="activeTab === tab.id ? 'page' : undefined"
        @click="activeTab = tab.id"
      >
        <span class="tab-pip" :class="{ visible: activeTab === tab.id }" />
        <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path :d="tab.path" />
        </svg>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </nav>
  </div>
</template>

<script setup>
const activeTab = defineModel({ default: 'home' })

const tabs = [
  {
    id: 'home',
    label: 'Home',
    path: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
  },
  {
    id: 'palace',
    label: 'Palace',
    path: 'M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z',
  },
  {
    id: 'symbols',
    label: 'Symbols',
    path: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
  },
  {
    id: 'more',
    label: 'More',
    path: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5',
  },
]
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  background: var(--bg);
  color: var(--text);
}

.bottom-nav {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-top: 1px solid var(--border);
  background: rgba(17, 24, 39, 0.88);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  flex-shrink: 0;
}

.nav-tab {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 10px 4px 12px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  transition: color var(--transition);
  -webkit-tap-highlight-color: transparent;
  outline: none;
}

.nav-tab:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: -2px;
  border-radius: var(--radius-sm);
}

.nav-tab.active {
  color: var(--primary);
}

.tab-pip {
  position: absolute;
  top: 0;
  width: 20px;
  height: 3px;
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  background: var(--primary);
  opacity: 0;
  transform: scaleX(0);
  transition: opacity var(--transition), transform var(--transition);
}

.tab-pip.visible {
  opacity: 1;
  transform: scaleX(1);
}

.tab-icon {
  width: 24px;
  height: 24px;
  transition: transform var(--transition);
}

.nav-tab.active .tab-icon {
  transform: scale(1.08);
}

.tab-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.02em;
  transition: color var(--transition);
}
</style>
