// Comparing what you typed against the hidden phrase. Diacritics are always
// significant in Czech; punctuation and casing can be made stricter for a
// full-recall exercise without changing the gentler blank drills.

export const defaultComparisonRules = Object.freeze({
  punctuation: 'ignore', // 'ignore' | 'all' | 'sentence-dots'
  caseSensitive: false,
})

export function normalizeAnswer(s, rules = defaultComparisonRules) {
  let value = String(s ?? '')
    // Czech typed with dead keys arrives decomposed (i + ́ ) while pasted
    // scripture is precomposed (í). Identical on screen, different strings —
    // without this every accented word reads as a mismatch.
    .normalize('NFC')

  if (!rules.caseSensitive) value = value.toLowerCase()

  if (rules.punctuation === 'ignore') {
    value = value.replace(/[„“”"'‘’`]/g, '').replace(/[.,;:!?()[\]{}–—-]/g, ' ')
  } else if (rules.punctuation === 'sentence-dots') {
    // Keep only full stops; commas, quotes, dashes and other marks do not
    // interrupt a recall attempt in this middle-ground mode.
    value = value.replace(/[„“”"'‘’`,;:!?()[\]{}–—-]/g, ' ')
  }

  return value.replace(/\s+/g, ' ').trim()
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

export function tolerance(expected, rules = defaultComparisonRules) {
  return Math.floor(normalizeAnswer(expected, rules).length / 12)
}

function punctuationShape(s, mode) {
  const value = String(s ?? '').normalize('NFC')
  if (mode === 'sentence-dots') return value.replace(/[^.]/g, '')
  if (mode === 'all') return value.replace(/[\p{L}\p{N}\s]/gu, '')
  return ''
}

function casingShape(s) {
  return String(s ?? '').normalize('NFC')
    .replace(/\p{Lu}/gu, 'U')
    .replace(/\p{Ll}/gu, 'l')
    .replace(/[^Ul]/g, '')
}

export function answersMatch(input, expected, rules = defaultComparisonRules) {
  // Do not let the normal typo allowance silently accept a missing full stop
  // or a changed capital when the learner explicitly asked to practise it.
  if (rules.punctuation !== 'ignore' && punctuationShape(input, rules.punctuation) !== punctuationShape(expected, rules.punctuation)) return false
  if (rules.caseSensitive && casingShape(input) !== casingShape(expected)) return false

  const a = normalizeAnswer(input, rules)
  const b = normalizeAnswer(expected, rules)
  if (!a || !b) return false
  if (a === b) return true
  return levenshtein(a, b) <= tolerance(expected, rules)
}
