// Word-level comparison between what you typed and the hidden phrase.
// Used when a blank is given up on: showing the right answer alone tells you
// nothing about where you went wrong, so the answer is annotated with which
// words you actually had, and your surplus words are reported back.

import { normalizeAnswer } from './matchAnswer.js'

function tokenize(s) {
  return String(s ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

// Longest common subsequence, returned as matched index pairs.
function lcsPairs(a, b) {
  const n = a.length
  const m = b.length
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const pairs = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      pairs.push([i, j])
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++
    } else {
      j++
    }
  }
  return pairs
}

/**
 * @returns {{
 *   words: {value: string, status: 'ok'|'missing'}[],
 *   extra: string[],
 *   correct: number,
 *   total: number,
 *   attempted: boolean,
 * }}
 */
export function diffWords(typed, expected) {
  const exp = tokenize(expected)
  const got = tokenize(typed)
  const attempted = got.length > 0

  if (!attempted) {
    return {
      words: exp.map((value) => ({ value, status: 'missing' })),
      extra: [],
      correct: 0,
      total: exp.length,
      attempted: false,
    }
  }

  const pairs = lcsPairs(exp.map(normalizeAnswer), got.map(normalizeAnswer))
  const matchedExp = new Set(pairs.map(([e]) => e))
  const matchedGot = new Set(pairs.map(([, g]) => g))

  return {
    words: exp.map((value, i) => ({ value, status: matchedExp.has(i) ? 'ok' : 'missing' })),
    extra: got.filter((_, i) => !matchedGot.has(i)),
    correct: matchedExp.size,
    total: exp.length,
    attempted: true,
  }
}
