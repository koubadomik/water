<template>
  <div class="search-view">
    <template v-if="chapter">
      <header class="sv-head sv-head-row">
        <button class="sv-back" @click="chapter = null">← Results</button>
        <h2 class="sv-title">{{ chapter.book }} {{ chapter.number }}</h2>
      </header>
      <article class="sv-chapter prose">
        <p v-for="(text, index) in chapter.verses" :key="index" :class="['prose-verse', { hit: index === chapter.highlight } ]">
          <span class="prose-num">{{ index + 1 }}</span>{{ text }}
        </p>
      </article>
    </template>

    <template v-else>
      <header class="sv-head">
        <h2 class="sv-title">Search Bible</h2>
        <p class="sv-sub">Search words, references, or a full book name such as “Genesis 1”.</p>
      </header>

      <input v-model="query" class="input sv-input" data-testid="bible-search" type="search" placeholder="Search verses or reference…" autofocus />

      <p v-if="query.trim().length >= 2" class="sv-count">{{ results.length }} result{{ results.length === 1 ? '' : 's' }}</p>
      <p v-if="query.trim().length >= 2 && !results.length" class="sv-empty">No matches found.</p>

      <ul class="sv-list">
        <li v-for="result in results" :key="result.ref" class="sv-result">
          <p class="prose-ref">{{ result.ref }}</p>
          <p class="sv-text" v-html="highlightSearchMatch(result.text, query)" />
          <div class="sv-actions">
            <button class="sv-chapter-button" @click="openChapter(result)">Show chapter</button>
            <button
              class="sv-copy"
              data-testid="copy-verse"
              :aria-label="`Copy ${result.ref}`"
              :title="copiedRef === result.ref ? 'Copied' : 'Copy verse'"
              @click="copyVerse(result)"
            >
              <svg v-if="copiedRef !== result.ref" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <rect x="8" y="8" width="11" height="12" rx="2" />
                <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" />
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M5 12l4 4L19 6" />
              </svg>
            </button>
          </div>
        </li>
      </ul>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useBible, getChapter } from '../composables/useBible.js'
import { highlightSearchMatch, searchBible } from '../lib/bibleSearch.js'

const { bible } = useBible()
const query = ref('')
const chapter = ref(null)
const copiedRef = ref(null)
const results = computed(() => searchBible(bible.value, query.value))

function openChapter(result) {
  chapter.value = {
    book: result.book,
    number: result.chapter,
    verses: getChapter(bible.value, result.book, result.chapter),
    highlight: result.verseIdx,
  }
}

async function copyVerse(result) {
  const text = `${result.ref}\n${result.text}`
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.append(area)
    area.select()
    document.execCommand('copy')
    area.remove()
  }
  copiedRef.value = result.ref
  setTimeout(() => { if (copiedRef.value === result.ref) copiedRef.value = null }, 1400)
}
</script>

<style scoped>
.search-view { padding: var(--space-5) var(--space-4) var(--space-10); }
.sv-head { margin-bottom: var(--space-5); }
.sv-head-row { display: flex; align-items: center; gap: var(--space-3); }
.sv-title { font-size: var(--text-2xl); font-weight: 700; }
.sv-sub { margin-top: var(--space-1); color: var(--muted-foreground); font-size: var(--text-sm); }
.sv-input { width: 100%; margin-bottom: var(--space-3); }
.sv-count, .sv-empty { color: var(--muted-foreground); font-size: var(--text-sm); margin-bottom: var(--space-3); }
.sv-list { list-style: none; display: flex; flex-direction: column; gap: var(--space-3); }
.sv-result { border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--card); padding: var(--space-4); }
.sv-text { margin: var(--space-2) 0 var(--space-3); font-family: var(--font-reading); line-height: var(--leading-reading); }
.sv-text :deep(mark) { background: var(--warning-surface); color: var(--foreground); border-radius: 2px; padding: 0 1px; }
.sv-actions { display: flex; align-items: center; gap: var(--space-3); }
.sv-chapter-button, .sv-back { border: 0; background: transparent; color: var(--primary); font: inherit; font-size: var(--text-sm); font-weight: 600; cursor: pointer; padding: var(--space-1) 0; }
.sv-copy { display: grid; place-items: center; width: 32px; height: 32px; border: 0; border-radius: var(--radius-md); background: transparent; color: var(--muted-foreground); cursor: pointer; }
.sv-copy:hover { background: var(--muted); color: var(--foreground); }
.sv-copy svg { width: 17px; height: 17px; }
.sv-chapter { max-width: var(--measure); }
.sv-chapter .hit { background: var(--accent); border-radius: var(--radius-sm); margin-inline: calc(-1 * var(--space-2)); padding-inline: var(--space-2); }
</style>
