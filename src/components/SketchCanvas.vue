<template>
  <section class="sketch-editor">
    <header>
      <button @click="$emit('close')">Done</button>
      <span>Sketch</span>
      <button class="danger" @click="erase">Clear</button>
    </header>
    <svg ref="canvas" class="canvas" viewBox="0 0 1000 1400" preserveAspectRatio="none" @pointerdown="start" @pointermove="move" @pointerup="finish" @pointercancel="finish">
      <path v-for="(stroke, index) in sketch.strokes" :key="index" :d="path(stroke.points)" :fill="stroke.color" />
      <path v-if="current.length" :d="path(current)" :fill="color" />
    </svg>
    <footer>
      <button v-for="ink in inks" :key="ink" class="ink" :class="{ selected: color === ink }" :style="{ background: ink }" @click="color = ink" />
      <input v-model="color" type="color" aria-label="Ink colour">
      <button :disabled="!sketch.strokes.length" @click="undo">Undo</button>
      <button class="danger" @click="$emit('remove')">Delete sketch</button>
    </footer>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { getStroke } from 'perfect-freehand'

const props = defineProps({ sketch: { type: Object, required: true } })
defineEmits(['close', 'remove'])
const canvas = ref(null)
const current = ref([])
const drawing = ref(false)
const color = ref('#477cac')
const inks = ['#242424', '#b64c4c', '#c08a28', '#4c8a69', '#477cac', '#72558c']

function point(event) {
  const rect = canvas.value.getBoundingClientRect()
  return [((event.clientX - rect.left) / rect.width) * 1000, ((event.clientY - rect.top) / rect.height) * 1400, event.pressure || 0.5]
}
function start(event) {
  drawing.value = true
  event.currentTarget.setPointerCapture(event.pointerId)
  current.value = [point(event)]
}
function move(event) { if (drawing.value) current.value.push(point(event)) }
function finish() {
  if (!drawing.value) return
  if (current.value.length) props.sketch.strokes.push({ color: color.value, points: current.value })
  current.value = []
  drawing.value = false
}
function undo() { props.sketch.strokes.pop() }
function erase() { if (confirm('Clear this sketch?')) props.sketch.strokes.splice(0) }
function path(points) {
  if (!points.length) return ''
  const outline = getStroke(points, { size: 7, thinning: 0.55, smoothing: 0.55, streamline: 0.45 })
  return outline.length ? `M${outline.map((p) => p.join(',')).join('L')}Z` : ''
}
</script>

<style scoped>
.sketch-editor { position:fixed; z-index:30; inset:0; display:flex; flex-direction:column; background:var(--background); color:var(--foreground); }.sketch-editor header,.sketch-editor footer { display:flex; align-items:center; gap:10px; padding:calc(env(safe-area-inset-top) + 10px) 16px 10px; border-bottom:1px solid var(--border); }.sketch-editor header span { flex:1; text-align:center; font-family:var(--font-reading); }.sketch-editor footer { justify-content:center; padding:10px 16px calc(env(safe-area-inset-bottom) + 10px); border-top:1px solid var(--border); border-bottom:0; }.sketch-editor button { min-height:34px; border:1px solid var(--border); border-radius:var(--radius-sm); background:var(--card); color:var(--foreground); padding:0 10px; font:inherit; font-size:12px; }.sketch-editor .danger { color:var(--destructive); }.canvas { flex:1; width:100%; touch-action:none; background:color-mix(in srgb,var(--card) 35%,transparent); }.ink,.sketch-editor input { box-sizing:border-box; width:25px; height:25px; min-height:25px !important; padding:0 !important; border:2px solid var(--background) !important; border-radius:50% !important; box-shadow:0 0 0 1px var(--border); }.ink.selected { box-shadow:0 0 0 2px var(--primary); }.sketch-editor input { overflow:hidden; }
</style>
