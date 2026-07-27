<template>
  <div class="vr">
    <p class="prose-ref">{{ verse.ref }}</p>

    <template v-if="!submitted">
      <p class="vr-prompt">Write it from memory.</p>

      <textarea
        ref="box"
        v-model="answer"
        class="vr-input"
        data-testid="verse-input"
        rows="5"
        autocomplete="off"
        autocorrect="off"
        spellcheck="false"
        placeholder="…"
      />

      <!-- The palace note is the hint tier before giving up entirely. -->
      <div v-if="note" class="vr-hint">
        <button v-if="!hintShown" class="vr-hint-btn" data-testid="show-hint" @click="hintShown = true">
          Show my palace note
        </button>
        <p v-else class="vr-note" data-testid="hint-note">{{ note }}</p>
      </div>

      <div class="vr-actions">
        <button class="btn btn-ghost" data-testid="verse-give-up" @click="giveUp">Show me</button>
        <button class="btn btn-primary" data-testid="verse-submit" :disabled="!answer.trim()" @click="submit">
          Check
        </button>
      </div>
    </template>

    <template v-else>
      <p class="vr-verdict" :class="result" data-testid="verse-verdict">{{ verdictLabel }}</p>

      <p class="prose vr-diff" data-testid="verse-diff">
        <template v-for="(w, i) in diff.words" :key="i"
          ><span :class="['vr-w', w.status]">{{ w.value }}</span>{{ ' ' }}</template
        >
      </p>

      <p v-if="diff.extra.length" class="vr-extra">
        You added: <s>{{ diff.extra.join(' ') }}</s>
      </p>

      <button class="btn btn-primary vr-next" data-testid="verse-next" @click="emit('done', result)">
        {{ result === 'got' ? 'Next' : 'Try again' }}
      </button>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { diffWords } from '../../lib/diffWords.js'
import { answersMatch } from '../../lib/matchAnswer.js'

const props = defineProps({
  verse: { type: Object, required: true },
  note: { type: String, default: '' },
})

const emit = defineEmits(['done'])

const answer = ref('')
const submitted = ref(false)
const hintShown = ref(false)
const gaveUp = ref(false)
const box = ref(null)

const diff = computed(() => diffWords(gaveUp.value ? '' : answer.value, props.verse.text))

// Graded from the diff rather than by asking — the app can already see how
// much you recovered. Leaning on the note or giving up costs you a grade.
const result = computed(() => {
  if (gaveUp.value) return 'lost'
  if (answersMatch(answer.value, props.verse.text)) return hintShown.value ? 'shaky' : 'got'
  const share = diff.value.total ? diff.value.correct / diff.value.total : 0
  if (share >= 0.9) return 'shaky'
  if (share >= 0.5) return 'shaky'
  return 'lost'
})

const verdictLabel = computed(
  () => ({ got: 'Word perfect', shaky: 'Nearly — check the gaps', lost: 'Not yet' })[result.value],
)

function submit() {
  submitted.value = true
}

function giveUp() {
  gaveUp.value = true
  submitted.value = true
}

onMounted(() => box.value?.focus())
</script>

<style scoped>
.vr-prompt {
  font-size: var(--text-sm);
  color: var(--muted-foreground);
  margin: var(--space-2) 0 var(--space-4);
}

.vr-input {
  width: 100%;
  background: var(--card);
  border: 1px solid var(--input);
  border-radius: var(--radius-md);
  color: var(--foreground);
  font-family: var(--font-reading);
  font-size: var(--text-base);
  line-height: var(--leading-reading);
  padding: var(--space-3);
  resize: vertical;
}

.vr-input:focus {
  outline: 2px solid var(--ring);
  outline-offset: 1px;
  border-color: var(--primary);
}

.vr-hint {
  margin-top: var(--space-3);
}

.vr-hint-btn {
  background: none;
  border: none;
  color: var(--muted-foreground);
  font: inherit;
  font-size: var(--text-sm);
  text-decoration: underline;
  cursor: pointer;
  padding: var(--space-2) 0;
  min-height: 44px;
}

.vr-note {
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  color: var(--accent-foreground);
  background: var(--accent);
  border-radius: var(--radius-md);
  padding: var(--space-3);
}

.vr-actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-5);
}

.vr-actions .btn {
  flex: 1;
}

.vr-verdict {
  font-size: var(--text-sm);
  font-weight: 700;
  margin: var(--space-3) 0 var(--space-4);
}

.vr-verdict.got { color: var(--success); }
.vr-verdict.shaky { color: var(--warning); }
.vr-verdict.lost { color: var(--destructive); }

.vr-diff {
  margin-bottom: var(--space-4);
}

.vr-w.missing {
  color: var(--warning);
  text-decoration: underline;
  text-decoration-style: wavy;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}

.vr-extra {
  font-size: var(--text-sm);
  color: var(--muted-foreground);
  margin-bottom: var(--space-4);
}

.vr-next {
  width: 100%;
}
</style>
