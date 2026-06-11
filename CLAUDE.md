# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

This is a static HTML/JS app with no build step or package manager. Open `index.html` directly in a browser, or serve it with any static file server:

```bash
npx serve .
# or
python3 -m http.server
```

## Architecture

VerseMaster is a single-page Bible memorization tool. All state is managed in `localStorage` and all UI is vanilla JavaScript — no frameworks, no bundler.

### Module structure

The app consists of three independently scoped JS files loaded by `index.html` in order:

| File | Responsibility |
|---|---|
| `script.js` | Core app shell: sidebar/menu routing (`switchApp`), Bible loading, the **ByHeart** mode (word-blanking exercise), **Drill mode** (full-verse typing with Levenshtein diff), and **Audio/karaoke** mode via `SpeechSynthesisUtterance` |
| `memoryPalace.js` | **Memory Palace** — browse Bible by book/chapter, attach per-verse notes, flashcard visual mode. Self-contained IIFE. Exposes `window.initMemoryPalace` |
| `dailyRoutine.js` | **Daily Routine**, **Symbolic Language** designer, streak tracking, emoji shortcode dictionary. Self-contained IIFE. Exposes `window.initDailyRoutine`, `window.initSymbolicLanguage`, `window.hideDailyRoutine` |

### Navigation / app switching

`switchApp(app)` in `script.js` is the single router. It shows/hides the relevant container div and calls the module's init function (`window.initMemoryPalace`, `window.initDailyRoutine`, etc.). The active app key is persisted to `localStorage` under `lastApp`.

### Bible data

`bible` is a global object (`window.bible`) populated by `loadBible()` in `script.js`. It is fetched from GitHub raw at startup, falls back to `localStorage['bibleJSON']`, then falls back to a file upload UI. The structure is:

```js
bible[bookKey].chapters[chapterIndex][verseIndex] // string
```

Both `memoryPalace.js` and `dailyRoutine.js` read the global `bible` directly — they do not load it themselves. Because the fetch is async, `memoryPalace.js` retries polling for up to 6 seconds before showing a manual retry button.

### localStorage keys

| Key | Owner | Contents |
|---|---|---|
| `lastVerse` | script.js | Last loaded verse array (JSON) |
| `lastApp` | script.js | Last active app name string |
| `bibleJSON` | script.js | Full Bible JSON cache |
| `customTexts` | script.js | User-saved custom texts `[{title, text}]` |
| `drillState` | script.js (Drill IIFE) | `{ref, index, verses, isAdvancing}` |
| `memoryPalaceNotes` | memoryPalace.js | `{[book_ch]: {[verseIdx]: string}}` |
| `dailyRoutineData_v2` | dailyRoutine.js | `{streak, lastDate, weeklyProgress, currentGoal, path, history}` |
| `userCustomEmojis` | dailyRoutine.js | `{[phrase]: emoji}` |

### ByHeart mode (script.js)

Words from the loaded verse(s) are tokenised into `words[]`. A random subset is selected as `blanks[]` based on the difficulty ratio (Easy=20% … Extreme=100%). The user types into a single shared input; Space/Enter locks the current blank and advances `currentIdx`. The Reveal button reveals blanks sequentially. Two modes toggle the bottom bar: input mode (text field) and audio/karaoke mode (SpeechSynthesis).

### Drill mode (script.js IIFE)

Completely self-contained IIFE at the bottom of `script.js`. Does not touch the main ByHeart state. Uses LCS (`_lcsIndices`) for word-level comparison and Levenshtein (`_levenshtein`) for character-level distance stats. The `_charDiffHtml` function produces inline diff HTML per word.

### Symbolic Language (dailyRoutine.js)

Lets users assign emoji to words or multi-word phrases. The phrase→emoji map is stored in `userCustomEmojis`. When rendering a verse in the symbol designer, a sliding-window scan finds the longest matching phrase at each position and floats its emoji above the word button.
