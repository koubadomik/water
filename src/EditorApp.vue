<template>
  <main class="editor-shell">
    <header class="editor-tools">
      <button class="tool-button menu" @click="toolsOpen = !toolsOpen">{{ toolsOpen ? 'Close' : 'Menu' }}</button>
      <template v-if="toolsOpen">
      <select v-model="skin" class="tool-select" @change="applyAppearance(skin)">
        <option v-for="item in skins" :key="item.id" :value="item.id">{{ item.name }}</option>
      </select>
      <select v-model="font" class="tool-select" @change="applyFont(font)">
        <option v-for="item in fonts" :key="item.id" :value="item.id">{{ item.name }}</option>
      </select>
      <span class="tool-spacer" />
      <button class="tool-button bold" title="Bold" @click="command('bold')">B</button>
      <button class="tool-button" @click="copy">Copy</button>
      <button class="tool-button danger" @click="clear">Clear</button>
      </template>
    </header>
    <div v-if="selectionOpen" class="selection-tools">
      <button v-for="color in colors" :key="color" class="color-button" :style="{ background: color }" @mousedown.prevent="command('foreColor', color)" />
      <input v-model="customColor" class="color-picker" type="color" @input="command('foreColor', customColor)" />
    </div>
    <p v-if="copied" class="copied">Copied</p>
    <article ref="editor" class="page" contenteditable="true" spellcheck="true" data-placeholder="Start writing…" @input="save" @keydown="headingShortcut" @mouseup="checkSelection" @keyup="checkSelection" />
  </main>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue'
import { useAppearance } from './composables/useAppearance.js'

const KEY = 'zenEditorHtml'
const editor = ref(null)
const { applyAppearance, applyFont, fonts, selectedFont: font, selectedSkin: skin, skins } = useAppearance()
const copied = ref(false)
const colors = ['#b64c4c', '#c08a28', '#4c8a69', '#477cac']
const customColor = ref('#72558c')
const toolsOpen = ref(false)
const selectionOpen = ref(false)

onMounted(async () => { editor.value.innerHTML = localStorage.getItem(KEY) || ''; await nextTick(); editor.value.focus() })
function save() { localStorage.setItem(KEY, editor.value.innerHTML) }
function command(name, value) { editor.value.focus(); document.execCommand(name, false, value); save() }
function headingShortcut(event) {
  if (event.key !== ' ') return
  const selection = window.getSelection()
  const block = selection?.anchorNode?.parentElement?.closest('div,p,h1,h2')
  const marker = block?.textContent
  if (marker !== '#' && marker !== '##') return
  event.preventDefault()
  block.textContent = ''
  document.execCommand('formatBlock', false, marker === '#' ? 'h1' : 'h2')
  save()
}
function checkSelection() { selectionOpen.value = Boolean(window.getSelection()?.toString().trim()) }
function markdown(node) {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent
  const content = [...node.childNodes].map(markdown).join('')
  const tag = node.nodeName.toLowerCase()
  if (tag === 'strong' || tag === 'b') return `**${content}**`
  if (tag === 'h1') return `\n# ${content}\n\n`
  if (tag === 'h2') return `\n## ${content}\n\n`
  if (tag === 'h3') return `\n### ${content}\n\n`
  if (tag === 'br') return '\n'
  if (tag === 'div' || tag === 'p') return `${content}\n\n`
  if (tag === 'font' || node.style?.color) {
    const color = node.color || node.style.color
    return color ? `<span style="color:${color}">${content}</span>` : content
  }
  return content
}
async function copy() { await navigator.clipboard.writeText(markdown(editor.value).trim()); copied.value = true; setTimeout(() => { copied.value = false }, 1200) }
function clear() { if (confirm('Clear this note?')) { editor.value.innerHTML = ''; save() } }
</script>

<style scoped>
.editor-shell { min-height: 100dvh; background: var(--background); color: var(--foreground); }.editor-tools { position: sticky; top: 0; z-index: 3; display: flex; align-items: center; gap: 8px; min-height: 52px; padding: max(10px, env(safe-area-inset-top)) 14px 10px; border-bottom: 1px solid var(--border); background: color-mix(in srgb, var(--background) 92%, transparent); backdrop-filter: blur(16px); }.tool-select,.tool-button { min-height: 32px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--card); color: var(--foreground); font: inherit; font-size: 12px; cursor: pointer; }.tool-select { max-width: 104px; padding: 0 6px; }.tool-button { padding: 0 9px; }.menu { font-weight: 700; }.bold { font-family: Georgia,serif; font-size: 17px; font-weight: 800; }.tool-spacer { flex: 1; }.selection-tools { position: fixed; z-index: 6; bottom: max(18px, env(safe-area-inset-bottom)); left: 50%; display: flex; gap: 10px; padding: 10px 14px; transform: translateX(-50%); border: 1px solid var(--border); border-radius: var(--radius-full); background: var(--card); box-shadow: var(--shadow-lg); }.color-button,.color-picker { width: 22px; height: 22px; padding: 0; border: 2px solid var(--card); border-radius: 50%; box-shadow: 0 0 0 1px var(--border); cursor: pointer; }.danger { color: var(--destructive); }.page { width: min(100%, 760px); min-height: calc(100dvh - 52px); margin: 0 auto; padding: 54px max(24px, 7vw) 120px; outline: 0; font-family: var(--font-reading); font-size: clamp(19px, 4.8vw, 25px); line-height: 1.8; white-space: pre-wrap; }.page:empty::before { content: attr(data-placeholder); color: var(--muted-foreground); pointer-events: none; }.copied { position: fixed; top: 58px; left: 50%; z-index: 4; transform: translateX(-50%); padding: 6px 10px; border-radius: var(--radius-full); background: var(--primary); color: var(--primary-foreground); font-size: 12px; }
</style>
