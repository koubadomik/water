<template>
  <main class="editor-shell">
    <header class="editor-tools">
      <button class="tool-button menu" :aria-expanded="toolsOpen" @click="toolsOpen = !toolsOpen">Tools</button>
      <div v-if="toolsOpen" class="tools-menu">
      <select v-model="skin" class="tool-select" @change="applyAppearance(skin)">
        <option v-for="item in skins" :key="item.id" :value="item.id">{{ item.name }}</option>
      </select>
      <select v-model="font" class="tool-select" @change="applyFont(font)">
        <option v-for="item in fonts" :key="item.id" :value="item.id">{{ item.name }}</option>
      </select>
      <select v-model="textSize" class="tool-select" @change="savePrefs"><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select>
      <select v-model="pageWidth" class="tool-select" @change="savePrefs"><option value="narrow">Narrow</option><option value="reading">Reading</option><option value="wide">Wide</option></select>
      <button class="tool-button" @mousedown.prevent="command('undo')">Undo</button>
      <button class="tool-button" @mousedown.prevent="command('redo')">Redo</button>
      <button class="tool-button" @click="copy">Copy</button>
      <button class="tool-button danger" @click="clear">Clear</button>
      </div>
    </header>
    <div v-if="selectionOpen" class="selection-tools" :style="selectionStyle">
      <button class="format-button bold" @mousedown.prevent="command('bold')">B</button>
      <button class="format-button italic" @mousedown.prevent="command('italic')">I</button>
      <button class="format-button underline" @mousedown.prevent="command('underline')">U</button>
      <button class="format-button quote" title="Quote" @mousedown.prevent="command('formatBlock', 'blockquote')">❝</button>
      <button class="format-button plain" title="Clear formatting" @mousedown.prevent="clearFormatting">T×</button>
      <button v-for="color in colors" :key="color" class="color-button" :style="{ background: color }" @mousedown.prevent="command('foreColor', color)" />
      <input v-model="customColor" class="color-picker" type="color" @input="command('foreColor', customColor)" />
    </div>
    <p v-if="copied" class="copied">Copied</p>
    <button v-if="verseSuggestion" class="verse-suggestion" :style="verseSuggestionStyle" @mousedown.prevent="insertVerse">Insert {{ verseSuggestion.ref }}: {{ verseSuggestion.text }}</button>
    <article ref="editor" class="page" :class="[`size-${textSize}`, `width-${pageWidth}`]" contenteditable="true" spellcheck="true" :data-placeholder="placeholder" @input="onInput" @paste="pasteClean" @mouseup="checkSelection" @keyup="checkSelection" @pointerdown="startHistorySwipe" @pointerup="finishHistorySwipe" @pointercancel="historySwipe = null" />
  </main>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue'
import { useAppearance } from './composables/useAppearance.js'
import { useBible } from './composables/useBible.js'
import { resolveReference } from './lib/reference.js'

const props = defineProps({
  storageKey: { type: String, default: 'zenEditorHtml' },
  placeholder: { type: String, default: 'Start writing…' },
})
const emit = defineEmits(['saved'])
const editor = ref(null)
const { applyAppearance, applyFont, fonts, selectedFont: font, selectedSkin: skin, skins } = useAppearance()
const copied = ref(false)
const colors = ['#b64c4c', '#c08a28', '#4c8a69', '#477cac']
const customColor = ref('#72558c')
const toolsOpen = ref(false)
const selectionOpen = ref(false)
const selectionStyle = ref({})
const verseSuggestionStyle = ref({})
const prefs = JSON.parse(localStorage.getItem('zenEditorPrefs') || '{}')
const textSize = ref(prefs.textSize || 'medium')
const pageWidth = ref(prefs.pageWidth || 'reading')
const verseSuggestion = ref(null)
const referenceRange = ref(null)
const historySwipe = ref(null)
const { bible } = useBible()

onMounted(async () => { editor.value.innerHTML = localStorage.getItem(props.storageKey) || ''; await nextTick(); editor.value.focus() })
function save() {
  const html = editor.value.innerHTML
  localStorage.setItem(props.storageKey, html)
  emit('saved', html)
}
function onInput() { save(); findVerseSuggestion() }
function savePrefs() { localStorage.setItem('zenEditorPrefs', JSON.stringify({ textSize: textSize.value, pageWidth: pageWidth.value })) }
function command(name, value) { editor.value.focus(); document.execCommand(name, false, value); save() }
function clearFormatting() {
  editor.value.focus()
  document.execCommand('removeFormat', false)
  document.execCommand('formatBlock', false, 'p')
  save()
}
function pasteClean(event) {
  const clipboard = event.clipboardData
  if (!clipboard) return
  event.preventDefault()
  const html = clipboard.getData('text/html')
  const fragment = document.createDocumentFragment()
  if (html) {
    const source = document.createElement('div')
    source.innerHTML = html
    for (const child of source.childNodes) fragment.append(cleanNode(child))
  } else {
    const text = clipboard.getData('text/plain')
    for (const line of text.split(/\r?\n/)) {
      if (fragment.childNodes.length) fragment.append(document.createElement('br'))
      fragment.append(document.createTextNode(line))
    }
  }
  const selection = window.getSelection()
  if (!selection?.rangeCount) return
  const range = selection.getRangeAt(0)
  const last = fragment.lastChild
  range.deleteContents()
  range.insertNode(fragment)
  if (last) {
    range.setStartAfter(last)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)
  }
  save()
}
function cleanNode(node) {
  if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent)
  if (node.nodeType !== Node.ELEMENT_NODE) return document.createDocumentFragment()
  const content = document.createDocumentFragment()
  for (const child of node.childNodes) content.append(cleanNode(child))
  const tag = node.tagName.toLowerCase()
  if (tag === 'br') return document.createElement('br')
  let result = content
  const wrap = (name) => {
    const element = document.createElement(name)
    element.append(result)
    result = element
  }
  if (tag === 'strong' || tag === 'b' || Number(node.style.fontWeight) >= 600 || node.style.fontWeight === 'bold') wrap('strong')
  if (tag === 'em' || tag === 'i' || node.style.fontStyle === 'italic') wrap('em')
  if (tag === 'u' || node.style.textDecoration.includes('underline')) wrap('u')
  if (tag === 'blockquote') wrap('blockquote')
  if (tag === 'p' || tag === 'div') wrap('div')
  return result
}
function startHistorySwipe(event) {
  if (event.pointerType !== 'touch') return
  historySwipe.value = { x: event.clientX, y: event.clientY }
}
function finishHistorySwipe(event) {
  const start = historySwipe.value
  historySwipe.value = null
  if (!start || event.pointerType !== 'touch') return
  const dx = event.clientX - start.x
  const dy = event.clientY - start.y
  if (Math.abs(dx) < 72 || Math.abs(dx) < Math.abs(dy) * 1.5) return
  command(dx < 0 ? 'undo' : 'redo')
}
function checkSelection() {
  const selection = window.getSelection()
  selectionOpen.value = Boolean(selection?.toString().trim())
  if (!selectionOpen.value || !selection.rangeCount) return
  const viewport = window.visualViewport
  const top = (viewport?.offsetTop || 0) + (viewport?.height || window.innerHeight) - 58
  selectionStyle.value = { left: '50%', top: `${top}px`, transform: 'translateX(-50%)' }
}
function findVerseSuggestion() {
  verseSuggestion.value = null
  const selection = window.getSelection()
  const node = selection?.anchorNode
  if (!node || node.nodeType !== Node.TEXT_NODE || !bible.value) return
  const before = node.textContent.slice(0, selection.anchorOffset)
  const match = before.match(/([\p{L}\d\s.]+\s+\d+(?::\d+(?:[-–—]\d+)?)?)$/u)
  if (!match) return
  const typedRef = match[1].trim()
  const parsed = resolveReference(bible.value, typedRef)
  if (!parsed.ok) return
  verseSuggestion.value = {
    ref: typedRef,
    text: parsed.verses.map((verse) => verse.text).join(' '),
  }
  referenceRange.value = { node, start: selection.anchorOffset - match[1].length, end: selection.anchorOffset }
  const rect = selection.getRangeAt(0).getBoundingClientRect()
  const width = Math.min(360, window.innerWidth - 24)
  const left = Math.min(window.innerWidth - width - 12, Math.max(12, rect.left))
  const top = rect.bottom + 10 < window.innerHeight - 100 ? rect.bottom + 10 : Math.max(10, rect.top - 78)
  verseSuggestionStyle.value = { left: `${left}px`, top: `${top}px`, width: `${width}px` }
}
function insertVerse() {
  const target = referenceRange.value
  const suggestion = verseSuggestion.value
  if (!target || !suggestion || !target.node.isConnected) return
  const range = document.createRange()
  range.setStart(target.node, target.start)
  range.setEnd(target.node, target.end)
  const selection = window.getSelection()
  selection.removeAllRanges()
  selection.addRange(range)
  document.execCommand('insertText', false, `${suggestion.ref}: ${suggestion.text}`)
  verseSuggestion.value = null
  referenceRange.value = null
  save()
}
function markdown(node) {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent
  const content = [...node.childNodes].map(markdown).join('')
  const tag = node.nodeName.toLowerCase()
  if (tag === 'strong' || tag === 'b') return `**${content}**`
  if (tag === 'h1') return `\n# ${content}\n\n`
  if (tag === 'h2') return `\n## ${content}\n\n`
  if (tag === 'h3') return `\n### ${content}\n\n`
  if (tag === 'blockquote') return `\n> ${content.trim()}\n\n`
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
.editor-shell { position:relative; min-height:100dvh; background:var(--background); color:var(--foreground); }.editor-tools { position:fixed; z-index:8; top:max(8px,env(safe-area-inset-top)); left:50%; transform:translateX(-50%); }.tools-menu { position:absolute; top:calc(100% + 8px); left:50%; display:flex; flex-wrap:wrap; justify-content:center; gap:8px; width:min(360px,calc(100vw - 24px)); padding:10px; transform:translateX(-50%); border:1px solid var(--border); border-radius:var(--radius-lg); background:color-mix(in srgb,var(--card) 94%,transparent); box-shadow:var(--shadow-lg); backdrop-filter:blur(16px); }.tool-select,.tool-button,.format-button { min-height:32px; border:1px solid var(--border); border-radius:var(--radius-sm); background:var(--card); color:var(--foreground); font:inherit; font-size:12px; cursor:pointer; }.tool-select { max-width:104px; padding:0 6px; }.tool-button,.format-button { padding:0 9px; }.menu { border-radius:var(--radius-full); font-weight:700; }.bold { font-family:Georgia,serif; font-size:17px; font-weight:800; }.italic { font-family:Georgia,serif; font-size:16px; font-style:italic; }.underline { text-decoration:underline; }.quote { font-family:Georgia,serif; font-size:19px; line-height:1; }.selection-tools { position:fixed; z-index:6; display:flex; align-items:center; gap:8px; padding:8px 10px; border:1px solid var(--border); border-radius:var(--radius-full); background:var(--card); box-shadow:var(--shadow-lg); }.color-button,.color-picker { width:22px; height:22px; padding:0; border:2px solid var(--card); border-radius:50%; box-shadow:0 0 0 1px var(--border); cursor:pointer; }.verse-suggestion { position:fixed; z-index:7; box-sizing:border-box; max-width:calc(100vw - 24px); max-height:76px; overflow:hidden; border:1px solid var(--border); border-radius:var(--radius-lg); background:var(--card); color:var(--foreground); box-shadow:var(--shadow-lg); padding:10px 12px; font-family:var(--font-reading); font-size:13px; text-align:left; text-overflow:ellipsis; white-space:nowrap; }.danger { color:var(--destructive); }.page { min-height:100dvh; margin:0 auto; padding:54px max(24px,7vw) 120px; outline:0; font-family:var(--font-reading); line-height:1.8; touch-action:pan-y; white-space:pre-wrap; }.page :deep(blockquote) { margin:1.2em 0; padding:.25em 1em; border-left:3px solid var(--primary); color:var(--muted-foreground); font-style:italic; }.width-narrow { max-width:560px; }.width-reading { max-width:760px; }.width-wide { max-width:1100px; }.size-small { font-size:clamp(17px,4.2vw,21px); }.size-medium { font-size:clamp(19px,4.8vw,25px); }.size-large { font-size:clamp(22px,5.5vw,30px); }.page:empty::before { content:attr(data-placeholder); color:var(--muted-foreground); pointer-events:none; }.copied { position:fixed; top:58px; left:50%; z-index:4; transform:translateX(-50%); padding:6px 10px; border-radius:var(--radius-full); background:var(--primary); color:var(--primary-foreground); font-size:12px; }
</style>
