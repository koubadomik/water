<template>
  <aside class="bird" :class="{ chatting, compact }" aria-live="polite">
    <button class="bird-button" aria-label="Paper bird" @click="dismiss">
      <img src="/bird/paper-bird.png" alt="" />
    </button>
    <p v-if="chatting" class="bird-message">{{ message }}</p>
  </aside>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useBible } from '../composables/useBible.js'

const { bible } = useBible()
defineProps({ compact: { type: Boolean, default: false } })
const chatting = ref(false)
const message = ref('One verse at a time.')
let timer
const encouragements = ['One small recall is enough.', 'You are building a path, word by word.', 'A quiet return still counts.', 'Take your time. The words will come back.']
function verseLine() {
  const verses = bible.value ? Object.entries(bible.value).flatMap(([book, data]) => data.chapters.flatMap((chapter, chapterIndex) => chapter.map((text, verseIndex) => ({ text, ref: `${book} ${chapterIndex + 1}:${verseIndex + 1}` })))) : []
  const verse = verses[Math.floor(Math.random() * verses.length)]
  return verse ? `“${verse.text.slice(0, 76)}${verse.text.length > 76 ? '…' : ''}” — ${verse.ref}` : encouragements[0]
}
function nextWordPrompt() {
  const verses = bible.value ? Object.values(bible.value).flatMap(book => book.chapters.flat()) : []
  const words = (verses[Math.floor(Math.random() * verses.length)] || '').split(/\s+/).filter(Boolean)
  if (words.length < 5) return verseLine()
  const at = 2 + Math.floor(Math.random() * Math.min(6, words.length - 2))
  return `Next word? “${words.slice(0, at).join(' ')} …”`
}
function showMessage() {
  const choice = Math.random()
  message.value = choice < .58 ? verseLine() : choice < .82 ? encouragements[Math.floor(Math.random() * encouragements.length)] : nextWordPrompt()
  chatting.value = true
  clearTimeout(timer)
  timer = setTimeout(() => { chatting.value = false }, 6500)
}
function dismiss() {
  if (chatting.value) {
    clearTimeout(timer)
    chatting.value = false
  } else {
    showMessage()
  }
}
onBeforeUnmount(() => clearTimeout(timer))
</script>

<style scoped>
.bird { position: fixed; z-index: 7; right: 14px; bottom: 82px; display: flex; align-items: end; gap: 8px; pointer-events: none; }.bird.compact { position: relative; right: auto; bottom: auto; z-index: 20; }.bird-button { width: 82px; height: 72px; padding: 0; border: 0; background: none; cursor: pointer; pointer-events: auto; animation: perch 5.5s ease-in-out infinite; }.compact .bird-button { width: 44px; height: 38px; }.bird-button img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 5px 5px color-mix(in srgb, var(--primary) 20%, transparent)); }.bird-message { max-width: 190px; margin: 0 0 12px; padding: 10px 12px; border: 1px solid var(--border); border-radius: var(--radius-lg) var(--radius-lg) 2px var(--radius-lg); background: var(--card); color: var(--foreground); box-shadow: var(--shadow-md); font-family: var(--font-reading); font-size: 13px; line-height: 1.4; }.compact .bird-message { position:absolute; top:38px; left:0; margin:0; width:190px; }.chatting .bird-button { animation: flutter .8s ease-in-out 2; }@keyframes perch { 0%,100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-4px) rotate(2deg); } }@keyframes flutter { 50% { transform: translateY(-12px) rotate(5deg); } }@media (prefers-reduced-motion: reduce) { .bird-button { animation: none; } }
</style>
