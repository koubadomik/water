<template>
  <div class="drill">
    <!-- Step indicator -->
    <div data-testid="step-indicator" class="step-bar">
      <span class="step-label">{{ stepLabel }}</span>
      <span class="step-pos">{{ stepIdx + 1 }} / {{ steps.length }}</span>
    </div>

    <!-- ─── PALACE NOTE ─── -->
    <template v-if="step === 'palace-note'">
      <div class="card">
        <div class="ref">{{ verse.ref }}</div>
        <div class="prompt">Your memory palace note:</div>
        <textarea
          v-model="noteInput"
          class="textarea"
          rows="4"
          placeholder="Describe a vivid scene or image…"
          @input="onNoteInput"
        />
        <div class="hint">Write a scene that anchors this verse in a place you know.</div>
      </div>
      <button data-testid="continue" class="btn" @click="next">Looks good →</button>
    </template>

    <!-- ─── READ ─── -->
    <template v-else-if="step === 'read'">
      <div class="card">
        <div class="ref">{{ verse.ref }}</div>
        <div class="verse-text">{{ verse.text }}</div>
      </div>
      <button data-testid="continue" class="btn" @click="next">Continue</button>
    </template>

    <!-- ─── CONTEXT BROWSER ─── -->
    <template v-else-if="step === 'context-browser'">
      <div class="card">
        <div class="prompt">Where this verse sits in context:</div>
        <div class="context-list">
          <div
            v-for="cv in contextVerses"
            :key="cv.idx"
            class="context-verse"
            :class="{ current: cv.isCurrent }"
          >
            <span class="context-num">{{ verse.chapter }}:{{ cv.idx + 1 }}</span>
            <span class="context-text">{{ cv.text }}</span>
          </div>
          <div v-if="contextVerses.length === 0" class="verse-text">{{ verse.text }}</div>
        </div>
      </div>
      <button data-testid="continue" class="btn" @click="next">Continue</button>
    </template>

    <!-- ─── FLASHCARD ─── -->
    <template v-else-if="step === 'flashcard'">
      <div class="card flashcard" :class="{ flipped }" @click="!flipped && (flipped = true)">
        <template v-if="!flipped">
          <div class="ref ref-xl">{{ verse.ref }}</div>
          <div class="hint tap-hint">Tap to reveal</div>
        </template>
        <template v-else>
          <div class="ref">{{ verse.ref }}</div>
          <div class="verse-text">{{ verse.text }}</div>
          <div v-if="noteInput" class="palace-note-hint">
            <span class="note-label">Palace note:</span> {{ noteInput }}
          </div>
        </template>
      </div>
      <button v-if="!flipped" data-testid="flip-btn" class="btn btn-secondary" @click="flipped = true">Flip card</button>
      <button v-else data-testid="continue" class="btn" @click="next">Continue</button>
    </template>

    <!-- ─── EMOJI REVEAL ─── -->
    <template v-else-if="step === 'emoji-reveal'">
      <div class="card">
        <div class="ref">{{ verse.ref }}</div>
        <div class="word-grid">
          <span
            v-for="w in resolvedWords"
            :key="w.wordIdx"
            class="word-token"
            :class="{
              'has-emoji': w.emoji && !emojiRevealed.includes(w.wordIdx),
              'emoji-revealed': w.emoji && emojiRevealed.includes(w.wordIdx),
            }"
            @click="w.emoji && !emojiRevealed.includes(w.wordIdx) ? tapEmoji(w.wordIdx) : null"
          >{{ (w.emoji && !emojiRevealed.includes(w.wordIdx)) ? w.emoji : w.word }}</span>
        </div>
        <div v-if="!allEmojiRevealed" class="hint">Tap each symbol to reveal the word beneath</div>
      </div>
      <button
        data-testid="continue"
        class="btn"
        :disabled="!allEmojiRevealed"
        @click="next"
      >{{ allEmojiRevealed ? 'Continue' : `Reveal all (${emojiRevealed.length}/${resolvedWords.filter(w=>w.emoji).length})` }}</button>
    </template>

    <!-- ─── KEYWORD FOCUS ─── -->
    <template v-else-if="step === 'keyword-focus'">
      <div class="card">
        <div class="ref">{{ verse.ref }}</div>
        <div class="prompt">Tap 1–3 key words:</div>
        <div class="word-grid">
          <button
            v-for="(w, i) in rawWords"
            :key="i"
            data-testid="word-btn"
            class="word-btn"
            :class="{ 'word-selected': tapped.includes(i) }"
            @click="tapKeyword(i)"
          >{{ w }}</button>
        </div>
      </div>
      <button data-testid="continue" class="btn" @click="next">Done</button>
    </template>

    <!-- ─── SCRAMBLE ─── -->
    <template v-else-if="step === 'scramble'">
      <div class="card">
        <div class="ref">{{ verse.ref }}</div>
        <div class="built-sentence">
          <span v-if="scrambleBuilt.length === 0" class="built-placeholder">Tap words in order…</span>
          <span v-for="(w, i) in scrambleBuilt" :key="i" class="built-word">{{ w }}</span>
        </div>
        <div class="word-grid">
          <button
            v-for="(item, i) in scramblePool"
            :key="i"
            data-testid="word-btn"
            class="word-btn"
            :class="{ 'word-used': item.used }"
            :disabled="item.used || !!feedback"
            @click="tapScrambleWord(i)"
          >{{ item.word }}</button>
        </div>
        <div v-if="feedback" data-testid="feedback" :class="correct ? 'feedback-correct' : 'feedback-wrong'">
          {{ correct ? 'Correct!' : 'Not quite — see the verse next time' }}
        </div>
      </div>
      <button v-if="!feedback" data-testid="continue" class="btn"
        :class="{ 'btn-secondary': scrambleBuilt.length < rawWords.length }"
        @click="scrambleBuilt.length >= rawWords.length ? checkScramble() : next()">
        {{ scrambleBuilt.length >= rawWords.length ? 'Check' : 'Skip →' }}
      </button>
      <button v-else data-testid="continue" class="btn" @click="next">Continue</button>
    </template>

    <!-- ─── PHRASE ORDER ─── -->
    <template v-else-if="step === 'phrase-order'">
      <div class="card">
        <div class="ref">{{ verse.ref }}</div>
        <div class="built-sentence">
          <span v-if="phraseBuilt.length === 0" class="built-placeholder">Tap phrases in order…</span>
          <span v-for="(c, i) in phraseBuilt" :key="i" class="built-chunk">{{ c }}</span>
        </div>
        <div class="chunk-grid">
          <button
            v-for="(item, i) in phrasePool"
            :key="i"
            data-testid="word-btn"
            class="chunk-btn"
            :class="{ 'word-used': item.used }"
            :disabled="item.used || !!feedback"
            @click="tapPhrase(i)"
          >{{ item.chunk }}</button>
        </div>
        <div v-if="feedback" data-testid="feedback" :class="correct ? 'feedback-correct' : 'feedback-wrong'">
          {{ correct ? 'Correct order!' : 'Not quite' }}
        </div>
      </div>
      <button v-if="!feedback" data-testid="continue" class="btn"
        :class="{ 'btn-secondary': phraseBuilt.length < phrasePool.length }"
        @click="phraseBuilt.length >= phrasePool.length ? checkPhrase() : next()">
        {{ phraseBuilt.length >= phrasePool.length ? 'Check' : 'Skip →' }}
      </button>
      <button v-else data-testid="continue" class="btn" @click="next">Continue</button>
    </template>

    <!-- ─── FILL BLANKS ─── -->
    <template v-else-if="step === 'fill-blanks'">
      <div class="card">
        <div class="ref">{{ verse.ref }}</div>
        <div class="fill-text">
          <template v-for="(w, i) in rawWords" :key="i">
            <input
              v-if="fillBlanks.includes(i)"
              v-model="fillAnswers[i]"
              class="fill-input"
              :style="{ width: Math.max(3, w.length) + 'ch' }"
              :class="feedback ? (cleanToken(fillAnswers[i] ?? '') === cleanToken(w) ? 'fill-ok' : 'fill-bad') : ''"
              :disabled="!!feedback"
            />
            <span v-else class="fill-word">{{ w }}</span>{{ ' ' }}
          </template>
        </div>
        <div v-if="feedback" data-testid="feedback" :class="correct ? 'feedback-correct' : 'feedback-wrong'">
          {{ correct ? 'All correct!' : 'Check the highlighted words' }}
        </div>
      </div>
      <button data-testid="continue" class="btn" @click="feedback ? next() : checkFill()">
        {{ feedback ? 'Continue' : 'Submit' }}
      </button>
    </template>

    <!-- ─── MISSING WORD ─── -->
    <template v-else-if="step === 'missing-word'">
      <div class="card">
        <div class="ref">{{ verse.ref }}</div>
        <div class="gapped-text">{{ gappedText }}</div>
        <div class="choices">
          <button
            v-for="choice in missingChoices"
            :key="choice"
            data-testid="choice-btn"
            class="choice-btn"
            :class="feedback
              ? cleanToken(choice) === cleanToken(missingWord) ? 'choice-correct' : (selectedChoice === choice ? 'choice-wrong' : 'choice-dim')
              : ''"
            :disabled="!!feedback"
            @click="pickMissingWord(choice)"
          >{{ choice }}</button>
        </div>
        <div v-if="feedback" data-testid="feedback" :class="correct ? 'feedback-correct' : 'feedback-wrong'">
          {{ correct ? 'Correct!' : `It was: "${missingWord}"` }}
        </div>
      </div>
      <button v-if="feedback" data-testid="continue" class="btn" @click="next">Continue</button>
    </template>

    <!-- ─── MULTIPLE CHOICE ─── -->
    <template v-else-if="step === 'multiple-choice'">
      <div class="card">
        <div class="ref ref-xl">{{ verse.ref }}</div>
        <div class="prompt">Which verse is this?</div>
        <div class="choices">
          <button
            v-for="(opt, i) in mcOptions"
            :key="i"
            data-testid="choice-btn"
            class="choice-btn choice-text"
            :class="feedback
              ? opt.isCorrect ? 'choice-correct' : (selectedChoice === i ? 'choice-wrong' : 'choice-dim')
              : ''"
            :disabled="!!feedback"
            @click="pickIndexChoice(i, opt.isCorrect)"
          >{{ opt.text }}</button>
        </div>
        <div v-if="feedback" data-testid="feedback" :class="correct ? 'feedback-correct' : 'feedback-wrong'">
          {{ correct ? 'Correct!' : 'Not quite' }}
        </div>
      </div>
      <button v-if="feedback" data-testid="continue" class="btn" @click="next">Continue</button>
    </template>

    <!-- ─── REFERENCE MATCH ─── -->
    <template v-else-if="step === 'ref-match'">
      <div class="card">
        <div class="verse-text">{{ verse.text }}</div>
        <div class="prompt">Which reference is this?</div>
        <div class="choices">
          <button
            v-for="(opt, i) in refOptions"
            :key="i"
            data-testid="choice-btn"
            class="choice-btn"
            :class="feedback
              ? opt.isCorrect ? 'choice-correct' : (selectedChoice === i ? 'choice-wrong' : 'choice-dim')
              : ''"
            :disabled="!!feedback"
            @click="pickIndexChoice(i, opt.isCorrect)"
          >{{ opt.ref }}</button>
        </div>
        <div v-if="feedback" data-testid="feedback" :class="correct ? 'feedback-correct' : 'feedback-wrong'">
          {{ correct ? 'Correct!' : `It was ${verse.ref}` }}
        </div>
      </div>
      <button v-if="feedback" data-testid="continue" class="btn" @click="next">Continue</button>
    </template>

    <!-- ─── VERSE MATCHER ─── -->
    <template v-else-if="step === 'verse-matcher'">
      <div class="card">
        <div class="ref">{{ verse.ref }}</div>
        <div class="verse-text half-verse">{{ firstHalf }}…</div>
        <div class="prompt">Pick the correct ending:</div>
        <div class="choices">
          <button
            v-for="(opt, i) in verseMatcherOpts"
            :key="i"
            data-testid="choice-btn"
            class="choice-btn choice-text"
            :class="feedback
              ? opt.isCorrect ? 'choice-correct' : (selectedChoice === i ? 'choice-wrong' : 'choice-dim')
              : ''"
            :disabled="!!feedback"
            @click="pickIndexChoice(i, opt.isCorrect)"
          >{{ opt.text }}</button>
        </div>
        <div v-if="feedback" data-testid="feedback" :class="correct ? 'feedback-correct' : 'feedback-wrong'">
          {{ correct ? 'Correct!' : 'Not quite' }}
        </div>
      </div>
      <button v-if="feedback" data-testid="continue" class="btn" @click="next">Continue</button>
    </template>

    <!-- ─── FULL RECALL ─── -->
    <template v-else-if="step === 'full-recall'">
      <div class="card">
        <div class="ref">{{ verse.ref }}</div>
        <textarea
          v-if="!feedback"
          v-model="answer"
          class="textarea"
          rows="4"
          placeholder="Type the full verse from memory…"
          @keydown.ctrl.enter="checkVerseRecall"
        />
        <template v-if="feedback">
          <div data-testid="feedback" :class="correct ? 'feedback-correct' : 'feedback-wrong'">
            {{ correct ? 'Excellent!' : 'Keep going!' }}
          </div>
          <div class="diff-output" v-html="recallDiff" />
        </template>
      </div>
      <button data-testid="continue" class="btn" @click="feedback ? next() : checkVerseRecall()">
        {{ feedback ? 'Continue' : 'Submit' }}
      </button>
    </template>

    <!-- ─── NOTE RECALL ─── -->
    <template v-else-if="step === 'note-recall'">
      <div class="card">
        <div v-if="noteInput" class="palace-note-display">
          <span class="note-label">Palace note:</span> {{ noteInput }}
        </div>
        <div v-else class="hint">No palace note yet — recall from memory.</div>
        <textarea
          v-if="!feedback"
          v-model="answer"
          class="textarea"
          rows="4"
          placeholder="Using your palace note as a cue, type the verse…"
          @keydown.ctrl.enter="checkVerseRecall"
        />
        <template v-if="feedback">
          <div data-testid="feedback" :class="correct ? 'feedback-correct' : 'feedback-wrong'">
            {{ correct ? 'Excellent!' : 'Keep going!' }}
          </div>
          <div class="diff-output" v-html="recallDiff" />
        </template>
      </div>
      <button data-testid="continue" class="btn" @click="feedback ? next() : checkVerseRecall()">
        {{ feedback ? 'Continue' : 'Submit' }}
      </button>
    </template>

    <!-- ─── FIRST LETTER ─── -->
    <template v-else-if="step === 'first-letter'">
      <div class="card">
        <div class="ref">{{ verse.ref }}</div>
        <div class="word-grid">
          <span v-for="(w, i) in firstLetterWords" :key="i" class="letter-token">
            <template v-if="w.shown">{{ w.word }}</template>
            <template v-else><strong>{{ w.first }}</strong>{{ w.mask }}</template>
          </span>
        </div>
        <div class="reveal-counter">{{ revealedCount }} / {{ rawWords.length }} revealed</div>
      </div>
      <div class="btn-row">
        <button
          v-if="revealedCount < rawWords.length"
          class="btn btn-secondary"
          @click="revealedCount++"
        >Reveal next</button>
        <button data-testid="continue" class="btn" @click="next">Continue</button>
      </div>
    </template>

    <!-- ─── DICTATION ─── -->
    <template v-else-if="step === 'dictation'">
      <div class="card">
        <div class="ref ref-xl">{{ verse.ref }}</div>
        <div class="prompt">Say the verse aloud, then type it:</div>
        <textarea
          v-if="!feedback"
          v-model="answer"
          class="textarea"
          rows="4"
          placeholder="Type what you said…"
          @keydown.ctrl.enter="checkVerseRecall"
        />
        <template v-if="feedback">
          <div data-testid="feedback" :class="correct ? 'feedback-correct' : 'feedback-wrong'">
            {{ correct ? 'Excellent!' : 'Keep going!' }}
          </div>
          <div class="diff-output" v-html="recallDiff" />
        </template>
      </div>
      <button data-testid="continue" class="btn" @click="feedback ? next() : checkVerseRecall()">
        {{ feedback ? 'Continue' : 'Submit' }}
      </button>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useStorage } from '../composables/useStorage.js'
import { usePalaceNotes } from '../composables/usePalaceNotes.js'
import { useBible, getChapter } from '../composables/useBible.js'

const props = defineProps({
  verse: { type: Object, required: true },
  lessonIndex: { type: Number, default: 0 },
})
const emit = defineEmits(['done'])

const { getNote, setNote } = usePalaceNotes()
const { bible } = useBible()
const emojiMap = useStorage('userCustomEmojis', {})

// ─── Phase / Step definitions ─────────────────────────────
const PHASES = [
  { primary: 'palace-note',  bonuses: [] },
  { primary: 'read',          bonuses: ['context-browser', 'flashcard'] },
  { primary: 'emoji-reveal',  bonuses: ['keyword-focus'] },
  { primary: 'scramble',      bonuses: ['phrase-order', 'fill-blanks'] },
  { primary: 'missing-word',  bonuses: ['multiple-choice', 'ref-match', 'verse-matcher'] },
  { primary: 'full-recall',   bonuses: ['note-recall', 'first-letter', 'dictation'] },
]

const BONUS_POOL = {
  0: ['flashcard', 'multiple-choice', 'context-browser'],
  1: ['phrase-order', 'fill-blanks', 'ref-match', 'verse-matcher'],
  2: ['note-recall', 'dictation', 'first-letter'],
}

const STEP_LABELS = {
  'palace-note': 'Palace Note', 'read': 'Read', 'context-browser': 'Context',
  'flashcard': 'Flashcard', 'emoji-reveal': 'Symbolic', 'keyword-focus': 'Keyword Focus',
  'scramble': 'Word Scramble', 'phrase-order': 'Phrase Order', 'fill-blanks': 'Fill Blanks',
  'missing-word': 'Missing Word', 'multiple-choice': 'Multiple Choice',
  'ref-match': 'Reference Match', 'verse-matcher': 'Verse Matcher',
  'full-recall': 'Full Recall', 'note-recall': 'Note Recall',
  'first-letter': 'First Letter', 'dictation': 'Dictation',
}

function buildStepList(li) {
  const pool = BONUS_POOL[li] ?? []
  const result = []
  for (const phase of PHASES) {
    result.push(phase.primary)
    const eligible = phase.bonuses.filter(b => pool.includes(b))
    if (eligible.length > 0 && Math.random() < 0.5) {
      result.push(eligible[Math.floor(Math.random() * eligible.length)])
    }
  }
  return result
}

// ─── Step state ───────────────────────────────────────────
const steps = ref(buildStepList(props.lessonIndex))
const stepIdx = ref(0)
const step = computed(() => steps.value[stepIdx.value] ?? 'read')
const stepLabel = computed(() => STEP_LABELS[step.value] ?? '')

// ─── Shared per-step state ─────────────────────────────────
const answer = ref('')
const feedback = ref(false)
const correct = ref(false)
const selectedChoice = ref(null)
const recallDiff = ref('')

// ─── PALACE NOTE ──────────────────────────────────────────
const noteInput = ref('')
let noteTimer = null

function onNoteInput() {
  if (noteTimer) clearTimeout(noteTimer)
  noteTimer = setTimeout(() => {
    if (props.verse.book) setNote(props.verse.book, props.verse.chapter, props.verse.verseIdx, noteInput.value)
  }, 500)
}

// ─── CONTEXT BROWSER ──────────────────────────────────────
const contextVerses = computed(() => {
  if (!bible.value || !props.verse.book) return []
  const ch = getChapter(bible.value, props.verse.book, props.verse.chapter)
  const vi = props.verse.verseIdx
  const result = []
  for (let i = Math.max(0, vi - 2); i <= Math.min(ch.length - 1, vi + 2); i++) {
    result.push({ idx: i, text: ch[i], isCurrent: i === vi })
  }
  return result
})

// ─── FLASHCARD ────────────────────────────────────────────
const flipped = ref(false)

// ─── EMOJI REVEAL ─────────────────────────────────────────
const BUILT_IN_EMOJI = {
  bůh:'🙏',boh:'🙏',god:'🙏',láska:'❤️',love:'❤️',milovat:'❤️',světlo:'💡',
  světa:'🌍',svět:'🌍',world:'🌍',voda:'💧',water:'💧',chléb:'🍞',bread:'🍞',
  víno:'🍷',wine:'🍷',srdce:'❤️',heart:'❤️',ruka:'🤝',ruce:'🤝',nebe:'☁️',
  heaven:'☁️',země:'🌍',earth:'🌍',slunce:'☀️',sun:'☀️',měsíc:'🌙',moon:'🌙',
  hvězda:'⭐',star:'⭐',oheň:'🔥',fire:'🔥',duch:'👻',spirit:'👻',krev:'🩸',
  blood:'🩸',kříž:'✝️',cross:'✝️',ježíš:'✝️',jesus:'✝️',kristus:'✝️',christ:'✝️',
  anděl:'👼',angel:'👼',modlitba:'🙏',prayer:'🙏',víra:'⛪',faith:'⛪',naděje:'🌈',
  hope:'🌈',pokoj:'🕊️',peace:'🕊️',radost:'😊',joy:'😊',milost:'✨',grace:'✨',
  pravda:'⚖️',truth:'⚖️',slovo:'📖',word:'📖',kniha:'📚',book:'📚',chrám:'⛪',
  temple:'⛪',král:'👑',king:'👑',království:'👑',ovce:'🐑',sheep:'🐑',beránek:'🐑',
  lamb:'🐑',ryba:'🐟',fish:'🐟',strom:'🌳',tree:'🌳',hora:'⛰️',mountain:'⛰️',
  moře:'🌊',sea:'🌊',řeka:'🌊',river:'🌊',vítr:'💨',wind:'💨',smrt:'💀',death:'💀',
  život:'🌱',life:'🌱',hřích:'😈',sin:'😈',spasení:'🛡️',salvation:'🛡️',pán:'👑',
  lord:'👑',otec:'👨',father:'👨',syn:'👦',son:'👦',matka:'👩',mother:'👩',
  člověk:'🧑',man:'🧑',lid:'👥',people:'👥',národy:'🌍',nations:'🌍',
  zpívat:'🎵',sing:'🎵',gave:'🎁',
}

function cleanToken(s) {
  return s.toLowerCase().replace(/[^\wÀ-ɏ'-]/g, '')
}

const rawWords = computed(() => props.verse.text.split(/\s+/).filter(Boolean))

const resolvedWords = computed(() => {
  const words = rawWords.value
  const result = []
  let i = 0
  while (i < words.length) {
    let found = false
    for (let len = Math.min(3, words.length - i); len >= 1; len--) {
      const phrase = words.slice(i, i + len).map(cleanToken).join(' ')
      const emoji = emojiMap.value[phrase] ?? BUILT_IN_EMOJI[phrase] ?? null
      if (emoji || len === 1) {
        for (let j = 0; j < len; j++) {
          result.push({ word: words[i + j], emoji: j === 0 ? emoji : null, wordIdx: i + j })
        }
        i += len
        found = true
        break
      }
    }
    if (!found) { result.push({ word: words[i], emoji: null, wordIdx: i }); i++ }
  }
  return result
})

const emojiRevealed = ref([])
function tapEmoji(wordIdx) {
  if (!emojiRevealed.value.includes(wordIdx)) emojiRevealed.value = [...emojiRevealed.value, wordIdx]
}
const allEmojiRevealed = computed(() => {
  const emojiWords = resolvedWords.value.filter(w => w.emoji)
  return emojiWords.length === 0 || emojiWords.every(w => emojiRevealed.value.includes(w.wordIdx))
})

// ─── KEYWORD FOCUS ────────────────────────────────────────
const tapped = ref([])
function tapKeyword(i) {
  if (tapped.value.includes(i)) tapped.value = tapped.value.filter(x => x !== i)
  else if (tapped.value.length < 3) tapped.value = [...tapped.value, i]
}

// ─── SCRAMBLE ─────────────────────────────────────────────
const scramblePool = ref([])
const scrambleBuilt = ref([])
function tapScrambleWord(i) {
  if (scramblePool.value[i].used) return
  const word = scramblePool.value[i].word
  scramblePool.value = scramblePool.value.map((item, idx) => idx === i ? { ...item, used: true } : item)
  scrambleBuilt.value = [...scrambleBuilt.value, word]
}
function checkScramble() {
  correct.value = normalize(scrambleBuilt.value.join(' ')) === normalize(rawWords.value.join(' '))
  feedback.value = true
}

// ─── PHRASE ORDER ─────────────────────────────────────────
const phrasePool = ref([])
const phraseBuilt = ref([])
const phraseChunks = computed(() => {
  const text = props.verse.text
  if (!text) return []
  const parts = text.split(/(?<=[,\.;:!?])\s+/).filter(Boolean)
  if (parts.length >= 2) return parts
  const words = text.split(/\s+/)
  const mid = Math.ceil(words.length / 2)
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')].filter(Boolean)
})
function tapPhrase(i) {
  if (phrasePool.value[i].used) return
  const chunk = phrasePool.value[i].chunk
  phrasePool.value = phrasePool.value.map((item, idx) => idx === i ? { ...item, used: true } : item)
  phraseBuilt.value = [...phraseBuilt.value, chunk]
}
function checkPhrase() {
  correct.value = phraseBuilt.value.join(' ') === phraseChunks.value.join(' ')
  feedback.value = true
}

// ─── FILL BLANKS ──────────────────────────────────────────
const fillAnswers = ref({})
const fillBlanks = computed(() => {
  if (step.value !== 'fill-blanks') return []
  const words = rawWords.value
  const count = Math.max(1, Math.floor(words.length * 0.4))
  const indices = new Set()
  let s = props.verse.ref.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  while (indices.size < count) { s = (s * 1664525 + 1013904223) >>> 0; indices.add(s % words.length) }
  return [...indices].sort((a, b) => a - b)
})
function checkFill() {
  correct.value = fillBlanks.value.every(i => cleanToken(fillAnswers.value[i] ?? '') === cleanToken(rawWords.value[i]))
  feedback.value = true
}

// ─── MISSING WORD ─────────────────────────────────────────
const missingChoices = ref([])
const missingIdx = computed(() => {
  const words = rawWords.value
  const candidates = words.filter(w => cleanToken(w).length >= 2)
  if (candidates.length === 0) return 0
  const s = props.verse.ref.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const chosen = candidates[s % candidates.length]
  return words.indexOf(chosen)
})
const missingWord = computed(() => rawWords.value[missingIdx.value] ?? '')
const gappedText = computed(() => rawWords.value.map((w, i) => i === missingIdx.value ? '[?]' : w).join(' '))
function pickMissingWord(word) {
  if (feedback.value) return
  selectedChoice.value = word
  correct.value = cleanToken(word) === cleanToken(missingWord.value)
  feedback.value = true
}

// ─── MULTIPLE CHOICE ──────────────────────────────────────
const mcOptions = ref([])

// ─── REFERENCE MATCH ──────────────────────────────────────
const refOptions = ref([])

// ─── VERSE MATCHER ────────────────────────────────────────
const verseMatcherOpts = ref([])
const firstHalf = computed(() => rawWords.value.slice(0, Math.floor(rawWords.value.length / 2)).join(' '))
function pickIndexChoice(idx, isCorrect) {
  if (feedback.value) return
  selectedChoice.value = idx
  correct.value = isCorrect
  feedback.value = true
}

// ─── RECALL ───────────────────────────────────────────────
function checkVerseRecall() {
  correct.value = similarity(answer.value, props.verse.text) >= 0.8
  recallDiff.value = buildDiff(props.verse.text, answer.value)
  feedback.value = true
}

// ─── FIRST LETTER ─────────────────────────────────────────
const revealedCount = ref(0)
const firstLetterWords = computed(() => rawWords.value.map((word, i) => ({
  word, shown: i < revealedCount.value, first: word[0] ?? '', mask: '_'.repeat(Math.max(0, word.length - 1)),
})))

// ─── Helpers ──────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

function normalize(s) {
  return s.trim().toLowerCase().replace(/[^a-záéíóúůýžšřčďťňě0-9\s]/g, '')
}

function buildDiff(target, attempt) {
  const tw = target.split(' ')
  const aw = attempt.trim().split(/\s+/).filter(Boolean)
  let html = ''
  const len = Math.max(tw.length, aw.length)
  for (let i = 0; i < len; i++) {
    const t = tw[i] || '', a = aw[i] || ''
    if (!a) html += `<span class="d-missing">[${t}]</span> `
    else if (normalize(a) === normalize(t)) html += `<span class="d-correct">${a}</span> `
    else if (!t) html += `<span class="d-extra">${a}</span> `
    else html += `<span class="d-wrong">${a}</span><span class="d-expected">(${t})</span> `
  }
  return html.trim()
}

function similarity(attempt, target) {
  const aw = normalize(attempt).split(/\s+/).filter(Boolean)
  const tw = normalize(target).split(/\s+/).filter(Boolean)
  if (tw.length === 0) return 1
  let matches = 0
  for (let i = 0; i < tw.length; i++) { if (aw[i] === tw[i]) matches++ }
  return matches / Math.max(aw.length, tw.length)
}

// ─── Step initialization ───────────────────────────────────
function initStep(s) {
  if (s === 'scramble') {
    scramblePool.value = shuffle(rawWords.value.map(word => ({ word, used: false })))
    scrambleBuilt.value = []
  }
  if (s === 'phrase-order') {
    phrasePool.value = shuffle(phraseChunks.value.map(chunk => ({ chunk, used: false })))
    phraseBuilt.value = []
  }
  if (s === 'missing-word') {
    const cw = rawWords.value[missingIdx.value]
    const others = [...new Set(rawWords.value.filter((_, i) => i !== missingIdx.value && cleanToken(rawWords.value[i]).length >= 2))]
    const d = shuffle(others).slice(0, 3)
    const pads = ['said', 'then', 'also']
    while (d.length < 3) d.push(pads[d.length] ?? 'and')
    missingChoices.value = shuffle([cw, ...d])
  }
  if (s === 'multiple-choice') {
    const correctOpt = { text: props.verse.text.slice(0, 100) + (props.verse.text.length > 100 ? '…' : ''), isCorrect: true }
    const d = []
    if (bible.value && props.verse.book) {
      const ch = getChapter(bible.value, props.verse.book, props.verse.chapter)
      for (let i = 0; i < ch.length && d.length < 2; i++) {
        if (i !== props.verse.verseIdx && ch[i]) d.push({ text: ch[i].slice(0, 100) + '…', isCorrect: false })
      }
    }
    while (d.length < 2) d.push({ text: '(Other verse)', isCorrect: false })
    mcOptions.value = shuffle([correctOpt, ...d])
  }
  if (s === 'ref-match') {
    const vi = props.verse.verseIdx
    const opts = [{ ref: props.verse.ref, isCorrect: true }]
    for (let delta = -2; delta <= 2 && opts.length < 4; delta++) {
      if (delta === 0) continue
      const nvi = vi + delta
      if (nvi >= 0) opts.push({ ref: `${props.verse.book} ${props.verse.chapter}:${nvi + 1}`, isCorrect: false })
    }
    refOptions.value = shuffle(opts)
  }
  if (s === 'verse-matcher') {
    const words = rawWords.value
    const mid = Math.floor(words.length / 2)
    const secondHalf = words.slice(mid).join(' ')
    const opts = [{ text: secondHalf.slice(0, 100), isCorrect: true }]
    if (bible.value && props.verse.book) {
      const ch = getChapter(bible.value, props.verse.book, props.verse.chapter)
      for (let i = 0; i < ch.length && opts.length < 3; i++) {
        if (i !== props.verse.verseIdx && ch[i]) {
          const ws = ch[i].split(/\s+/)
          const d = ws.slice(Math.floor(ws.length / 2)).join(' ')
          if (d !== secondHalf) opts.push({ text: d.slice(0, 100), isCorrect: false })
        }
      }
    }
    while (opts.length < 2) opts.push({ text: '(Not enough verses)', isCorrect: false })
    verseMatcherOpts.value = shuffle(opts)
  }
}

watch(stepIdx, (newIdx) => {
  answer.value = ''
  feedback.value = false
  correct.value = false
  selectedChoice.value = null
  recallDiff.value = ''
  revealedCount.value = 0
  tapped.value = []
  emojiRevealed.value = []
  flipped.value = false
  fillAnswers.value = {}
  initStep(steps.value[newIdx])
})

function next() {
  if (stepIdx.value < steps.value.length - 1) {
    stepIdx.value++
  } else {
    if (noteTimer) { clearTimeout(noteTimer); noteTimer = null }
    if (props.verse.book) setNote(props.verse.book, props.verse.chapter, props.verse.verseIdx, noteInput.value)
    emit('done', { note: noteInput.value })
  }
}

onMounted(() => {
  if (props.verse.book) {
    noteInput.value = getNote(props.verse.book, props.verse.chapter, props.verse.verseIdx) ?? ''
  }
})
</script>

<style scoped>
.drill {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 12px 16px 20px;
  gap: 14px;
  overflow-y: auto;
}

.step-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.step-label { font-weight: 700; color: #58cc02; }

.card {
  background: #1f2937;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ref {
  font-size: 13px;
  font-weight: 700;
  color: #58cc02;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.ref-xl { font-size: 28px; font-weight: 800; color: #58cc02; text-align: center; letter-spacing: normal; text-transform: none; }

.verse-text { font-size: 18px; line-height: 1.6; color: #f9fafb; }
.half-verse { font-size: 16px; color: #9ca3af; }
.prompt { font-size: 14px; color: #9ca3af; }
.hint { font-size: 13px; color: #6b7280; font-style: italic; }
.tap-hint { text-align: center; font-size: 14px; }

.textarea {
  background: #111827;
  border: 2px solid #374151;
  border-radius: 12px;
  color: #f9fafb;
  font-size: 16px;
  padding: 12px;
  resize: none;
  outline: none;
  width: 100%;
}
.textarea:focus { border-color: #58cc02; }

/* Context */
.context-list { display: flex; flex-direction: column; gap: 8px; }
.context-verse { display: flex; gap: 10px; font-size: 14px; color: #6b7280; padding: 6px 8px; border-radius: 8px; }
.context-verse.current { color: #f9fafb; background: #111827; border-left: 3px solid #58cc02; padding-left: 10px; }
.context-num { font-weight: 700; min-width: 32px; color: #4b5563; }
.context-verse.current .context-num { color: #58cc02; }

/* Flashcard */
.flashcard { cursor: pointer; min-height: 160px; justify-content: center; align-items: center; }
.palace-note-hint { font-size: 13px; color: #6b7280; border-top: 1px solid #374151; padding-top: 10px; }
.note-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #4b5563; margin-right: 4px; }

/* Word grid */
.word-grid { display: flex; flex-wrap: wrap; gap: 8px; line-height: 1.8; }
.word-token { font-size: 17px; cursor: default; padding: 2px 4px; border-radius: 6px; transition: background 0.15s; }
.word-token.has-emoji { cursor: pointer; font-size: 22px; }
.word-token.has-emoji:hover { background: #374151; }
.word-token.emoji-revealed { color: #58cc02; }

.word-btn {
  padding: 8px 12px;
  background: #111827;
  border: 2px solid #374151;
  border-radius: 10px;
  color: #f9fafb;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.word-btn:hover:not(:disabled) { border-color: #58cc02; }
.word-btn.word-selected { background: #14532d; border-color: #58cc02; }
.word-btn.word-used { background: #374151; color: #4b5563; cursor: default; }

/* Scramble */
.built-sentence {
  min-height: 48px;
  background: #111827;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 16px;
  color: #f9fafb;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.built-placeholder { color: #4b5563; font-style: italic; }
.built-word { color: #f9fafb; }
.built-chunk { background: #1f2937; border: 1px solid #374151; border-radius: 6px; padding: 4px 8px; font-size: 14px; }

.chunk-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.chunk-btn {
  padding: 10px 14px;
  background: #111827;
  border: 2px solid #374151;
  border-radius: 10px;
  color: #f9fafb;
  font-size: 14px;
  cursor: pointer;
  text-align: left;
  max-width: 100%;
}
.chunk-btn:hover:not(:disabled) { border-color: #58cc02; }
.chunk-btn.word-used { background: #374151; color: #4b5563; cursor: default; }

/* Fill blanks */
.fill-text { font-size: 17px; line-height: 2.4; color: #f9fafb; display: flex; flex-wrap: wrap; gap: 4px; align-items: baseline; }
.fill-word { display: inline; }
.fill-input {
  display: inline;
  background: #111827;
  border: 2px solid #374151;
  border-radius: 6px;
  color: #f9fafb;
  font-size: 16px;
  padding: 2px 6px;
  min-width: 3ch;
  outline: none;
  text-align: center;
}
.fill-input:focus { border-color: #58cc02; }
.fill-ok { border-color: #58cc02; color: #58cc02; }
.fill-bad { border-color: #ff4b4b; color: #ff4b4b; }

.gapped-text { font-size: 17px; line-height: 1.7; color: #f9fafb; }

/* Choices */
.choices { display: flex; flex-direction: column; gap: 8px; }
.choice-btn {
  padding: 12px 16px;
  background: #111827;
  border: 2px solid #374151;
  border-radius: 12px;
  color: #f9fafb;
  font-size: 15px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s;
}
.choice-btn:hover:not(:disabled) { border-color: #58cc02; }
.choice-btn.choice-text { font-size: 13px; line-height: 1.5; }
.choice-correct { border-color: #58cc02 !important; background: #14532d; color: #a3e635; }
.choice-wrong   { border-color: #ff4b4b !important; background: #450a0a; color: #fca5a5; }
.choice-dim     { opacity: 0.4; }

/* Note recall */
.palace-note-display {
  background: #111827;
  border-radius: 10px;
  padding: 12px;
  font-size: 15px;
  color: #d1d5db;
  font-style: italic;
}

/* First letter */
.letter-token { font-size: 17px; margin-right: 4px; color: #f9fafb; }
.letter-token strong { color: #58cc02; }
.reveal-counter { font-size: 12px; color: #6b7280; text-align: right; }

/* Feedback */
.feedback-correct { color: #58cc02; font-weight: 700; font-size: 15px; }
.feedback-wrong   { color: #ff4b4b; font-weight: 700; font-size: 15px; }

.diff-output { font-size: 15px; line-height: 1.8; color: #d1d5db; }
.diff-output :deep(.d-correct)  { color: #58cc02; }
.diff-output :deep(.d-wrong)    { color: #ff4b4b; text-decoration: line-through; }
.diff-output :deep(.d-missing)  { color: #f59e0b; }
.diff-output :deep(.d-extra)    { color: #9ca3af; font-style: italic; }
.diff-output :deep(.d-expected) { color: #6b7280; font-size: 12px; }

/* Buttons */
.btn {
  width: 100%;
  padding: 16px;
  background: #58cc02;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 4px 0 #3d8f00;
  transition: opacity 0.15s;
}
.btn:disabled { opacity: 0.4; cursor: default; box-shadow: none; }
.btn-secondary { background: #1f2937; border: 2px solid #374151; color: #9ca3af; box-shadow: none; }
.btn-row { display: flex; gap: 10px; }
.btn-row .btn { flex: 1; }
</style>
