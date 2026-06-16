<template>
  <AppShell v-model="activeTab">
    <template #default>
      <TopBar :streak="streak" :xp="xp" />

      <main class="main">
        <!-- HOME tab: session flow -->
        <template v-if="activeTab === 'home'">
          <PalaceWalkView
            v-if="phase === 'palace-walk'"
            :verses="palaceVerses"
            @done="advance"
          />
          <RandomReviewView
            v-else-if="phase === 'random-review'"
            :verses="reviewVerses"
            @done="() => { addXp(20); advance() }"
          />
          <NewVerseDrillView
            v-else-if="phase === 'new-verse-drill'"
            :verse="currentVerse"
            @done="() => { addXp(50); advance() }"
          />
          <CelebrationView
            v-else-if="phase === 'celebration'"
            :xp="xp"
            :streak="streak"
            @done="resetSession"
          />
        </template>

        <!-- PALACE tab -->
        <div v-else-if="activeTab === 'palace'" class="placeholder">
          <span>🏛️</span>
          <p>Memory Palace — coming soon</p>
        </div>

        <!-- SYMBOLS tab -->
        <div v-else-if="activeTab === 'symbols'" class="placeholder">
          <span>✨</span>
          <p>Symbolic Language — coming soon</p>
        </div>

        <!-- MORE tab -->
        <div v-else-if="activeTab === 'more'" class="placeholder">
          <span>☰</span>
          <p>More options — coming soon</p>
        </div>
      </main>
    </template>
  </AppShell>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppShell from './components/AppShell.vue'
import TopBar from './components/TopBar.vue'
import PalaceWalkView from './components/PalaceWalkView.vue'
import RandomReviewView from './components/RandomReviewView.vue'
import NewVerseDrillView from './components/NewVerseDrillView.vue'
import CelebrationView from './components/CelebrationView.vue'
import { useSession } from './composables/useSession.js'

const { phase, xp, advance, addXp } = useSession()

const activeTab = ref('home')
const streak = ref(0)

// Placeholder verse data — will be replaced with localStorage/bible loading
const palaceVerses = [
  { ref: 'John 3:16', text: 'For God so loved the world that he gave his one and only Son', note: '' },
  { ref: 'Psalm 23:1', text: 'The Lord is my shepherd, I lack nothing', note: '' },
]

const reviewVerses = computed(() => palaceVerses.slice(0, 2))

const currentVerse = computed(() => palaceVerses[0])

function resetSession() {
  window.location.reload()
}
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
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex: 1;
  color: #6b7280;
  font-size: 15px;
}

.placeholder span { font-size: 48px; }
</style>
