<template>
  <div class="more">
    <div class="menu-header">More</div>

    <section class="menu-section" aria-labelledby="legacy-heading">
      <h2 id="legacy-heading" class="section-title">Legacy tools</h2>
      <p class="section-description">
        These open the original app unchanged. The new app is the home for your daily practice,
        Palace notes, and study material.
      </p>

      <div class="menu-list">
        <a class="menu-item" data-testid="legacy-byheart" href="legacy.html" target="_blank" rel="noopener">
          <span class="menu-icon">🧠</span>
          <span class="menu-text">
            <span class="menu-title">ByHeart</span>
            <span class="menu-desc">Open the original memorisation tool ↗</span>
          </span>
          <span class="chevron" aria-hidden="true">›</span>
        </a>

        <a class="menu-item" data-testid="legacy-drill" href="legacy.html" target="_blank" rel="noopener">
          <span class="menu-icon">✍️</span>
          <span class="menu-text">
            <span class="menu-title">Drill Mode</span>
            <span class="menu-desc">Open the original full-recall drill ↗</span>
          </span>
          <span class="chevron" aria-hidden="true">›</span>
        </a>
      </div>
    </section>

    <section class="util-section" aria-labelledby="settings-heading">
      <h2 id="settings-heading" class="section-title">Settings</h2>
      <button class="util-btn" @click="clearBibleCache">
        🗑 Clear Bible cache
        <span class="util-desc">Force a fresh Bible-data download next time you open Palace.</span>
      </button>
    </section>

    <section class="util-section" aria-labelledby="appearance-heading">
      <h2 id="appearance-heading" class="section-title">Appearance</h2>
      <div class="skin-list">
        <button
          v-for="skin in skins"
          :key="skin.id"
          class="skin-option"
          :class="{ selected: selectedSkin === skin.id }"
          @click="applyAppearance(skin.id)"
        >
          <span class="skin-swatches" aria-hidden="true">
            <i v-for="color in skin.swatches" :key="color" :style="{ background: color }"></i>
          </span>
          <span class="skin-copy"><strong>{{ skin.name }}</strong><small>{{ skin.description }}</small></span>
          <span v-if="selectedSkin === skin.id" class="skin-check">✓</span>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useAppearance } from '../composables/useAppearance.js'

const { skins, selectedSkin, applyAppearance } = useAppearance()

function clearBibleCache() {
  if (confirm('Clear the cached Bible data? It will be re-downloaded next time you open the Palace.')) {
    localStorage.removeItem('bibleJSON')
    alert('Cache cleared. Reload the app to fetch fresh data.')
  }
}
</script>

<style scoped>
.more {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
}

.menu-header {
  padding: 20px 16px 8px;
  font-size: 22px;
  font-weight: 700;
  color: var(--foreground);
}

.menu-section,
.util-section {
  padding: 16px;
}

.section-title {
  margin-bottom: 4px;
  font-size: 13px;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.section-description {
  margin-bottom: 12px;
  font-size: 13px;
  line-height: 1.45;
  color: var(--muted-foreground);
}

.menu-list {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 14px;
  background: none;
  border: none;
  border-bottom: 1px solid var(--border);
  padding: 16px;
  cursor: pointer;
  width: 100%;
  text-align: left;
  text-decoration: none;
  color: inherit;
  box-sizing: border-box;
}

.menu-item:last-child { border-bottom: none; }

.menu-icon { font-size: 28px; }
.menu-text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.menu-title { font-size: 16px; font-weight: 600; color: var(--foreground); }
.menu-desc { font-size: 13px; color: var(--muted-foreground); }
.chevron { font-size: 22px; color: var(--muted-foreground); }

.util-btn {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--muted);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--foreground);
  font-size: 15px;
  padding: 14px 16px;
  text-align: left;
  cursor: pointer;
  width: 100%;
}

.util-desc {
  font-size: 12px;
  color: var(--muted-foreground);
}

.skin-list { overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-lg); }
.skin-option { display: flex; width: 100%; align-items: center; gap: 12px; padding: 12px; border: 0; border-bottom: 1px solid var(--border); background: var(--card); color: var(--foreground); text-align: left; cursor: pointer; }
.skin-option:last-child { border-bottom: 0; }
.skin-option.selected { background: var(--accent); }
.skin-swatches { display: flex; overflow: hidden; width: 38px; height: 28px; flex: 0 0 auto; border: 1px solid var(--border); border-radius: 7px; }
.skin-swatches i { flex: 1; }
.skin-copy { display: flex; flex: 1; flex-direction: column; gap: 1px; }
.skin-copy strong { font-size: 14px; }.skin-copy small { color: var(--muted-foreground); font-size: 12px; }.skin-check { color: var(--primary); font-weight: 700; }
</style>
