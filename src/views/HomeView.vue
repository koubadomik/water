<template>
  <div class="home">
    <!-- No verses yet -->
    <div v-if="verses.length === 0" class="empty">
      <div class="empty-icon">📖</div>
      <h2>No verses yet</h2>
      <p>Go to the <strong>Palace</strong> tab to browse the Bible and add verses to your list.</p>
    </div>

    <!-- Session in progress -->
    <template v-else-if="sessionActive">
      <PalaceWalkView
        v-if="phase === 'palace-walk'"
        :verses="sessionVerses"
        @done="advance"
      />
      <RandomReviewView
        v-else-if="phase === 'random-review'"
        :verses="reviewVerses"
        @done="onReviewDone"
      />
      <NewVerseDrillView
        v-else-if="phase === 'new-verse-drill'"
        :verse="currentVerse"
        @done="onDrillDone"
      />
      <CelebrationView
        v-else-if="phase === 'celebration'"
        :xp="sessionXp"
        :streak="streak"
        @done="endSession"
      />
    </template>

    <!-- Path map -->
    <template v-else>
      <div class="path-header">
        <h2>Your Path</h2>
        <p class="subtitle">{{ verses.length }} verse{{ verses.length !== 1 ? 's' : '' }}</p>
      </div>

      <div class="path">
        <div
          v-for="(verse, i) in verses"
          :key="verse.ref"
          class="path-node-row"
          :class="{ offset: i % 2 === 1 }"
        >
          <button class="path-node" @click="startSessionFor(verse)">
            <span class="node-num">{{ i + 1 }}</span>
          </button>
          <div class="node-label">{{ verse.ref }}</div>
        </div>
      </div>

      <div class="start-bar">
        <button class="btn-start" @click="startSession">
          Start Today's Session
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import PalaceWalkView from '../components/PalaceWalkView.vue'
import RandomReviewView from '../components/RandomReviewView.vue'
import NewVerseDrillView from '../components/NewVerseDrillView.vue'
import CelebrationView from '../components/CelebrationView.vue'
import { useVerseList } from '../composables/useVerseList.js'
import { useProgress } from '../composables/useProgress.js'
import { useSession } from '../composables/useSession.js'

const { verses } = useVerseList()
const { streak, completeSession } = useProgress()
const { phase, advance, addXp } = useSession()

const sessionActive = ref(false)
const sessionXp = ref(0)
const currentVerse = ref(null)

const sessionVerses = computed(() => {
  return verses.value.map(v => ({
    ref: v.ref,
    text: v.text,
    note: v.note || '',
  }))
})

const reviewVerses = computed(() => {
  const shuffled = [...verses.value].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(2, shuffled.length))
})

function startSession() {
  if (verses.value.length === 0) return
  currentVerse.value = verses.value[Math.floor(Math.random() * verses.value.length)]
  sessionXp.value = 0
  sessionActive.value = true
}

function startSessionFor(verse) {
  currentVerse.value = verse
  sessionXp.value = 0
  sessionActive.value = true
}

function onReviewDone() {
  sessionXp.value += 20
  addXp(20)
  advance()
}

function onDrillDone() {
  sessionXp.value += 50
  addXp(50)
  advance()
}

function endSession() {
  completeSession(sessionXp.value)
  sessionActive.value = false
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex: 1;
  padding: 40px 24px;
  text-align: center;
  color: #9ca3af;
}

.empty-icon { font-size: 64px; }

.empty h2 { font-size: 22px; color: #f9fafb; }

.empty strong { color: #58cc02; }

.path-header {
  padding: 20px 20px 0;
}

.path-header h2 {
  font-size: 22px;
  font-weight: 800;
  color: #f9fafb;
}

.subtitle {
  font-size: 13px;
  color: #6b7280;
  margin-top: 2px;
}

.path {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 16px 100px;
}

.path-node-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: transform 0.1s;
}

.path-node-row.offset {
  align-self: flex-end;
  margin-right: 60px;
}

.path-node {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #58cc02;
  border: 4px solid #3d8f00;
  box-shadow: 0 4px 0 #2d6b00;
  color: #fff;
  font-size: 20px;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s, box-shadow 0.1s;
}

.path-node:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 #2d6b00;
}

.node-label {
  font-size: 11px;
  color: #9ca3af;
  text-align: center;
  max-width: 80px;
}

.start-bar {
  position: fixed;
  bottom: 70px;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: linear-gradient(to top, #111827 70%, transparent);
  display: flex;
  justify-content: center;
}

.btn-start {
  width: 100%;
  max-width: 400px;
  padding: 18px;
  background: #58cc02;
  color: #fff;
  font-size: 17px;
  font-weight: 800;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  box-shadow: 0 4px 0 #3d8f00;
}
</style>
