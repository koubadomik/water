import { describe, expect, test } from 'vitest'
import { highlightSearchMatch, searchBible } from '../bibleSearch.js'

const bible = {
  Gn: { chapters: [['Na počátku Bůh stvořil nebe a zemi.', 'Země byla pustá.']] },
  Zj: { chapters: [['Zjevení Ježíše Krista.', 'Blaze tomu, kdo čte.']] },
}

describe('searchBible', () => {
  test('resolves a full book name and chapter', () => {
    expect(searchBible(bible, 'Genesis 1').map((verse) => verse.ref)).toEqual(['Gn 1:1', 'Gn 1:2'])
  })

  test('finds text across verses', () => {
    expect(searchBible(bible, 'Blaze').map((verse) => verse.ref)).toEqual(['Zj 1:2'])
  })

  test('highlights text matches without treating verse text as HTML', () => {
    expect(highlightSearchMatch('Blaze <všem>', 'blaze')).toBe('<mark>Blaze</mark> &lt;všem&gt;')
  })
})
