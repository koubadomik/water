<template>
  <main ref="shell" class="editor-shell" :class="{ 'drawing-active': drawMode }">
    <header class="editor-tools">
      <button class="tool-button menu" :aria-expanded="toolsOpen" @click="toolsOpen = !toolsOpen">Tools</button>
      <div v-if="toolsOpen" class="tools-menu">
        <div class="tool-quick-actions">
          <button class="tool-button" :class="{ active: drawMode }" @click="toggleDrawMode">{{ drawMode ? 'Writing mode' : 'Draw' }}</button>
          <button class="tool-button" @click="copy">Copy</button>
          <button class="tool-button danger" @click="clear">Clear</button>
        </div>
        <div class="tool-sections">
          <button :class="{ active: settingsPanel === 'writing' }" @click="settingsPanel = settingsPanel === 'writing' ? null : 'writing'">Writing</button>
          <button :class="{ active: settingsPanel === 'keyboard' }" @click="settingsPanel = settingsPanel === 'keyboard' ? null : 'keyboard'">Keyboard</button>
          <button :class="{ active: settingsPanel === 'theme' }" @click="settingsPanel = settingsPanel === 'theme' ? null : 'theme'">Theme</button>
        </div>
        <section v-if="settingsPanel === 'writing'" class="tool-settings">
          <label>Text size<select v-model="textSize" @change="savePrefs"><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></label>
          <label>Page width<select v-model="pageWidth" @change="savePrefs"><option value="narrow">Narrow</option><option value="reading">Reading</option><option value="wide">Wide</option></select></label>
        </section>
        <section v-if="settingsPanel === 'keyboard'" class="tool-settings">
          <label>Key sound<select v-model="typingSound" @change="savePrefs"><option value="off">Silent</option><option value="classic">Typewriter · Classic</option><option value="electric">Typewriter · Electric</option><option value="mechanical">Keyboard · Mechanical</option><option value="soft">Keyboard · Soft</option><option value="pencil">Pencil · Paper</option><option value="retro">Retro computer · 8-bit</option></select></label>
          <label>Volume {{ Math.round(typingVolume * 100) }}%<input v-model.number="typingVolume" type="range" min="0" max="2.5" step=".05" @change="savePrefs" /></label>
        </section>
        <section v-if="settingsPanel === 'theme'" class="tool-settings">
          <label>Skin<select v-model="skin" @change="applyAppearance(skin)"><option v-for="item in skins" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
          <label>Font<select v-model="font" @change="applyFont(font)"><option v-for="item in fonts" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
        </section>
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
    <div v-if="emojiSuggestion" ref="emojiMenu" class="emoji-suggestion" :style="emojiSuggestionStyle">
      <button v-for="(item, index) in emojiSuggestion" :key="item.name" :class="{ selected: index === emojiIndex }" @mousedown.prevent="insertEmoji(item)"><span>{{ item.emoji }}</span><small>:{{ item.name }}:</small></button>
    </div>
    <button v-if="verseSuggestion" class="verse-suggestion" :style="verseSuggestionStyle" @mousedown.prevent="insertVerse">Insert {{ verseSuggestion.ref }}: {{ verseSuggestion.text }}</button>
    <article ref="editor" class="page" :class="[`size-${textSize}`, `width-${pageWidth}`]" :contenteditable="!drawMode" spellcheck="true" :data-placeholder="placeholder" @input="onInput" @keydown="handleEmojiKeys" @paste="pasteClean" @mouseup="checkSelection" @keyup="checkSelection" @pointerdown="startHistorySwipe" @pointerup="finishHistorySwipe" @pointercancel="historySwipe = null" />
    <canvas ref="sketchLayer" class="sketch-layer" :class="{ interactive: drawMode }" @pointerdown="beginStroke($event); startInkHistorySwipe($event)" @pointermove="continueStroke" @pointerup="endStroke($event); finishInkHistorySwipe($event)" @pointercancel="endStroke" @lostpointercapture="endStroke" @touchstart.prevent @touchmove.prevent @selectstart.prevent @dragstart.prevent @contextmenu.prevent />
    <aside v-if="drawMode" class="ink-dock" aria-label="Drawing controls">
      <div class="ink-colors"><button v-for="color in inkColors" :key="color" class="ink-color" :class="{ selected: inkColor === color }" :style="{ '--ink-color': color }" :aria-label="`Use ${color} ink`" @click="inkColor = color" /><label class="custom-ink" title="Custom ink color"><input v-model="inkColor" type="color" aria-label="Custom ink color" /></label></div>
      <div class="ink-types"><button v-for="item in inkStyles" :key="item.id" :class="{ selected: inkStyle === item.id }" @click="inkStyle = item.id"><span>{{ item.icon }}</span>{{ item.name }}</button></div>
      <label class="ink-size"><span>Fine</span><input v-model.number="penSize" type="range" min="2" max="18" step="1" aria-label="Stroke size" /><span>Bold</span></label>
    </aside>
  </main>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getStroke } from 'perfect-freehand'
import { useAppearance } from './composables/useAppearance.js'
import { useBible } from './composables/useBible.js'
import { resolveReference } from './lib/reference.js'
import { githubEmoji } from './lib/githubEmoji.js'

const props = defineProps({
  storageKey: { type: String, default: 'zenEditorHtml' },
  placeholder: { type: String, default: 'Start writing…' },
  appearanceNamespace: { type: String, default: 'main' },
  preferencesKey: { type: String, default: 'zenEditorPrefs' },
})
const emit = defineEmits(['saved'])
const editor = ref(null)
const shell = ref(null)
const sketchLayer = ref(null)
const { applyAppearance, applyFont, fonts, selectedFont: font, selectedSkin: skin, skins } = useAppearance(props.appearanceNamespace)
const copied = ref(false)
const colors = ['#b64c4c', '#c08a28', '#4c8a69', '#477cac']
const customColor = ref('#72558c')
const toolsOpen = ref(false)
const settingsPanel = ref(null)
const selectionOpen = ref(false)
const selectionStyle = ref({})
const verseSuggestionStyle = ref({})
const prefs = JSON.parse(localStorage.getItem(props.preferencesKey) || '{}')
const textSize = ref(prefs.textSize || 'medium')
const pageWidth = ref(prefs.pageWidth || 'reading')
const typingSound = ref(prefs.typingSound || 'off')
const storedTypingVolume = Number(prefs.typingVolume)
const typingVolume = ref(Number.isFinite(storedTypingVolume) && prefs.typingVolume !== undefined ? (prefs.typingVolumeScale === 'full' ? storedTypingVolume : storedTypingVolume <= .2 ? storedTypingVolume * 12.5 : storedTypingVolume) : 1.4)
const drawMode = ref(false)
const inkColor = ref('#364f82')
const penSize = ref(5)
const inkStyle = ref('pen')
const inkColors = ['#1e2634', '#364f82', '#a23e48', '#417b5a', '#c28b27', '#7653a6']
const inkStyles = [{ id: 'pen', name: 'Pen', icon: '✒' }, { id: 'highlighter', name: 'Glow', icon: '━' }]
const strokes = ref(readStrokes())
const undoneStrokes = ref([])
const activeStroke = ref(null)
const sketchSize = ref({ width: 1, height: 1 })
const verseSuggestion = ref(null)
const referenceRange = ref(null)
const emojiSuggestion = ref(null)
const emojiSuggestionStyle = ref({})
const emojiRange = ref(null)
const emojiIndex = ref(0)
const emojiMenu = ref(null)
const historySwipe = ref(null)
const { bible } = useBible()
const typewriterUrls = ['typewriter1.wav', 'typewriter2.wav', 'typewriter3.wav', 'typewriter4.wav'].map((name) => `${import.meta.env.BASE_URL}sounds/${name}`)
const soundUrls = [...typewriterUrls, `${import.meta.env.BASE_URL}sounds/pencil-write.ogg`, `${import.meta.env.BASE_URL}sounds/retro-key.wav`]
let typingContext
let typingBuffers = { typewriter: [], pencil: null, retro: null }
let lastKeySound = 0
let sketchObserver
let drawingPointerId = null

onMounted(async () => {
  editor.value.innerHTML = localStorage.getItem(props.storageKey) || ''
  await nextTick()
  editor.value.focus()
  preloadTypingSounds()
  updateSketchSize()
  window.addEventListener('resize', updateSketchSize)
  if (typeof ResizeObserver !== 'undefined') {
    sketchObserver = new ResizeObserver(updateSketchSize)
    sketchObserver.observe(shell.value)
  }
})
onBeforeUnmount(() => { window.removeEventListener('resize', updateSketchSize); sketchObserver?.disconnect() })
watch([strokes, activeStroke], () => nextTick(renderInk), { deep: true })
watch(emojiIndex, async () => {
  await nextTick()
  emojiMenu.value?.querySelector('.selected')?.scrollIntoView({ block: 'nearest' })
})
function save() {
  const html = editor.value.innerHTML
  localStorage.setItem(props.storageKey, html)
  emit('saved', html)
}
function onInput(event) { save(); findVerseSuggestion(); findEmojiSuggestion(); playTypingSound(event) }
function savePrefs() { localStorage.setItem(props.preferencesKey, JSON.stringify({ textSize: textSize.value, pageWidth: pageWidth.value, typingSound: typingSound.value, typingVolume: typingVolume.value, typingVolumeScale: 'full' })) }
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
  command(dx < 0 ? 'redo' : 'undo')
}
function startInkHistorySwipe(event) {
  if (event.pointerType !== 'touch') return
  historySwipe.value = { x: event.clientX, y: event.clientY }
}
function finishInkHistorySwipe(event) {
  const start = historySwipe.value
  historySwipe.value = null
  if (!start || event.pointerType !== 'touch') return
  const dx = event.clientX - start.x
  const dy = event.clientY - start.y
  if (Math.abs(dx) < 72 || Math.abs(dx) < Math.abs(dy) * 1.5) return
  if (dx < 0) redoStroke()
  else undoStroke()
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
function findEmojiSuggestion() {
  emojiSuggestion.value = null
  const selection = window.getSelection()
  const node = selection?.anchorNode
  if (!node || node.nodeType !== Node.TEXT_NODE || !selection.rangeCount) return
  const before = node.textContent.slice(0, selection.anchorOffset)
  const match = before.match(/(?:^|\s):([a-z0-9_+\-]*)$/i)
  if (!match) return
  const query = match[1].toLowerCase()
  const options = githubEmoji.filter((item) => item.name.includes(query)).slice(0, 7)
  if (!options.length) return
  const typed = match[0].startsWith(' ') ? match[0].slice(1) : match[0]
  emojiRange.value = { node, start: selection.anchorOffset - typed.length, end: selection.anchorOffset }
  emojiSuggestion.value = options
  emojiIndex.value = 0
  const rect = selection.getRangeAt(0).getBoundingClientRect()
  const width = Math.min(320, window.innerWidth - 24)
  const left = Math.min(window.innerWidth - width - 12, Math.max(12, rect.left))
  const top = rect.bottom + 10 < window.innerHeight - 130 ? rect.bottom + 10 : Math.max(10, rect.top - 120)
  emojiSuggestionStyle.value = { left: `${left}px`, top: `${top}px`, width: `${width}px` }
}
function handleEmojiKeys(event) {
  if (verseSuggestion.value && (event.key === 'Tab' || event.key === 'Enter')) {
    event.preventDefault()
    insertVerse()
    return true
  }
  if (!emojiSuggestion.value?.length) return false
  if (event.key === 'Escape') {
    event.preventDefault()
    emojiSuggestion.value = null
    return true
  }
  if (event.key === 'ArrowDown' || (event.key === 'Tab' && !event.shiftKey)) {
    event.preventDefault()
    emojiIndex.value = (emojiIndex.value + 1) % emojiSuggestion.value.length
    return true
  }
  if (event.key === 'ArrowUp' || (event.key === 'Tab' && event.shiftKey)) {
    event.preventDefault()
    emojiIndex.value = (emojiIndex.value - 1 + emojiSuggestion.value.length) % emojiSuggestion.value.length
    return true
  }
  if (event.key === 'Enter') {
    event.preventDefault()
    insertEmoji(emojiSuggestion.value[emojiIndex.value])
    return true
  }
  return false
}
function insertEmoji(item) {
  const target = emojiRange.value
  if (!target || !target.node.isConnected) return
  const range = document.createRange()
  range.setStart(target.node, target.start)
  range.setEnd(target.node, target.end)
  const selection = window.getSelection()
  selection.removeAllRanges()
  selection.addRange(range)
  document.execCommand('insertText', false, item.emoji)
  emojiSuggestion.value = null
  emojiRange.value = null
  save()
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
function readStrokes() {
  try {
    const saved = JSON.parse(localStorage.getItem(`${props.storageKey}Sketches`) || '[]')
    return Array.isArray(saved) ? saved : []
  } catch { return [] }
}
function saveStrokes() { localStorage.setItem(`${props.storageKey}Sketches`, JSON.stringify(strokes.value)) }
function updateSketchSize() {
  if (!shell.value) return
  sketchSize.value = { width: Math.max(1, shell.value.scrollWidth, window.innerWidth), height: Math.max(window.innerHeight, shell.value.scrollHeight) }
  nextTick(renderInk)
}
function renderInk() {
  const canvas = sketchLayer.value
  if (!canvas) return
  const scale = window.devicePixelRatio || 1
  const width = Math.ceil(sketchSize.value.width)
  const height = Math.ceil(sketchSize.value.height)
  if (canvas.width !== width * scale || canvas.height !== height * scale) {
    canvas.width = width * scale
    canvas.height = height * scale
  }
  const context = canvas.getContext('2d')
  context.setTransform(scale, 0, 0, scale, 0, 0)
  context.clearRect(0, 0, width, height)
  ;[...strokes.value, activeStroke.value].filter(Boolean).forEach((stroke) => {
    const style = stroke.style || 'pen'
    const options = style === 'pencil'
      ? { size: stroke.size, thinning: .35, smoothing: .35, streamline: .42 }
      : style === 'marker'
        ? { size: stroke.size * 1.45, thinning: .12, smoothing: .65, streamline: .45 }
        : style === 'highlighter'
          ? { size: stroke.size * 2.15, thinning: 0, smoothing: .7, streamline: .45 }
          : { size: stroke.size, thinning: .58, smoothing: .55, streamline: .52, simulatePressure: !stroke.pen }
    const outline = getStroke(stroke.points, { ...options, last: true })
    if (!outline.length) return
    context.beginPath()
    outline.forEach(([x, y], index) => index ? context.lineTo(x, y) : context.moveTo(x, y))
    context.closePath()
    context.globalAlpha = style === 'pencil' ? .72 : style === 'highlighter' ? .27 : style === 'marker' ? .82 : 1
    context.fillStyle = stroke.color
    context.fill()
    context.globalAlpha = 1
  })
}
function pointFromEvent(event) {
  const rect = sketchLayer.value.getBoundingClientRect()
  return [event.clientX - rect.left, event.clientY - rect.top, event.pressure || .5]
}
function canDraw(event) { return event.pointerType === 'pen' || event.pointerType === 'mouse' }
function toggleDrawMode() {
  drawMode.value = !drawMode.value
  selectionOpen.value = false
  if (drawMode.value) editor.value?.blur()
}
function beginStroke(event) {
  if (!drawMode.value || !canDraw(event) || drawingPointerId !== null) return
  event.preventDefault()
  drawingPointerId = event.pointerId
  sketchLayer.value.setPointerCapture?.(event.pointerId)
  activeStroke.value = { id: `${Date.now()}-${Math.random()}`, points: [pointFromEvent(event)], color: inkColor.value, size: penSize.value, pen: event.pointerType === 'pen', style: inkStyle.value }
  renderInk()
}
function continueStroke(event) {
  if (!activeStroke.value || event.pointerId !== drawingPointerId) return
  event.preventDefault()
  const events = event.getCoalescedEvents?.() || [event]
  activeStroke.value.points.push(...events.map(pointFromEvent))
  renderInk()
}
function endStroke(event) {
  if (!activeStroke.value || (event?.pointerId !== undefined && event.pointerId !== drawingPointerId)) return
  if (event && event.type !== 'lostpointercapture') activeStroke.value.points.push(pointFromEvent(event))
  if (event?.pointerId !== undefined) sketchLayer.value.releasePointerCapture?.(event.pointerId)
  strokes.value.push(activeStroke.value)
  undoneStrokes.value = []
  activeStroke.value = null
  drawingPointerId = null
  saveStrokes()
  renderInk()
}
function undoStroke() {
  const stroke = strokes.value.pop()
  if (!stroke) return
  undoneStrokes.value.push(stroke)
  saveStrokes()
  renderInk()
}
function redoStroke() {
  const stroke = undoneStrokes.value.pop()
  if (!stroke) return
  strokes.value.push(stroke)
  saveStrokes()
  renderInk()
}
function clearStrokes() { if (strokes.value.length && confirm('Clear all ink on this page?')) { strokes.value = []; undoneStrokes.value = []; saveStrokes(); renderInk() } }
async function preloadTypingSounds() {
  try {
    typingContext ||= new AudioContext()
    const buffers = await Promise.all(soundUrls.map(async (url) => typingContext.decodeAudioData(await (await fetch(url)).arrayBuffer())))
    typingBuffers = { typewriter: buffers.slice(0, 4), pencil: buffers[4], retro: buffers[5] }
  } catch { typingBuffers = { typewriter: [], pencil: null, retro: null } }
}
function playTypingSound(event) {
  if (typingSound.value === 'off' || event.inputType === 'insertFromPaste') return
  if (!event.inputType?.startsWith('insert') && !event.inputType?.startsWith('delete')) return
  if (performance.now() - lastKeySound < 28) return
  lastKeySound = performance.now()
  try {
    typingContext ||= new AudioContext()
    typingContext.resume()
    const group = typingSound.value === 'pencil' ? [typingBuffers.pencil] : typingSound.value === 'retro' ? [typingBuffers.retro] : typingBuffers.typewriter
    if (!group.filter(Boolean).length) return
    const now = typingContext.currentTime
    const preset = {
      classic: { volume: .34, rate: .96, tone: 4300 },
      electric: { volume: .26, rate: 1.12, tone: 7000 },
      mechanical: { volume: .30, rate: .9, tone: 3400 },
      soft: { volume: .14, rate: .78, tone: 1700 },
      pencil: { volume: .42, rate: 1.04, tone: 2600 },
      retro: { volume: .23, rate: 1.32, tone: 9000 },
    }[typingSound.value]
    if (!preset) return
    const source = typingContext.createBufferSource()
    const gain = typingContext.createGain()
    const compressor = typingContext.createDynamicsCompressor()
    const filter = typingContext.createBiquadFilter()
    source.buffer = group[Math.floor(Math.random() * group.length)]
    source.playbackRate.value = (event.inputType.startsWith('delete') ? preset.rate * .77 : preset.rate) * (.96 + Math.random() * .08)
    filter.type = 'lowpass'
    filter.frequency.value = preset.tone
    gain.gain.setValueAtTime(preset.volume * typingVolume.value * 28, now)
    gain.gain.exponentialRampToValueAtTime(.0001, now + .1)
    compressor.threshold.value = -22
    compressor.knee.value = 18
    compressor.ratio.value = 10
    compressor.attack.value = .003
    compressor.release.value = .08
    source.connect(filter).connect(gain).connect(compressor).connect(typingContext.destination)
    source.start(now, 0, .11)
  } catch { /* iPhone may keep audio silent until it receives a user interaction */ }
}
</script>

<style scoped>
.editor-shell { position:relative; min-height:100dvh; background:var(--background); color:var(--foreground); }.editor-tools { position:fixed; z-index:8; top:max(8px,env(safe-area-inset-top)); left:50%; transform:translateX(-50%); }.tools-menu { position:absolute; top:calc(100% + 8px); left:50%; display:flex; flex-wrap:wrap; justify-content:center; gap:8px; width:min(360px,calc(100vw - 24px)); padding:10px; transform:translateX(-50%); border:1px solid var(--border); border-radius:var(--radius-lg); background:color-mix(in srgb,var(--card) 94%,transparent); box-shadow:var(--shadow-lg); backdrop-filter:blur(16px); }.tool-select,.tool-button,.format-button { min-height:32px; border:1px solid var(--border); border-radius:var(--radius-sm); background:var(--card); color:var(--foreground); font:inherit; font-size:12px; cursor:pointer; }.tool-select { max-width:104px; padding:0 6px; }.sound-select { max-width:150px; }.sound-volume { display:grid; width:132px; gap:2px; color:var(--muted-foreground); font-size:11px; }.sound-volume input { width:100%; accent-color:var(--primary); }.tool-button,.format-button { padding:0 9px; }.menu { border-radius:var(--radius-full); font-weight:700; }.bold { font-family:Georgia,serif; font-size:17px; font-weight:800; }.italic { font-family:Georgia,serif; font-size:16px; font-style:italic; }.underline { text-decoration:underline; }.quote { font-family:Georgia,serif; font-size:19px; line-height:1; }.selection-tools { position:fixed; z-index:6; display:flex; align-items:center; gap:8px; padding:8px 10px; border:1px solid var(--border); border-radius:var(--radius-full); background:var(--card); box-shadow:var(--shadow-lg); }.color-button,.color-picker { width:22px; height:22px; padding:0; border:2px solid var(--card); border-radius:50%; box-shadow:0 0 0 1px var(--border); cursor:pointer; }.verse-suggestion { position:fixed; z-index:7; box-sizing:border-box; max-width:calc(100vw - 24px); max-height:76px; overflow:hidden; border:1px solid var(--border); border-radius:var(--radius-lg); background:var(--card); color:var(--foreground); box-shadow:var(--shadow-lg); padding:10px 12px; font-family:var(--font-reading); font-size:13px; text-align:left; text-overflow:ellipsis; white-space:nowrap; }.danger { color:var(--destructive); }.page { min-height:100dvh; margin:0 auto; padding:54px max(24px,7vw) 120px; outline:0; font-family:var(--font-reading); line-height:1.8; touch-action:pan-y; white-space:pre-wrap; }.page :deep(blockquote) { margin:1.2em 0; padding:.25em 1em; border-left:3px solid var(--primary); color:var(--muted-foreground); font-style:italic; }.width-narrow { max-width:560px; }.width-reading { max-width:760px; }.width-wide { max-width:1100px; }.size-small { font-size:clamp(17px,4.2vw,21px); }.size-medium { font-size:clamp(19px,4.8vw,25px); }.size-large { font-size:clamp(22px,5.5vw,30px); }.page:empty::before { content:attr(data-placeholder); color:var(--muted-foreground); pointer-events:none; }.copied { position:fixed; top:58px; left:50%; z-index:4; transform:translateX(-50%); padding:6px 10px; border-radius:var(--radius-full); background:var(--primary); color:var(--primary-foreground); font-size:12px; }
.emoji-suggestion { position:fixed; z-index:9; display:grid; grid-template-columns:1fr; gap:4px; max-height:196px; overflow:auto; padding:7px; border:1px solid var(--border); border-radius:14px; background:color-mix(in srgb,var(--card) 96%,transparent); box-shadow:var(--shadow-lg); backdrop-filter:blur(14px); }.emoji-suggestion button { display:flex; align-items:center; gap:6px; min-height:30px; overflow:hidden; border:0; border-radius:8px; background:transparent; color:var(--foreground); font:inherit; text-align:left; }.emoji-suggestion button.selected,.emoji-suggestion button:active { background:color-mix(in srgb,var(--primary) 15%,transparent); }.emoji-suggestion span { font-size:18px; }.emoji-suggestion small { overflow:hidden; color:var(--muted-foreground); font:11px var(--font-mono); text-overflow:ellipsis; white-space:nowrap; }
.draw-control { display:flex; align-items:center; gap:5px; min-height:32px; color:var(--muted-foreground); font-size:11px; }.draw-control input[type='color'] { width:27px; height:27px; padding:0; border:1px solid var(--border); border-radius:50%; background:transparent; }.draw-control input[type='range'] { width:74px; accent-color:var(--primary); }.sketch-layer { position:absolute; z-index:4; inset:0; width:100%; height:100%; pointer-events:none; -webkit-user-select:none; -webkit-touch-callout:none; }.sketch-layer.interactive { pointer-events:auto; cursor:crosshair; touch-action:none; }.drawing-active .page { user-select:none; -webkit-user-select:none; -webkit-touch-callout:none; }
.ink-dock { position:fixed; z-index:9; bottom:max(14px,env(safe-area-inset-bottom)); left:50%; display:grid; gap:8px; width:min(430px,calc(100vw - 24px)); padding:10px 12px; transform:translateX(-50%); border:1px solid var(--border); border-radius:22px; background:color-mix(in srgb,var(--card) 94%,transparent); box-shadow:var(--shadow-lg); backdrop-filter:blur(18px); }.ink-colors,.ink-types,.ink-size { display:flex; align-items:center; justify-content:center; gap:8px; }.ink-color { width:26px; height:26px; border:2px solid var(--card); border-radius:50%; background:var(--ink-color); box-shadow:0 0 0 1px var(--border); }.ink-color.selected { transform:scale(1.2); box-shadow:0 0 0 2px var(--primary); }.ink-types button { display:flex; align-items:center; gap:4px; min-height:31px; padding:0 7px; border:1px solid transparent; border-radius:9px; background:transparent; color:var(--muted-foreground); font:12px var(--font-reading); }.ink-types button span { font-size:15px; }.ink-types button.selected { border-color:var(--border); background:var(--background); color:var(--foreground); box-shadow:var(--shadow-sm); }.ink-size { color:var(--muted-foreground); font-size:10px; }.ink-size input { width:min(230px,55vw); accent-color:var(--primary); }
.tool-quick-actions,.tool-sections { display:flex; justify-content:center; gap:7px; width:100%; }.tool-sections { padding-top:7px; border-top:1px solid var(--border); }.tool-sections button { min-height:28px; padding:0 8px; border:0; border-radius:8px; background:transparent; color:var(--muted-foreground); font:12px var(--font-reading); }.tool-sections button.active { background:color-mix(in srgb,var(--primary) 14%,transparent); color:var(--foreground); }.tool-settings { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; width:100%; }.tool-settings label { display:grid; gap:4px; color:var(--muted-foreground); font-size:11px; }.tool-settings select,.tool-settings input { min-width:0; width:100%; min-height:30px; border:1px solid var(--border); border-radius:7px; background:var(--background); color:var(--foreground); font:inherit; }.tool-settings select { padding:0 5px; }.tool-settings input { accent-color:var(--primary); }.custom-ink { display:grid; width:26px; height:26px; overflow:hidden; border:1px dashed var(--border); border-radius:50%; background:conic-gradient(#e15454,#e4c84a,#4ba277,#4e78bd,#a559b1,#e15454); }.custom-ink input { width:36px; height:36px; margin:-5px; opacity:0; cursor:pointer; }
</style>
