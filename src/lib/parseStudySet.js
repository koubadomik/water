// Parses the study format you paste in:
//
//   1. Question text with ① inline ② markers ③ …?
//
//   Odpověď:
//
//   ① first answer
//   ② second answer
//
//   Zj 15:1-8
//
//   :1 Verse text with ( ① a hidden phrase ) inside it.
//   :2 Next verse.
//
// Everything is optional — paste only questions, only a passage, or both.

// ①–⑳
const MARKER_CLASS = '①-⑳'
const MARKER_LINE = new RegExp(`^\\s*([${MARKER_CLASS}])\\s*(.*)$`)
const BLANK = new RegExp(`\\(\\s*([${MARKER_CLASS}])\\s*([^)]*?)\\s*\\)`, 'g')
const VERSE_LINE = /^\s*:(\d+)\s*(.*)$/
const QUESTION_LINE = /^\s*(\d+)\s*[.)]\s*(.+)$/
// "Odpoved:", "Odpoved >", "Odpoved>", or the word alone — and the first answer
// often rides on the same line, so this matches a prefix. The delimiter is
// required unless the word ends the line, otherwise a question opening with
// "Answer the following" would read as a heading.
const ANSWER_HEADING = new RegExp(
  `^\\s*(?:odpověď|odpoved|answer)\\s*(?:[:>]+\\s*|$|(?=[${MARKER_CLASS}]))`,
  'i',
)

export function markerNumber(marker) {
  return marker.codePointAt(0) - 0x2460 + 1
}

export function markersIn(text) {
  return [...new Set(text.match(new RegExp(`[${MARKER_CLASS}]`, 'g')) ?? [])]
}

// Splits a verse into plain text and the ( ① … ) blanks, in order.
export function splitBlanks(text) {
  const segments = []
  let last = 0
  BLANK.lastIndex = 0
  let m
  while ((m = BLANK.exec(text)) !== null) {
    if (m.index > last) segments.push({ type: 'text', value: text.slice(last, m.index) })
    segments.push({ type: 'blank', marker: m[1], value: m[2] })
    last = m.index + m[0].length
  }
  if (last < text.length) segments.push({ type: 'text', value: text.slice(last) })
  return segments
}

export function parseStudySet(raw) {
  const lines = String(raw ?? '').replace(/\r\n?/g, '\n').split('\n')

  const firstVerseIdx = lines.findIndex((l) => VERSE_LINE.test(l))
  const hasPassage = firstVerseIdx !== -1

  // The passage reference is the last non-empty line above the first verse.
  let refIdx = -1
  if (hasPassage) {
    for (let i = firstVerseIdx - 1; i >= 0; i--) {
      if (lines[i].trim()) {
        refIdx = i
        break
      }
    }
  }

  const qaLines = hasPassage ? lines.slice(0, refIdx === -1 ? firstVerseIdx : refIdx) : lines
  const cards = parseCards(qaLines)
  const passage = hasPassage
    ? { ref: (refIdx === -1 ? '' : lines[refIdx].trim()), verses: parseVerses(lines.slice(firstVerseIdx)) }
    : null

  const blankCount = passage
    ? passage.verses.reduce((n, v) => n + v.segments.filter((s) => s.type === 'blank').length, 0)
    : 0

  return {
    title: buildTitle(passage, cards),
    cards,
    passage,
    blankCount,
  }
}

function parseCards(lines) {
  const cards = []
  let current = null
  let mode = 'question'

  const push = () => {
    if (!current) return
    const question = current.question.join(' ').replace(/\s+/g, ' ').trim()
    if (question || current.answers.length) {
      cards.push({
        id: `${cards.length + 1}`,
        number: current.number,
        question,
        markers: markersIn(question),
        answers: current.answers.map((a) => ({ marker: a.marker, text: a.text.join(' ').replace(/\s+/g, ' ').trim() })),
      })
    }
    current = null
  }

  for (const line of lines) {
    let text = line.trim()
    if (!text) continue

    const heading = text.match(ANSWER_HEADING)
    if (heading) {
      mode = 'answers'
      text = text.slice(heading[0].length).trim()
      if (!text) continue // heading stood alone; the answers follow below
    }

    const numbered = text.match(QUESTION_LINE)
    // A "1." line opens a new card once the previous one has answers, or when
    // its number differs — a question's own wrapped lines never do either.
    if (
      numbered &&
      (mode === 'answers' || !current || current.answers.length > 0 || Number(numbered[1]) !== current.number)
    ) {
      push()
      current = { number: Number(numbered[1]), question: [numbered[2]], answers: [] }
      mode = 'question'
      continue
    }

    if (!current) current = { number: cards.length + 1, question: [], answers: [] }

    const answer = text.match(MARKER_LINE)
    if (mode === 'answers' && answer) {
      current.answers.push({ marker: answer[1], text: [answer[2]] })
      continue
    }

    if (mode === 'answers') {
      // Continuation of the previous answer.
      if (current.answers.length) current.answers[current.answers.length - 1].text.push(text)
      continue
    }

    current.question.push(text)
  }

  push()
  return cards
}

function parseVerses(lines) {
  const verses = []
  for (const line of lines) {
    const text = line.trim()
    if (!text) continue
    const m = text.match(VERSE_LINE)
    if (m) {
      verses.push({ n: Number(m[1]), raw: m[2] })
    } else if (verses.length) {
      // Wrapped line — belongs to the verse above it.
      verses[verses.length - 1].raw += ' ' + text
    }
  }
  return verses.map((v) => {
    const raw = v.raw.replace(/\s+/g, ' ').trim()
    return { n: v.n, raw, segments: splitBlanks(raw) }
  })
}

function buildTitle(passage, cards) {
  if (passage?.ref) return passage.ref
  if (cards.length) return cards[0].question.slice(0, 60)
  return 'Untitled set'
}
