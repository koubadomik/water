import { resolveReference } from './reference.js'

// Shared search primitive for the dedicated Search view and any future Bible
// browser search. A valid reference returns its verses directly; otherwise we
// search the verse text and canonical reference.
export function searchBible(bible, input, limit = 60) {
  const query = String(input ?? '').trim()
  if (!bible || query.length < 2) return []

  const reference = resolveReference(bible, query)
  if (reference.ok) return reference.verses

  const wanted = query.toLocaleLowerCase()
  const results = []
  for (const [book, data] of Object.entries(bible)) {
    for (let chapterIndex = 0; chapterIndex < (data.chapters?.length ?? 0); chapterIndex += 1) {
      for (let verseIdx = 0; verseIdx < data.chapters[chapterIndex].length; verseIdx += 1) {
        const text = data.chapters[chapterIndex][verseIdx]
        const ref = `${book} ${chapterIndex + 1}:${verseIdx + 1}`
        if (text.toLocaleLowerCase().includes(wanted) || ref.toLocaleLowerCase().includes(wanted)) {
          results.push({ ref, text, book, chapter: chapterIndex + 1, verseIdx, verseNum: verseIdx + 1 })
          if (results.length === limit) return results
        }
      }
    }
  }
  return results
}

// Search results render Bible text, so escape every non-matching segment
// before wrapping the actual match. This keeps highlighting safe even when a
// translation contains characters that HTML would otherwise interpret.
export function highlightSearchMatch(text, input) {
  const source = String(text ?? '')
  const query = String(input ?? '').trim()
  if (query.length < 2) return escapeHtml(source)

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const matcher = new RegExp(escapedQuery, 'gi')
  let output = ''
  let cursor = 0
  for (const match of source.matchAll(matcher)) {
    output += escapeHtml(source.slice(cursor, match.index))
    output += `<mark>${escapeHtml(match[0])}</mark>`
    cursor = match.index + match[0].length
  }
  return output + escapeHtml(source.slice(cursor))
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character])
}
