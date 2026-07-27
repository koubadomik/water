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
    id: 'search',
    label: 'Search',
    path: 'M10.5 3.75a6.75 6.75 0 104.243 12.0l4.504 4.504 1.5-1.5-4.504-4.504A6.75 6.75 0 0010.5 3.75z',
  },
  {
    id: 'new',
    label: 'Tests',
    path: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
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
  background: radial-gradient(circle at 10% -10%, color-mix(in srgb, var(--accent) 80%, transparent), transparent 32%), var(--background);
  color: var(--foreground);
}

/* Plain surface with a hairline, not a floating glass slab. */
.bottom-nav {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  border: 1px solid color-mix(in srgb, var(--border) 85%, var(--foreground) 15%);
  background: color-mix(in srgb, var(--card) 90%, transparent);
  backdrop-filter: blur(18px) saturate(1.15);
  margin: 0 var(--space-3) calc(var(--space-3) + env(safe-area-inset-bottom, 0px));
  border-radius: var(--radius-xl);
  padding-bottom: 0;
  box-shadow: var(--shadow-lg);
  flex-shrink: 0;
}

.nav-tab {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  min-height: 58px;
  padding: var(--space-2) var(--space-1);
  background: none;
  border: none;
  color: var(--muted-foreground);
  cursor: pointer;
  transition: color var(--transition), transform var(--transition), background var(--transition);
  -webkit-tap-highlight-color: transparent;
}

.nav-tab:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: -2px;
}

.nav-tab.active {
  color: var(--foreground);
}
.nav-tab.active .tab-icon { stroke-width: 2.35; transform: translateY(-1px); }
.nav-tab:active { transform: scale(.94); }

.tab-pip {
  position: absolute;
  top: 7px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--primary);
  opacity: 0;
  transition: opacity var(--transition);
}

.tab-pip.visible {
  opacity: 1;
}

.tab-icon {
  width: 22px;
  height: 22px;
  stroke-width: 1.75;
  transition: transform var(--transition), stroke-width var(--transition);
}

.tab-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
</style>
