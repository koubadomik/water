<template>
  <section class="vs">
    <p class="prose-ref">{{ verse.ref }}</p>
    <p class="vs-prompt">{{ prompt }}</p>

    <div v-if="mode === 'blanks'" class="vs-controls" aria-label="Blank practice mode">
      <button :class="['vs-mode', { on: interaction === 'tap' }]" @click="interaction = 'tap'">Tap to reveal</button>
      <button :class="['vs-mode', { on: interaction === 'write' }]" @click="interaction = 'write'">Write</button>
      <button class="vs-randomize" data-testid="randomize-blanks" @click="randomizeBlanks">New blanks</button>
    </div>

    <p v-if="mode === 'blanks'" class="prose vs-text" data-testid="blank-scaffold">
      <template v-for="(token, index) in tokens" :key="index">
        <template v-if="!blankIndexes.has(index)">{{ token.value }}</template>
        <button
          v-else-if="interaction === 'tap'"
          :class="['vs-blank', { revealed: revealed.has(index) }]"
          data-testid="scaffold-blank"
          @click="reveal(index)"
        >
          {{ revealed.has(index) ? token.value : 'Tap to reveal' }}
        </button>
        <input
          v-else
          v-model="written[index]"
          class="vs-write"
          data-testid="scaffold-write"
          :aria-label="`Blank ${index + 1}`"
          autocomplete="off"
          autocorrect="off"
          spellcheck="false"
        />
      </template>
    </p>

    <p v-else class="prose vs-initials" data-testid="initial-scaffold">
      <button
        v-for="(token, index) in tokens"
        :key="index"
        :class="['vs-initial', { revealed: revealed.has(index) }]"
        data-testid="scaffold-initial"
        @click="reveal(index)"
      >
        {{ revealed.has(index) ? token.value : initials(token.value) }}
      </button>
    </p>

    <p class="vs-note">This is a warm-up. It does not affect your review interval.</p>
    <div class="vs-actions">
      <button class="btn btn-ghost" data-testid="scaffold-next" @click="emit('next')">Next exercise</button>
      <button class="btn btn-primary" data-testid="scaffold-continue" @click="emit('done')">Full recall</button>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  verse: { type: Object, required: true },
  mode: { type: String, default: 'blanks', validator: (value) => ['blanks', 'initials'].includes(value) },
})

const emit = defineEmits(['done', 'next'])
const interaction = ref('tap')
const revealed = ref(new Set())
const written = ref({})
const blankSeed = ref(0)

const tokens = computed(() => props.verse.text.match(/\S+\s*/g)?.map((value) => ({ value })) ?? [])
const blankIndexes = computed(() => {
  // Reading through the same omission pattern quickly turns it into a clue.
  // Re-seeding makes each warm-up genuinely different while keeping about a
  // quarter of the verse hidden.
  blankSeed.value
  const candidates = tokens.value.map((_, index) => index)
  for (let i = candidates.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }
  const count = Math.max(1, Math.ceil(candidates.length / 4))
  return new Set(candidates.slice(0, count))
})

const prompt = computed(() =>
  props.mode === 'blanks'
    ? 'Warm up with a few missing words. Tap to reveal them, or switch to writing.'
    : 'Use the first letters to bring the verse back to mind. Tap any word when you need it.',
)

function reveal(index) {
  revealed.value = new Set([...revealed.value, index])
}

function randomizeBlanks() {
  revealed.value = new Set()
  written.value = {}
  blankSeed.value += 1
}

function initials(value) {
  const letters = [...value].filter((char) => /[\p{L}\p{N}]/u.test(char))
  if (!letters.length) return value
  return `${letters[0].toUpperCase()}${'·'.repeat(Math.max(0, letters.length - 1))}${value.match(/[^\p{L}\p{N}\s]+$/u)?.[0] ?? ''}`
}
</script>

<style scoped>
.vs-prompt { margin: var(--space-2) 0 var(--space-4); color: var(--muted-foreground); font-size: var(--text-sm); }

.vs-controls { display: flex; gap: var(--space-2); margin-bottom: var(--space-4); }
.vs-mode { min-height: 36px; border: 1px solid var(--border); border-radius: var(--radius-full); background: var(--card); color: var(--muted-foreground); padding: 0 var(--space-3); font: inherit; font-size: var(--text-sm); font-weight: 600; cursor: pointer; }
.vs-mode.on { border-color: var(--primary); background: var(--accent); color: var(--accent-foreground); }
.vs-randomize { margin-left: auto; border: 0; background: transparent; color: var(--muted-foreground); font: inherit; font-size: var(--text-sm); text-decoration: underline; cursor: pointer; padding: 0 var(--space-1); }

.vs-text, .vs-initials { margin-bottom: var(--space-5); }
.vs-blank, .vs-initial, .vs-write { font: inherit; line-height: inherit; }
.vs-blank { border: 0; border-bottom: 2px dotted var(--muted-foreground); background: var(--muted); border-radius: var(--radius-sm); color: var(--muted-foreground); cursor: pointer; margin-inline: 2px; padding: 0 var(--space-2); }
.vs-blank.revealed { border-bottom-style: solid; background: var(--warning-surface); color: var(--foreground); }
.vs-write { width: 6.5em; border: 0; border-bottom: 2px dotted var(--muted-foreground); border-radius: 0; background: transparent; color: var(--foreground); margin-inline: 2px; outline: none; }
.vs-write:focus { border-bottom-color: var(--primary); }

.vs-initials { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.vs-initial { border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--muted); color: var(--muted-foreground); cursor: pointer; padding: 1px var(--space-2); }
.vs-initial.revealed { background: var(--warning-surface); border-color: var(--warning); color: var(--foreground); }

.vs-note { color: var(--muted-foreground); font-size: var(--text-sm); margin-bottom: var(--space-4); }
.vs-actions { display: flex; gap: var(--space-2); }
.vs-actions .btn { flex: 1; }
</style>
