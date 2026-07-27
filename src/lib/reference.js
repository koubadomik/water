// Resolving a typed reference like "Zj 14:1-5" against the Bible data.
//
// The data is keyed by Czech abbreviations (Gn, Ex, 1Kr … Zj), which is what
// you already type. Longest-prefix matching means the full name works too:
// "Zjevení" starts with the key "Zj".

const REF = /^\s*(.+?)\s+(\d+)(?:\s*[:.]\s*(\d+)(?:\s*[-–—]\s*(\d+))?)?\s*$/

// The Bible JSON uses Czech abbreviations. These aliases make common full
// names usable in search and set creation too.
const ALIASES = {
  Gn: ['genesis', '1 mojžíšova'], Nu: ['numeri', '4 mojžíšova'], Sd: ['soudců'], Rt: ['rút'],
  Z: ['žalmy', 'žalm'], Pis: ['píseň šalomounova'], Pl: ['pláč jeremjášův'],
  Zd: ['židům'], Ju: ['judův'], Zj: ['zjevení', 'zjevení janovo'],
}

function normalise(s) {
  return String(s ?? '').toLowerCase().replace(/\s+/g, '')
}

export function matchBook(bible, query) {
  if (!bible) return null
  const wanted = normalise(query)
  if (!wanted) return null

  // Longest key first, so "1J" wins over "J" for "1Jan".
  const keys = Object.keys(bible).sort((a, b) => b.length - a.length)

  const exact = keys.find((k) => normalise(k) === wanted)
  if (exact) return exact

  for (const [key, aliases] of Object.entries(ALIASES)) {
    if (keys.includes(key) && aliases.some((alias) => normalise(alias) === wanted)) return key
  }

  // A longer spelling is accepted as the full book name ("Zjevení" → "Zj"),
  // but only when it is clearly a name rather than a slip: one stray letter
  // after a valid key is a typo, and resolving it silently would be worse
  // than rejecting it.
  return keys.find((k) => wanted.startsWith(normalise(k)) && wanted.length - k.length >= 2) ?? null
}

export function parseReference(input) {
  const m = String(input ?? '').match(REF)
  if (!m) return null
  return {
    bookQuery: m[1].trim(),
    chapter: Number(m[2]),
    from: m[3] ? Number(m[3]) : null,
    to: m[4] ? Number(m[4]) : null,
  }
}

/**
 * @returns {{ ok: true, book, chapter, from, to, label, verses }}
 *        | {{ ok: false, error: string }}
 */
export function resolveReference(bible, input) {
  const text = String(input ?? '').trim()
  if (!text) return { ok: false, error: '' }

  const parsed = parseReference(text)
  if (!parsed) return { ok: false, error: 'Try something like “Zj 14:1-5”' }

  if (!bible) return { ok: false, error: 'Bible not loaded yet' }

  const book = matchBook(bible, parsed.bookQuery)
  if (!book) return { ok: false, error: `No book matches “${parsed.bookQuery}”` }

  const chapters = bible[book]?.chapters ?? []
  const chapter = chapters[parsed.chapter - 1]
  if (!chapter) {
    return { ok: false, error: `${book} has ${chapters.length} chapters` }
  }

  // No verse given means the whole chapter.
  const from = parsed.from ?? 1
  const to = parsed.to ?? parsed.from ?? chapter.length
  if (from < 1 || from > chapter.length) {
    return { ok: false, error: `${book} ${parsed.chapter} has ${chapter.length} verses` }
  }

  const last = Math.min(Math.max(to, from), chapter.length)
  const verses = []
  for (let v = from; v <= last; v++) {
    const textOfVerse = chapter[v - 1]
    if (!textOfVerse) continue
    verses.push({
      ref: `${book} ${parsed.chapter}:${v}`,
      text: textOfVerse,
      book,
      chapter: parsed.chapter,
      verseIdx: v - 1,
    })
  }

  if (!verses.length) return { ok: false, error: 'No verses in that range' }

  return {
    ok: true,
    book,
    chapter: parsed.chapter,
    from,
    to: last,
    label: last > from ? `${book} ${parsed.chapter}:${from}–${last}` : `${book} ${parsed.chapter}:${from}`,
    verses,
  }
}
