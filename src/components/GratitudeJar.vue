<template><div ref="host" class="jar-scene" /></template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js'

const props = defineProps({ entries: { type: Array, required: true } })
const emit = defineEmits(['open'])
const host = ref(null)
let app
let scene
let shine
let tilt = { x: 0, y: 0 }
let bobbers = []
let movePointer
let leavePointer

function day(date) { return new Date(`${date}T12:00:00`).getDate() }
function position(index, width, height) { return { x: width * ((index * 37) % 66 + 17) / 100, y: height * ((index * 53) % 58 + 28) / 100 } }
function redraw() {
  if (!app || !host.value) return
  scene?.destroy({ children: true })
  bobbers = []
  const width = host.value.clientWidth
  const height = host.value.clientHeight
  scene = new Container()
  app.stage.addChild(scene)
  const left = width * .1
  const top = 25
  const jarWidth = width * .8
  const jarHeight = height - 44
  const glassBack = new Graphics().roundRect(left, top, jarWidth, jarHeight, 42).fill({ color: 0x86b8d6, alpha: .13 })
  const baseShadow = new Graphics().ellipse(width / 2, height - 21, jarWidth * .39, 13).fill({ color: 0x1c3041, alpha: .22 })
  const rimBack = new Graphics().roundRect(width * .23, 12, width * .54, 28, 9).fill({ color: 0xd6efff, alpha: .2 }).stroke({ width: 5, color: 0x99b7d2, alpha: .82 })
  scene.addChild(baseShadow, glassBack, rimBack)
  const palette = [0xf4d6a4, 0xd9e8bf, 0xe7c6dc, 0xc3daf1, 0xf0bd9f]
  ;[...props.entries].reverse().forEach((date, index) => {
    const depth = index % 3
    const note = new Container()
    const paper = new Graphics().roundRect(-28, -20, 56, 40, 4).fill({ color: palette[index % palette.length], alpha: .62 + depth * .14 }).stroke({ width: 1, color: 0xffffff, alpha: .55 })
    const fold = new Graphics().poly([15, -20, 28, -20, 28, -7]).fill({ color: 0xffffff, alpha: .3 })
    const label = new Text({ text: String(day(date)), style: new TextStyle({ fontFamily: 'Georgia', fontSize: 16, fill: 0x384250, fontWeight: '600' }) })
    label.anchor.set(.5)
    note.addChild(paper, fold, label)
    const point = position(index, width, height)
    note.position.set(point.x, point.y + depth * 12)
    note.rotation = ((index * 19) % 25 - 12) * Math.PI / 180
    note.scale.set(.74 + depth * .13)
    note.eventMode = 'static'
    note.cursor = 'pointer'
    note.on('pointertap', () => emit('open', date))
    note.on('pointerover', () => { note.scale.set(1.08) })
    note.on('pointerout', () => { note.scale.set(.74 + depth * .13) })
    scene.addChild(note)
    bobbers.push({ note, baseY: note.y, phase: index, amplitude: .6 + depth * .18 })
  })
  const innerShadow = new Graphics().ellipse(width / 2, height - 50, jarWidth * .35, 22).fill({ color: 0x233d52, alpha: .12 })
  const glassFront = new Graphics().roundRect(left, top, jarWidth, jarHeight, 42).stroke({ width: 5, color: 0xb9dcf0, alpha: .72 })
  shine = new Graphics().roundRect(left + 16, top + 31, jarWidth * .16, jarHeight * .64, 24).fill({ color: 0xffffff, alpha: .13 })
  const rimFront = new Graphics().roundRect(width * .23, 12, width * .54, 28, 9).stroke({ width: 2, color: 0xffffff, alpha: .55 })
  scene.addChild(innerShadow, glassFront, shine, rimFront)
}
onMounted(async () => {
  app = new Application()
  await app.init({ resizeTo: host.value, backgroundAlpha: 0, antialias: true, autoDensity: true, resolution: Math.min(devicePixelRatio, 2) })
  host.value.appendChild(app.canvas)
  redraw()
  movePointer = (event) => {
    const rect = host.value.getBoundingClientRect()
    tilt = { x: (event.clientX - rect.left - rect.width / 2) / rect.width * 7, y: (event.clientY - rect.top - rect.height / 2) / rect.height * 5 }
  }
  leavePointer = () => { tilt = { x: 0, y: 0 } }
  host.value.addEventListener('pointermove', movePointer)
  host.value.addEventListener('pointerleave', leavePointer)
  app.ticker.add(() => {
    if (!scene) return
    scene.x += (tilt.x - scene.x) * .06
    scene.y += (tilt.y - scene.y) * .06
    if (shine) shine.alpha = .12 + Math.min(.14, Math.abs(scene.x) * .018)
    const now = performance.now()
    for (const item of bobbers) item.note.y = item.baseY + Math.sin(now / 1200 + item.phase) * item.amplitude
  })
})
watch(() => props.entries, redraw, { deep: true })
onBeforeUnmount(() => {
  host.value?.removeEventListener('pointermove', movePointer)
  host.value?.removeEventListener('pointerleave', leavePointer)
  app?.destroy(true)
})
</script>

<style scoped>.jar-scene { width:min(88vw,430px); height:430px; margin:0 auto; }.jar-scene :deep(canvas) { width:100%; height:100%; display:block; }</style>
