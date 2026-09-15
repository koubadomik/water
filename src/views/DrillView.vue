<template>
  <section class="drill">
    <header class="drill-head">
      <div><p class="drill-kicker">Practice path</p><h2>Drill</h2></div>
      <span v-if="current" class="drill-count">{{ index + 1 }} / {{ verses.length }}</span>
    </header>

    <div v-if="choosing || !verses.length" class="drill-empty">
      <p class="drill-kicker">Your drill</p>
      <h3>Choose a verse or range.</h3>
      <p>For example: <b>Zj 1:1-5</b>, or just <b>Zjevení 1</b> for a whole chapter.</p>
      <div class="drill-picker"><input v-model="rangeInput" class="input" placeholder="Zj 1:1-5" autocomplete="off" autocapitalize="off" spellcheck="false" @keydown.enter.prevent="startRange" /><button class="btn btn-primary" :disabled="!resolved.ok" @click="startRange">Drill</button></div>
      <p v-if="rangeInput.trim() && resolved.ok" class="drill-picker-note">{{ resolved.label }} · {{ resolved.verses.length }} verses ready</p>
      <p v-else-if="rangeInput.trim() && bibleLoading" class="drill-picker-note">Loading Bible…</p>
      <p v-else-if="rangeInput.trim() && resolved.error" class="drill-picker-note error">{{ resolved.error }}</p>
    </div>

    <template v-else>
      <button class="drill-change" @click="choosing = true">Change verses</button>
      <div class="drill-display" aria-label="Verse display">
        <button :class="{ active: displayMode === 'one' }" @click="displayMode = 'one'">One verse</button>
        <button :class="{ active: displayMode === 'all' }" @click="displayMode = 'all'">All verses</button>
      </div>

      <div class="drill-steps" aria-label="Drill steps">
        <button :class="{ active: stage === 'next' }" @click="stage = 'next'">1 · Next word</button>
        <button :class="{ active: stage === 'blanks' }" @click="stage = 'blanks'">2 · Write blanks</button>
        <button :class="{ active: stage === 'recall' }" @click="stage = 'recall'">3 · Full recall</button>
      </div>

      <template v-if="displayMode === 'one'">
        <DrillNextWord v-if="stage === 'next'" :key="`${current.id}-next`" :verse="current.payload" @done="stage = 'blanks'" />
        <DrillBlankWrite v-else-if="stage === 'blanks'" :key="`${current.id}-blanks`" :verse="current.payload" @done="stage = 'recall'" />
        <VerseRecall v-else-if="stage === 'recall'" :key="`${current.id}-recall`" :verse="current.payload" retry-inline @done="finishRecall" />

        <section v-else class="drill-complete">
          <p class="drill-kicker">Recorded</p>
          <h3>{{ isKnown(current.id) ? 'Known.' : 'Well recalled.' }}</h3>
          <p>{{ current.payload.ref }} has been updated in Home and will still return at wider intervals.</p>
          <button class="btn btn-primary" @click="nextVerse">Next verse</button>
        </section>

        <button v-if="stage !== 'complete'" class="drill-switch" @click="nextVerse">Skip to next verse →</button>
      </template>

      <section v-else class="drill-all">
        <DrillNextWord v-if="stage === 'next'" :key="'all-next'" :verse="allVerse" @done="stage = 'blanks'" />
        <DrillBlankWrite v-else-if="stage === 'blanks'" :key="'all-blanks'" :verse="allVerse" @done="stage = 'recall'" />
        <VerseRecall v-else-if="stage === 'recall'" :key="'all-recall'" :verse="allVerse" retry-inline @done="finishAllRecall" />
        <section v-else class="drill-complete"><p class="drill-kicker">Recorded</p><h3>Known.</h3><p>Every verse in this range has been updated in Home.</p></section>
      </section>
    </template>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import VerseRecall from '../components/study/VerseRecall.vue'
import DrillNextWord from '../components/study/DrillNextWord.vue'
import DrillBlankWrite from '../components/study/DrillBlankWrite.vue'
import { useQueue } from '../composables/useQueue.js'
import { useReview } from '../composables/useReview.js'
import { useBible } from '../composables/useBible.js'
import { useStorage } from '../composables/useStorage.js'
import { resolveReference } from '../lib/reference.js'

const { grade, isKnown } = useQueue()
const { verses: savedVerses, addVerses } = useReview()
const { bible, loading: bibleLoading } = useBible()
const selectedRefs = useStorage('drillVerseRefs_v1', [])
const choosing = ref(!selectedRefs.value.length)
const rangeInput = ref('')
const resolved = computed(() => resolveReference(bible.value, rangeInput.value))
const verses = computed(() => {
  const byRef = new Map(savedVerses.value.map((verse) => [verse.ref, verse]))
  return selectedRefs.value.map((ref) => byRef.get(ref)).filter(Boolean).map((payload) => ({ id: `verse:${payload.ref}`, payload }))
})
const index = ref(0)
const stage = ref('next')
const displayMode = ref('one')
const current = computed(() => verses.value[index.value] ?? null)
const allVerse = computed(() => ({
  ref: verses.value.length === 1 ? verses.value[0].payload.ref : `${verses.value[0].payload.ref} – ${verses.value.at(-1).payload.ref}`,
  text: verses.value.map((verse) => verse.payload.text).join('\n\n'),
}))

function nextVerse() {
  if (!verses.value.length) return
  index.value = (index.value + 1) % verses.value.length
  stage.value = 'next'
}

function startRange() {
  if (!resolved.value.ok) return
  addVerses(resolved.value.verses)
  selectedRefs.value = resolved.value.verses.map((verse) => verse.ref)
  index.value = 0
  stage.value = 'next'
  choosing.value = false
  rangeInput.value = ''
}

function finishRecall(result) {
  if (result !== 'got' || !current.value) return
  grade(current.value.id, 'got')
  stage.value = 'complete'
}

function finishAllRecall(result) {
  if (result !== 'got') return
  verses.value.forEach((verse) => grade(verse.id, 'got'))
  stage.value = 'complete'
}

</script>

<style scoped>
.drill { padding:var(--space-5) var(--space-4) var(--space-10); }.drill-head { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:var(--space-4); }.drill-head h2 { margin:0; font-size:var(--text-2xl); }.drill-kicker { margin:0 0 2px; color:var(--primary); font-size:10px; font-weight:800; letter-spacing:.13em; text-transform:uppercase; }.drill-count { color:var(--muted-foreground); font-size:13px; font-weight:700; }.drill-display { display:flex; gap:4px; margin:0 0 var(--space-4); padding:3px; border:1px solid var(--border); border-radius:var(--radius-full); background:var(--muted); }.drill-display button { flex:1; min-height:32px; border:0; border-radius:var(--radius-full); background:transparent; color:var(--muted-foreground); font:inherit; font-size:12px; font-weight:700; }.drill-display button.active { background:var(--card); color:var(--foreground); box-shadow:var(--shadow-sm); }.drill-steps { display:grid; grid-template-columns:repeat(3,1fr); gap:4px; margin-bottom:var(--space-5); }.drill-steps button { min-height:38px; padding:7px 3px; border:0; border-bottom:2px solid var(--border); background:transparent; color:var(--muted-foreground); font:700 10px var(--font-reading); text-transform:uppercase; }.drill-steps button.active { border-color:var(--primary); color:var(--foreground); }.drill-complete,.drill-empty { padding:var(--space-5); border:1px solid var(--border); border-radius:var(--radius-xl); background:var(--card); box-shadow:var(--shadow-sm); }.drill-empty h3 { margin:0 0 var(--space-2); font-size:var(--text-xl); }.drill-empty p,.drill-complete p { margin:0 0 var(--space-5); color:var(--muted-foreground); line-height:1.55; }.drill-picker { display:flex; gap:var(--space-2); }.drill-picker .input { min-width:0; flex:1; }.drill-picker .btn { flex:0 0 auto; }.drill-picker-note { margin:var(--space-3) 0 0 !important; font-size:var(--text-sm); }.drill-picker-note.error { color:var(--destructive); }.drill-change { display:block; margin:0 0 var(--space-3) auto; border:0; background:transparent; color:var(--primary); font:inherit; font-size:13px; font-weight:700; cursor:pointer; }.drill-all { display:grid; gap:var(--space-4); }.drill-complete h3 { margin:0 0 var(--space-2); font-size:var(--text-xl); }.drill-complete .btn { width:100%; }.drill-switch { display:block; width:100%; min-height:44px; margin-top:var(--space-3); border:0; background:transparent; color:var(--muted-foreground); font:inherit; cursor:pointer; }
</style>
