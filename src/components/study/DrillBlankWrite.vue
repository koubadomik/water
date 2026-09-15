<template>
  <section class="drill-card">
    <p class="prose-ref">{{ verse.ref }}</p>
    <p class="drill-prompt">Write each missing word. A correct word settles in; a mistake stays visible so you can fix it.</p>
    <div class="blank-mode" aria-label="Blank interaction"><button :class="{ active: interaction === 'write' }" @click="interaction = 'write'">Write</button><button :class="{ active: interaction === 'tap' }" @click="interaction = 'tap'">Tap to reveal</button></div>
    <div class="blank-density" aria-label="Number of blanks"><button v-for="level in 5" :key="level" :class="{ active: blankLevel === level - 1 }" @click="setDensity(level - 1)">{{ densityLabels[level - 1] }}</button></div>
    <p class="prose drill-text"><template v-for="(token, index) in tokens" :key="index"><template v-if="!blanks.has(index)">{{ token }}</template><button v-else-if="interaction === 'tap'" :class="['drill-blank', { revealed: revealed.has(index) }]" @click="reveal(index)">{{ revealed.has(index) ? token.trim() : 'Tap' }}</button><input v-else v-model="written[index]" :ref="(node) => setNode(index, node)" :class="['drill-input', { correct: correct(index), wrong: attempted.has(index) && !correct(index) }]" :style="{ width: Math.max(4, token.trim().length + 1) + 'ch' }" autocomplete="off" autocorrect="off" spellcheck="false" @blur="markAttempt(index)" @keydown.enter.prevent="next(index)" />{{ blanks.has(index) ? trailingSpace(token) : '' }}</template></p>
    <p class="drill-progress">{{ solved ? 'All blanks recovered.' : 'Fill the blanks, then continue.' }}</p>
    <div class="drill-actions"><button class="btn btn-ghost" @click="reshuffle">New blanks</button><button v-if="!props.allMode" class="btn btn-primary" :disabled="!solved" @click="emit('done')">Full recall</button></div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { answersMatch } from '../../lib/matchAnswer.js'

const props = defineProps({ verse: { type: Object, required: true }, allMode: { type: Boolean, default: false } })
const emit = defineEmits(['done'])
const tokens = computed(() => props.verse.text.match(/\S+\s*/g) ?? [])
const seed = ref(0)
const blankLevel = ref(1)
const densityLabels = ['None', 'Light', 'Half', 'Most', 'All']
const interaction = ref('write')
const written = ref({})
const attempted = ref(new Set())
const revealed = ref(new Set())
const nodes = {}
const blanks = computed(() => {
  seed.value
  const candidates = tokens.value.map((_, index) => index)
  for (let i = candidates.length - 1; i > 0; i -= 1) {
    const swap = Math.floor(Math.random() * (i + 1))
    ;[candidates[i], candidates[swap]] = [candidates[swap], candidates[i]]
  }
  const count = Math.round(tokens.value.length * blankLevel.value / 4)
  return new Set(candidates.slice(0, count))
})
const correct = (index) => answersMatch(written.value[index], tokens.value[index])
const solved = computed(() => interaction.value === 'tap'
  ? [...blanks.value].every((index) => revealed.value.has(index))
  : [...blanks.value].every(correct))
function markAttempt(index) { attempted.value = new Set([...attempted.value, index]) }
function setNode(index, node) { if (node) nodes[index] = node }
function next(index) {
  markAttempt(index)
  const nextBlank = [...blanks.value].find((candidate) => candidate > index && !correct(candidate))
    ?? [...blanks.value].find((candidate) => !correct(candidate))
  if (nextBlank !== undefined && nextBlank !== index) nodes[nextBlank]?.focus()
}
function reveal(index) { revealed.value = new Set([...revealed.value, index]) }
function trailingSpace(token) { return token.match(/\s+$/)?.[0] ?? ' ' }
function reshuffle() { written.value = {}; attempted.value = new Set(); revealed.value = new Set(); seed.value += 1 }
function setDensity(level) { blankLevel.value = level; reshuffle() }
</script>

<style scoped>
.drill-card { padding:var(--space-5); border:1px solid var(--border); border-radius:var(--radius-xl); background:var(--card); box-shadow:var(--shadow-sm); }.drill-prompt { margin:var(--space-2) 0 var(--space-3); color:var(--muted-foreground); font-size:var(--text-sm); line-height:1.5; }.blank-mode { display:grid; grid-template-columns:1fr 1fr; gap:3px; margin-bottom:var(--space-2); padding:3px; border:1px solid var(--border); border-radius:var(--radius-full); background:var(--muted); }.blank-mode button { min-height:28px; border:0; border-radius:var(--radius-full); background:transparent; color:var(--muted-foreground); font:700 11px var(--font-reading); }.blank-mode button.active { background:var(--card); color:var(--foreground); box-shadow:var(--shadow-sm); }.blank-density { display:grid; grid-template-columns:repeat(5,1fr); gap:3px; margin-bottom:var(--space-4); padding:3px; border:1px solid var(--border); border-radius:var(--radius-full); background:var(--muted); }.blank-density button { min-height:28px; padding:0 2px; border:0; border-radius:var(--radius-full); background:transparent; color:var(--muted-foreground); font:700 10px var(--font-reading); }.blank-density button.active { background:var(--card); color:var(--foreground); box-shadow:var(--shadow-sm); }.drill-text { min-height:5.4em; margin-bottom:var(--space-5); white-space:pre-wrap; }.drill-blank { min-height:28px; margin:0 2px; padding:0 8px; border:0; border-bottom:2px dotted var(--muted-foreground); border-radius:var(--radius-sm); background:var(--muted); color:var(--muted-foreground); font:inherit; line-height:inherit; }.drill-blank.revealed { border-bottom-style:solid; border-bottom-color:var(--warning); background:var(--warning-surface); color:var(--foreground); }.drill-input { box-sizing:border-box; min-height:30px; margin:0 2px; border:0; border-bottom:2px dotted var(--muted-foreground); border-radius:0; background:transparent; color:var(--foreground); font:inherit; line-height:inherit; outline:none; }.drill-input:focus { border-bottom-color:var(--primary); }.drill-input.correct { border-bottom-color:var(--success); background:color-mix(in srgb,var(--success) 10%,transparent); }.drill-input.wrong { border-bottom-color:var(--destructive); background:color-mix(in srgb,var(--destructive) 9%,transparent); }.drill-progress { min-height:1.3em; margin:0 0 var(--space-3); color:var(--muted-foreground); font-size:var(--text-sm); }.drill-actions { display:flex; gap:var(--space-2); }.drill-actions .btn { flex:1; }
</style>
