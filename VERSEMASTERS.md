# VerseMaster — Product Documentation

> *A Bible verse memorization app that combines the Memory Palace technique, emoji-based symbolic mnemonics, and a Duolingo-style spaced path to help you deeply internalize scripture — not just recognize it.*

---

## Who it's for

Built for personal use, but designed generically enough for any serious Bible memorizer. The built-in emoji dictionary is Czech-heavy (Czech Bible translation), but the architecture supports any language.

---

## What "mastered" means

A verse is mastered when you can do all three:

- **A — Type it perfectly from memory** with no hints
- **B — Recall it when you see the reference** (e.g. "John 3:16")
- **C — Know its context** — what comes before and after it in the chapter

The app's session flow trains all three deliberately and in order.

---

## Core concept: Memory Palace

Each verse gets a **palace note** — a vivid, concrete scene or location in an imagined memory palace. You place each verse in a specific "room." When you later try to recall the verse, you mentally walk into that room and read the scene.

The Symbolic Language dictionary adds a second layer: individual words or phrases get assigned emoji icons as visual anchors within that scene.

These two tools (palace notes + symbolic dictionary) are the foundation everything else builds on.

---

## App structure — four tabs

| Tab | Purpose |
|---|---|
| **Home** | Active learning path, session entry point, goal setup |
| **Palace** | Bible browser, chapter/verse viewer, palace note vault |
| **Symbols** | Emoji symbol dictionary builder |
| **More** | Stats, history, settings, ByHeart/Drill (links to original app) |

---

## Daily rhythm

At least one session per day. Multiple sessions per day are supported (like Duolingo). The streak tracks daily activity. The weekly calendar shows Mon–Sun completion dots with day labels.

---

## Session flow

Every session has four phases, in this order:

```
1. Palace Walk   (skippable)
2. Random Review
3. New Verse Drill
4. Celebration
```

### 1. Palace Walk
Browse through all previously completed verses in the current path. Each card shows the verse text and your palace note. Builds context and activates memory before drilling. **Skippable** via the Skip button.

### 2. Random Review
Tests 1–2 previously completed verses from the current path. Occasionally (roughly 1-in-5 chance) inserts a **wildcard** — a random verse from your full training history, to prevent long-term forgetting.

The exercise format: show the reference → user types the verse from memory → word-level diff is shown.

### 3. New Verse Drill
The main learning event. See below.

### 4. Celebration
XP earned, streak count, confetti. Then back to the path map.

---

## New Verse Drill — step structure

Each drill on a path node follows a **fixed phase sequence**. Within each phase there is one **primary exercise** (always shown) and one **bonus exercise** (randomly drawn from a pool, shown sometimes).

This means a drill is 5–10 steps depending on which bonuses appear.

### Phase 0 — Anchor (always first)
**Primary:** Palace Note  
Show the palace note for this verse. If no note has been written yet, the field is blank and the user can write one now. This step fires the memory palace association before any testing begins.

### Phase 1 — Exposure
**Primary:** Read  
Show the verse in full. No interaction required — just read it.

**Bonus pool:** Context Browser, Flashcard (shows reference → tap to flip to text + note)

### Phase 2 — Symbolic
**Primary:** Emoji Reveal  
The verse is displayed with words that have emoji mappings shown as icons. The user taps each emoji to reveal the word beneath it. Builds the emoji→word association.

**Bonus pool:** Keyword Focus (tap the most important words in the verse)

### Phase 3 — Reconstruction
**Primary:** Word Scramble  
All words of the verse are shuffled. The user taps them in the correct order.

**Bonus pool:** Phrase Order (chunks separated by punctuation, reassemble them), Fill in the Blanks (inline inputs for ~40% of words)

### Phase 4 — Recognition
**Primary:** Missing Word  
The verse is shown with one word replaced by [?]. The user picks the correct word from 4 choices.

**Bonus pool:** Multiple Choice (pick correct verse text for this reference from 3 options), Reference Match (shown the verse text, pick the correct reference), Verse Matcher (shown first half, pick correct second half)

### Phase 5 — Free Recall
**Primary:** Full Recall  
Blank text area. The user types the full verse from memory. Word-level diff is shown after submitting.

**Bonus pool:** Note Recall (shown your palace note, type the verse), First Letter Reveal (each word shown as first letter + underscores, reveal one word at a time), Dictation (speak/type the verse)

> **Removed:** Spot Error — removed entirely from the exercise pool.

---

## Difficulty progression across repetitions

Each verse is drilled **3 times** (intensity is hardcoded to 3×, not configurable by the user). The bonus pool changes each repetition:

| Repetition | Bonus pool difficulty |
|---|---|
| 1st (intro) | Easy: Flashcard, Multiple Choice, Context Browser |
| 2nd (practice) | Medium: Phrase Order, Fill Blanks, Reference Match, Verse Matcher |
| 3rd (mastery) | Hard: Note Recall, Dictation, First Letter Reveal |

---

## The path system

### Setting a goal
On first launch (and whenever the current path is finished), the user sets a goal:

1. Pick a **verse range** — book, chapter, start verse, end verse (cascading dropdowns, populated from Bible data)
2. Tap **Generate Path**

The app creates a path of nodes: each verse × 3 repetitions, in order. The path is visualized as a Duolingo-style zigzag map with circular nodes.

### Path node states
- **Locked** — not yet reached
- **Active** — current node (pulsing, larger)
- **Completed** — drilled (darker green)

Completing one node unlocks the next. Nodes can be reordered, deleted, or skipped individually.

### End of path — Final Mastery Test
When all nodes are completed, a **Final Mastery Test** begins:

1. Each verse in the path is shown as a reference
2. The user types the full verse from memory (Full Recall format)
3. The diff is shown
4. The user **self-assesses**: "I got it" or "Needs more work"

Verses marked "needs more work" re-enter the path at a new repetition (intensity+1 effectively). After the test, the user chooses:

- **Set a new goal** — pick a new verse range
- **Extend this path** — add the failed verses back for more drilling

---

## Memory Palace tab

The Palace tab is the **central note vault** for all verses.

### Features
- **Chapter bulk view** — select book → chapter → see all verses at once, each with its text and a note textarea
- **Book search** — filter the book list by typing
- **Save All** button — saves all notes in the chapter at once; notes also auto-save on blur
- **Individual verse detail** — accessible via search results or "Detail →" from chapter view
- **‹/› navigation** — step through verses in a chapter
- **Full-text search** — search across the entire Bible (capped at 60 results), results show highlighted matches
- **📌 indicator** on verses that have notes

### Relationship to the drill
Palace notes are written in two places:
1. **Directly in the Palace tab** — browse to a verse, type a note
2. **During a session's Phase 0 (Anchor step)** — the palace note for the current verse is shown and editable

Both write to the same storage (`memoryPalaceNotes` in localStorage, keyed `{book}_{chapter-1}` with 0-based chapter index).

---

## Symbolic Language tab

A **standalone dictionary builder**, decoupled from the session flow. The drill's Symbolic step reads from this dictionary — the two are linked only by shared storage.

### How it works
1. Select a verse from your active path
2. Tap words to build a phrase (adjacent-only selection)
3. Type or paste an emoji in the input field, or type `:query` for autocomplete from the built-in dictionary
4. Tap Save — the phrase → emoji mapping is stored

### Multi-word phrases
You can select adjacent words to form a phrase (e.g. "beránek boží") and assign one emoji to the whole phrase. The phrase is stored as a single key; the Symbolic step renders the emoji above the first word of the phrase.

### Built-in dictionary
A built-in Czech Bible emoji dictionary (~120 entries) provides defaults for common words. These appear automatically in the Symbolic step even without custom assignments. The dictionary is viewable via the collapsible "Built-in dictionary" section.

### Usage search
The 🔍 button (shown when words are selected) opens a modal to search all Bible verses containing the selected phrase — useful for deciding whether a symbol is worth adding to the dictionary.

---

## History

Accessible from the More tab:

- **Full path history** — list of all verse ranges ever trained, with dates
- **Re-run any past path** — tap any past path to restart its sessions
- **Per-step replay** — drill any individual step from a past path

---

## First launch

1. User sees the goal setup screen (verse range picker)
2. Taps "Generate Path"
3. First session begins immediately — no intro screens

No intensity picker, no onboarding carousel.

---

## XP and streak

- **Streak** — consecutive days with at least one completed session. Shown in the top bar (🔥 N).
- **XP** — earned per session completion. Shown in the top bar (⚡ N). Used for a level display in the More tab (every 100 XP = 1 level). No gameplay effect beyond display.
- **Weekly calendar** — 7 dots (Mon–Sun) in the top bar, each showing its day initial. Green = session completed that day.

---

## Data storage

All data is in `localStorage`. No server, no account.

| Key | Contents |
|---|---|
| `bibleJSON` | Full Bible JSON cache (fetched from GitHub on first load) |
| `verseList_v1` | Active path: array of `{ref, text, book, chapter, verseIdx, drilledAt}` |
| `memoryPalaceNotes` | `{[book_ch]: {[verseIdx]: string}}` |
| `userCustomEmojis` | `{[phrase]: emoji}` |
| `dailyRoutineData_v2` | `{streak, lastDate, weeklyProgress, xp, totalSessions}` |
| `goalMeta` | `{book, chapter, startVerse, endVerse, label}` |
| `lastTab` | Last active tab name |

---

## Technical stack (new version)

- **Vue 3 + Vite** — component-based SPA
- **No router** — tab switching via `v-if` in App.vue
- **No state management library** — localStorage singleton composables (`useStorage`, `useVerseList`, `usePalaceNotes`, `useProgress`, `useSession`)
- **Vitest + @vue/test-utils** — unit tests
- **GitHub Pages** — deployed at `/water/next/`, original app stays at `/water/`
- **PWA** — manifest + iOS meta tags, no service worker

### Bible data
Fetched from `https://raw.githubusercontent.com/koubadomik/water/main/resources/bible.json` on startup. Falls back to `localStorage['bibleJSON']` cache. Falls back to file upload UI.

Structure: `bible[bookKey].chapters[chapterIndex][verseIndex]` → string

---

## What the original app has that the new one currently doesn't

- ByHeart mode (word-blanking with audio/karaoke) — linked to original app via "Opens in original app ↗"
- Drill mode (free-form typing with Levenshtein diff) — linked to original app
- Final Mastery Test — not yet implemented
- History view — not yet implemented
- Bonus exercises in the drill (only primaries currently run) — not yet implemented
- Difficulty progression per repetition — not yet implemented
- End-of-path flow — not yet implemented
