<template>
  <div class="vr">
    <p class="prose-ref">{{ verse.ref }}</p>

    <details class="vr-rules">
      <summary>Correction rules <span>{{ rulesSummary }}</span></summary>
      <div class="vr-rules-body">
        <p>Punctuation</p>
        <label><input v-model="comparisonRules.punctuation" type="radio" value="ignore" /> Do not check</label>
        <label><input v-model="comparisonRules.punctuation" type="radio" value="all" /> Check all punctuation</label>
        <label><input v-model="comparisonRules.punctuation" type="radio" value="sentence-dots" /> Check only sentence dots</label>
        <label class="vr-case-rule"><input v-model="comparisonRules.caseSensitive" type="checkbox" /> Check upper/lower case</label>
      </div>
    </details>

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

      <section v-if="!gaveUp" class="vr-attempt" data-testid="verse-attempt">
        <p class="vr-attempt-label">Your answer</p>
        <p class="prose vr-attempt-text">{{ answer }}</p>
      </section>

      <section class="vr-correction" data-testid="verse-diff" aria-label="Correction">
        <div v-if="correctionStats.total" class="vr-summary">
          <span v-if="correctionStats.missing">{{ correctionStats.missing }} missed</span>
          <span v-if="correctionStats.replaced">{{ correctionStats.replaced }} swapped</span>
          <span v-if="correctionStats.extra" class="extra">{{ correctionStats.extra }} added</span>
        </div>
        <p class="vr-correction-label">Correct verse <span v-if="correctionStats.total">— your changes are marked</span></p>
        <p class="prose vr-diff">
          <template v-for="(item, i) in diff.correction" :key="i">
            <span v-if="item.type === 'extra'" class="vr-token extra"><span aria-hidden="true">+</span> <s>{{ item.value }}</s></span>
            <span v-else :class="['vr-token', item.status]">
              {{ item.value }}
              <small v-if="item.status === 'replaced'">you: <s>{{ item.typed }}</s></small>
              <small v-else-if="item.status === 'missing'">missed</small>
            </span>
            {{ ' ' }}
          </template>
        </p>
        <p v-if="correctionStats.total" class="vr-key"><b>Gold</b> = the word to learn · <b>red</b> = what you added or wrote instead</p>
      </section>

      <button class="btn btn-primary vr-next" data-testid="verse-next" @click="continueRecall">
        {{ result === 'got' ? 'Next' : retryInline ? 'Edit and try again' : 'Try again' }}
      </button>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { diffWords } from '../../lib/diffWords.js'
import { answersMatch } from '../../lib/matchAnswer.js'
import { useStorage } from '../../composables/useStorage.js'

const props = defineProps({
  verse: { type: Object, required: true },
  note: { type: String, default: '' },
  retryInline: { type: Boolean, default: false },
})

const emit = defineEmits(['done'])

const answer = ref('')
const submitted = ref(false)
const hintShown = ref(false)
const gaveUp = ref(false)
const box = ref(null)
const comparisonRules = useStorage('fullRecallComparisonRules_v1', { punctuation: 'ignore', caseSensitive: false })

const rulesSummary = computed(() => {
  const punctuation = { ignore: 'no punctuation', all: 'all punctuation', 'sentence-dots': 'sentence dots' }[comparisonRules.value.punctuation] ?? 'no punctuation'
  return `${punctuation} · ${comparisonRules.value.caseSensitive ? 'case checked' : 'case ignored'}`
})
const diff = computed(() => diffWords(gaveUp.value ? '' : answer.value, props.verse.text, comparisonRules.value))
const correctionStats = computed(() => diff.value.correction.reduce((stats, item) => {
  if (item.type === 'extra') stats.extra++
  else if (item.status === 'missing') stats.missing++
  else if (item.status === 'replaced') stats.replaced++
  stats.total = stats.missing + stats.replaced + stats.extra
  return stats
}, { missing: 0, replaced: 0, extra: 0, total: 0 }))

// Graded from the diff rather than by asking — the app can already see how
// much you recovered. Leaning on the note or giving up costs you a grade.
const result = computed(() => {
  if (gaveUp.value) return 'lost'
  if (answersMatch(answer.value, props.verse.text, comparisonRules.value)) return hintShown.value ? 'shaky' : 'got'
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

function continueRecall() {
  if (result.value !== 'got' && props.retryInline) {
    submitted.value = false
    gaveUp.value = false
    nextTick(() => box.value?.focus())
    return
  }
  emit('done', result.value)
}

onMounted(() => box.value?.focus())
</script>

<style scoped>
.vr-prompt {
  font-size: var(--text-sm);
  color: var(--muted-foreground);
  margin: var(--space-2) 0 var(--space-4);
}

.vr-rules {
  margin: var(--space-2) 0 var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--card);
  color: var(--muted-foreground);
  font-size: 12px;
}

.vr-rules summary { display: flex; justify-content: space-between; gap: var(--space-2); min-height: 38px; align-items: center; padding: 0 var(--space-3); color: var(--foreground); cursor: pointer; font-weight: 700; }
.vr-rules summary span { overflow: hidden; color: var(--muted-foreground); font-size: 11px; font-weight: 400; text-overflow: ellipsis; white-space: nowrap; }
.vr-rules-body { display: grid; gap: 8px; padding: 0 var(--space-3) var(--space-3); }
.vr-rules-body p { margin: 2px 0 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }
.vr-rules-body label { display: flex; gap: 8px; align-items: center; min-height: 24px; color: var(--foreground); cursor: pointer; }
.vr-rules-body input { accent-color: var(--primary); }
.vr-rules-body .vr-case-rule { margin-top: 3px; padding-top: 9px; border-top: 1px solid var(--border); }

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

.vr-attempt {
  margin: 0 0 var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--muted);
}

.vr-attempt-label { margin: 0 0 var(--space-2); color: var(--muted-foreground); font-size: 12px; font-weight: 700; }
.vr-attempt-text { margin: 0; white-space: pre-wrap; }

.vr-correction {
  margin: 0 0 var(--space-4);
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--card);
}

.vr-summary { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: var(--space-2); }
.vr-summary span { padding: 3px 7px; border-radius: var(--radius-full); background: var(--warning-surface); color: var(--warning); font-size: 11px; font-weight: 800; }
.vr-summary span.extra { background: var(--accent); color: var(--destructive); }
.vr-correction-label { margin: 0 0 var(--space-2); color: var(--muted-foreground); font-size: 12px; font-weight: 700; }
.vr-correction-label span { font-weight: 400; }
.vr-diff { margin: 0; line-height: 2.25; }
.vr-token { display: inline-block; border-radius: 4px; padding: 0 2px; }
.vr-token.missing, .vr-token.replaced { background: var(--warning-surface); color: var(--warning); box-shadow: inset 0 -2px 0 var(--warning); }
.vr-token.extra { color: var(--destructive); background: var(--accent); font-size: .92em; }
.vr-token small { margin-left: 3px; color: var(--destructive); font-family: var(--font-ui); font-size: .68em; font-weight: 700; white-space: nowrap; }
.vr-token.missing small { color: var(--warning); }
.vr-key { margin: var(--space-2) 0 0; color: var(--muted-foreground); font-size: 11px; line-height: 1.35; }
.vr-key b:first-child { color: var(--warning); }
.vr-key b:last-child { color: var(--destructive); }

.vr-next {
  width: 100%;
}
</style>
