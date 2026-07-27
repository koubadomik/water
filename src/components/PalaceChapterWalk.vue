<template>
  <section class="walk" @click="advance">
    <header class="walk-header">
      <button class="end-button" @click.stop="emit('close')">← Palace</button>
      <span>{{ chapterLabel }}</span>
      <span>{{ index + 1 }} / {{ verses.length }}</span>
    </header>

    <main class="page" :key="verse.ref">
      <div class="page-number">{{ index + 1 }}</div>
      <div v-if="verse.note && stage !== 'blank'" class="note" :class="{ writing: typingNote }">
        <span class="note-label">Your memory image</span>
        <p>{{ shownNote }}<i v-if="typingNote" class="pen-caret" /></p>
      </div>
      <div v-if="stage === 'verse'" class="reference">{{ verse.ref }}</div>
      <p v-if="stage === 'verse'" class="verse" :class="{ typing: typingVerse }">{{ shownVerse }}<i v-if="typingVerse" class="caret" /></p>
      <p v-if="isComplete" class="finished">You walked through {{ chapterLabel }}.</p>
    </main>

    <footer class="controls">
      <button class="previous" :disabled="index === 0" @click.stop="previous">←</button>
      <button class="next" @click.stop="advance">{{ actionLabel }}</button>
    </footer>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'

const props = defineProps({ verses: { type: Array, required: true }, chapterLabel: { type: String, required: true } })
const emit = defineEmits(['close'])
const index = ref(0)
const shownVerse = ref('')
const shownNote = ref('')
const typingVerse = ref(false)
const typingNote = ref(false)
const isComplete = ref(false)
const stage = ref('blank')
let timer = null
const verse = computed(() => props.verses[index.value])
const isLast = computed(() => index.value === props.verses.length - 1)
const actionLabel = computed(() => {
  if (isComplete.value) return 'Back to Palace'
  if (typingVerse.value || typingNote.value) return 'Show all'
  if (stage.value === 'blank') return verse.value.note ? 'Show memory image' : 'Show verse'
  if (stage.value === 'note') return 'Show verse'
  return isLast.value ? 'Finish' : 'Next page →'
})
const canAnimate = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
function clear() { if (timer) clearTimeout(timer); timer = null }
function completeCurrent() {
  clear()
  if (typingNote.value) shownNote.value = verse.value.note || ''
  if (typingVerse.value) shownVerse.value = verse.value.text
  typingVerse.value = false
  typingNote.value = false
}
function humanDelay(character, pen = false) {
  if (/[.!?]/.test(character)) return pen ? 240 : 180
  if (/[,;:]/.test(character)) return pen ? 130 : 95
  if (/\s/.test(character)) return pen ? 18 : 12
  return (pen ? 28 : 16) + Math.floor(Math.random() * (pen ? 34 : 22))
}
function type(text, set, pen, done) {
  let count = 0
  const step = () => {
    count++
    set(text.slice(0, count))
    if (count < text.length) timer = setTimeout(step, humanDelay(text[count - 1], pen))
    else { timer = null; done?.() }
  }
  step()
}
function showNote() {
  stage.value = 'note'; shownNote.value = ''
  if (!canAnimate()) { shownNote.value = verse.value.note || ''; return }
  typingNote.value = true
  type(verse.value.note, value => { shownNote.value = value }, true, () => { typingNote.value = false })
}
function showVerse() {
  stage.value = 'verse'; shownVerse.value = ''
  if (!canAnimate()) { shownVerse.value = verse.value.text; return }
  typingVerse.value = true
  type(verse.value.text, value => { shownVerse.value = value }, false, () => { typingVerse.value = false })
}
function resetPage() { clear(); stage.value = 'blank'; shownVerse.value = ''; shownNote.value = ''; typingVerse.value = false; typingNote.value = false; isComplete.value = false }
function advance() {
  if (isComplete.value) return emit('close')
  if (typingVerse.value || typingNote.value) return completeCurrent()
  if (stage.value === 'blank') return verse.value.note ? showNote() : showVerse()
  if (stage.value === 'note') return showVerse()
  if (isLast.value) { isComplete.value = true; return }
  index.value++; resetPage()
}
function previous() { if (index.value > 0) { index.value--; resetPage() } }
resetPage()
onBeforeUnmount(clear)
</script>

<style scoped>
.walk { display: flex; flex: 1; flex-direction: column; background: var(--palace-background); color: var(--palace-ink); overflow: hidden; }
.walk-header { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 8px; padding: 14px 16px; color: var(--palace-muted); font-size: 12px; letter-spacing: .05em; border-bottom: 1px solid var(--palace-line); }
.walk-header > :last-child { text-align: right; }.end-button { justify-self: start; border: 0; background: none; color: var(--palace-muted); font: inherit; cursor: pointer; padding: 4px 0; }
.page { position: relative; flex: 1; margin: 16px; padding: 42px 28px; overflow: auto; background: var(--palace-page); border: 1px solid var(--palace-line); box-shadow: 3px 5px 18px #6b51311c; }
.page-number { position: absolute; top: 16px; right: 20px; color: var(--palace-muted); font-family: Georgia, serif; font-size: 12px; opacity: .55; }.reference { margin-bottom: 22px; color: var(--palace-muted); font-size: 12px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }.verse { margin: 0; font-family: Georgia, var(--font-reading), serif; font-size: 22px; line-height: 1.65; }.note { margin: 0 0 28px; padding-bottom: 18px; border-bottom: 1px solid var(--palace-line); color: var(--palace-note); }.note-label { display: block; margin-bottom: 7px; color: var(--palace-muted); font-size: 10px; letter-spacing: .12em; text-transform: uppercase; }.note p { margin: 0; font-family: "Snell Roundhand", "Apple Chancery", "Segoe Script", "Bradley Hand", cursive; font-size: 22px; line-height: 1.48; letter-spacing: .015em; transform: rotate(-.35deg); transform-origin: left center; }.caret, .pen-caret { display: inline-block; width: 2px; height: 1.05em; margin-left: 2px; vertical-align: -.16em; background: currentColor; animation: blink .8s step-end infinite; }.pen-caret { width: 1px; }.finished { margin-top: 38px; color: var(--palace-muted); font-style: italic; }.controls { display: flex; gap: 10px; padding: 0 16px 18px; }.controls button { min-height: 48px; border-radius: 10px; font: inherit; font-weight: 700; cursor: pointer; }.previous { width: 52px; border: 1px solid var(--palace-line); background: var(--palace-page); color: var(--palace-muted); }.previous:disabled { opacity: .35; cursor: default; }.next { flex: 1; border: 0; background: var(--primary); color: var(--primary-foreground); }@keyframes blink { 50% { opacity: 0; } }@media (prefers-reduced-motion: reduce) { .caret, .pen-caret { animation: none; } }
</style>
