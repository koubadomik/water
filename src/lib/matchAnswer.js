// Comparing what you typed against the hidden phrase. Punctuation and casing
// are ignored, diacritics are not — for Czech scripture the accents are part of
// knowing the text. One slip per ~12 characters is forgiven so a single typo in
// a long phrase doesn't read as a failure.

export function normalizeAnswer(s) {
  return String(s ?? '')
    // Czech typed with dead keys arrives decomposed (i + ́ ) while pasted
    // scripture is precomposed (í). Identical on screen, different strings —
    // without this every accented word reads as a mismatch.
    .normalize('NFC')
    .toLowerCase()
    .replace(/[„“”"'‘’`]/g, '')
    .replace(/[.,;:!?()[\]{}–—-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function levenshtein(a, b) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  const curr = new Array(b.length + 1)

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
    prev = [...curr]
  }
  return prev[b.length]
}

export function tolerance(expected) {
  return Math.floor(normalizeAnswer(expected).length / 12)
}

export function answersMatch(input, expected) {
  const a = normalizeAnswer(input)
  const b = normalizeAnswer(expected)
  if (!a || !b) return false
  if (a === b) return true
  return levenshtein(a, b) <= tolerance(expected)
}
