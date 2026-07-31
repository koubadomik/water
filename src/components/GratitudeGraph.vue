<template>
  <div ref="host" class="graph-scene" @pointermove="move" @pointerleave="reset" @pointerup="reset">
    <svg viewBox="0 0 1000 620" role="img" aria-label="Interactive gratitude memory graph">
      <defs><radialGradient id="nodeGlow"><stop stop-color="#fff8d5"/><stop offset=".35" stop-color="#d6d9ff"/><stop offset="1" stop-color="#706bb2"/></radialGradient></defs>
      <line v-for="(node, index) in nodes.slice(1)" :key="`line-${index}`" :x1="point(index).x" :y1="point(index).y" :x2="point(index + 1).x" :y2="point(index + 1).y" />
      <g v-for="(node, index) in nodes" :key="node" class="memory-node" :transform="`translate(${point(index).x} ${point(index).y})`" @click="$emit('open', node)">
        <circle class="halo" r="36"/>
        <circle class="core" :r="12 + index % 4 * 2"/>
        <text y="47">{{ shortDate(node) }}</text>
      </g>
    </svg>
    <p>Move through your memories</p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({ entries: { type: Array, required: true } })
defineEmits(['open'])
const host = ref(null)
const pointer = ref(null)
const nodes = computed(() => props.entries)

function base(index) {
  const date = nodes.value[index] || String(index)
  return { x: 82 + seeded(date, 17) * 836, y: 76 + seeded(date, 71) * 452 }
}
function seeded(text, salt) {
  let hash = salt
  for (const char of text) hash = Math.imul(31, hash) + char.charCodeAt(0) | 0
  return (Math.sin(hash) * 10000) % 1 + ((Math.sin(hash) * 10000) < 0 ? 1 : 0)
}
function point(index) {
  const origin = base(index)
  if (!pointer.value) return origin
  const dx = origin.x - pointer.value.x
  const dy = origin.y - pointer.value.y
  const distance = Math.max(1, Math.hypot(dx, dy))
  const push = Math.max(0, 92 - distance) / 92 * 34
  return { x: origin.x + dx / distance * push, y: origin.y + dy / distance * push }
}
function move(event) {
  const rect = host.value.getBoundingClientRect()
  pointer.value = { x: (event.clientX - rect.left) / rect.width * 1000, y: (event.clientY - rect.top) / rect.height * 620 }
}
function reset() { pointer.value = null }
function shortDate(date) { return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(new Date(`${date}T12:00:00`)) }
</script>

<style scoped>.graph-scene { max-width:720px; margin:0 auto; background:transparent; overflow:visible; touch-action:none; }.graph-scene svg { display:block; width:100%; height:auto; }.graph-scene line { stroke:rgb(213 228 255 / .48); stroke-width:2; transition:all .24s ease-out; }.memory-node { cursor:pointer; transition:transform .24s ease-out; }.memory-node .halo { fill:rgb(199 218 255 / .16); transition:r .2s ease; }.memory-node .core { fill:url(#nodeGlow); filter:drop-shadow(0 0 8px rgb(211 229 255 / .85)); }.memory-node:hover .halo { r:48; }.memory-node text { fill:#fbf7e9; font:12px var(--font-reading); text-anchor:middle; pointer-events:none; paint-order:stroke; stroke:rgb(5 11 31 / .7); stroke-width:3px; stroke-linejoin:round; }.graph-scene p { margin:0; padding:0 0 18px; color:#d9e8ff; font:italic 14px var(--font-reading); text-align:center; text-shadow:0 1px 5px rgb(5 11 31 / .9); }</style>
