<template>
  <section class="drill-card next-word">
    <p class="prose-ref">{{ verse.ref }}</p>
    <p class="drill-prompt">Say the next word before revealing it.</p>
    <p class="prose drill-text"><template v-for="(word, index) in words" :key="index"><span :class="{ hidden: index >= visible }">{{ index < visible ? word : '···· ' }}</span></template></p>
    <button v-if="!finished" class="btn btn-primary drill-wide" @click="reveal">Reveal next word</button>
    <button v-else-if="!props.allMode" class="btn btn-primary drill-wide" @click="emit('done')">Write the blanks</button>
    <p v-else class="drill-finished">All words revealed.</p>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({ verse: { type: Object, required: true }, allMode: { type: Boolean, default: false } })
const emit = defineEmits(['done'])
const words = computed(() => props.verse.text.match(/\S+\s*/g) ?? [])
const visible = ref(0)
const finished = computed(() => visible.value >= words.value.length)
function reveal() { visible.value = Math.min(words.value.length, visible.value + 1) }
</script>

<style scoped>
.drill-card { padding:var(--space-5); border:1px solid var(--border); border-radius:var(--radius-xl); background:var(--card); box-shadow:var(--shadow-sm); }.drill-prompt { margin:var(--space-2) 0 var(--space-5); color:var(--muted-foreground); font-size:var(--text-sm); line-height:1.5; }.drill-text { min-height:5.4em; margin-bottom:var(--space-5); white-space:pre-wrap; }.hidden { color:var(--muted-foreground); letter-spacing:.08em; }.drill-wide { width:100%; min-height:48px; }
</style>
