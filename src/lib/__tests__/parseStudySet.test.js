import { describe, test, expect } from 'vitest'
import { parseStudySet, splitBlanks, markerNumber, markersIn } from '../parseStudySet.js'

// The exact paste from the source material, verbatim.
const SAMPLE = `1. Ve „svatyni stánku svědectví“ ve Zjevení 15:5, ① kdo svědčí, ② o čem svědčí ③ a jaké jsou dva důvody, proč mohou svědčit pouze oni?

Odpověď:

① Ti, kteří zvítězili

② Fyzické naplnění všech kapitol Zjevení

③ Protože byli svědky skutečností na místě událostí a bojovali proti ničitelům a zvítězili nad nimi.

Zj 15:1-8

:1 Tu jsem uviděl v nebi ( ① jiné veliké a podivuhodné znamení ): sedm andělů, kteří měli sedm ( ② posledních ran ), protože jimi je dovršen Boží hněv.

:2 Uviděl jsem něco jako ( ③ skelné moře smíšené s ohněm ) a ( ④ ty, kteří vycházeli vítězní ) z moci té šelmy, z moci jejího obrazu i z moci čísla jejího jména; stáli na skelném moři, měli Boží harfy

:3 a zpívali ( ⑤ píseň Božího otroka Mojžíše a píseňBeránkovu ) : “Veliké a podivuhodné jsou tvé skutky, Pane Bože Všemohoucí, spravedlivé a pravdivé jsou tvé cesty, Králi národů.

:4 Kdo by se nebál [tebe], Pane, a neoslavoval tvé jméno? Neboť ty jediný jsi svatý; ( ⑥ všechny národy přijdou a pokloní se před tebou ), protože tvé ( ⑦ spravedlivé soudy ) vyšly najevo.”

:5 Potom jsem uviděl: V nebi byla otevřena (⑧ svatyně stánku svědectví )

:6 a ze svatyně vyšlo sedm andělů, kteří měli těch sedm ran; byli oděni ( ⑨ lněným rouchem, čistým a zářivým ), a kolem prsou měli zlaté pásy.

:7 A jedna z těch čtyř živých bytostí dala sedmi andělům ( ⑩ sedm zlatých misek ) plných hněvu Boha, toho živého na věky věků.

:8 A svatyně byla naplněna dýmem z Boží slávy a z jeho moci; nikdo nemohl vstoupit do svatyně, dokud se nedokoná sedm ran těch sedmi andělů.`

describe('markers', () => {
  test('maps circled digits to their number', () => {
    expect(markerNumber('①')).toBe(1)
    expect(markerNumber('⑩')).toBe(10)
    expect(markerNumber('⑳')).toBe(20)
  })

  test('finds the distinct markers used in a question', () => {
    expect(markersIn('a ① b ② c ③?')).toEqual(['①', '②', '③'])
  })
})

describe('splitBlanks', () => {
  test('splits text around a ( ① … ) blank', () => {
    expect(splitBlanks('before ( ① hidden ) after')).toEqual([
      { type: 'text', value: 'before ' },
      { type: 'blank', marker: '①', value: 'hidden' },
      { type: 'text', value: ' after' },
    ])
  })

  test('handles a blank with no space after the paren', () => {
    const [blank] = splitBlanks('(⑧ svatyně stánku svědectví )')
    expect(blank).toEqual({ type: 'blank', marker: '⑧', value: 'svatyně stánku svědectví' })
  })

  test('keeps punctuation that immediately follows a blank', () => {
    const segs = splitBlanks('v nebi ( ① znamení ): sedm andělů')
    expect(segs[segs.length - 1]).toEqual({ type: 'text', value: ': sedm andělů' })
  })

  test('text with no blanks stays a single segment', () => {
    expect(splitBlanks('plain verse')).toEqual([{ type: 'text', value: 'plain verse' }])
  })
})

describe('parseStudySet on the real paste', () => {
  const set = parseStudySet(SAMPLE)

  test('titles the set from the passage reference', () => {
    expect(set.title).toBe('Zj 15:1-8')
  })

  test('extracts one question card', () => {
    expect(set.cards).toHaveLength(1)
    expect(set.cards[0].number).toBe(1)
  })

  test('keeps the question text with its inline markers', () => {
    expect(set.cards[0].question).toContain('Ve „svatyni stánku svědectví“ ve Zjevení 15:5')
    expect(set.cards[0].markers).toEqual(['①', '②', '③'])
  })

  test('pairs each answer to its marker', () => {
    expect(set.cards[0].answers).toEqual([
      { marker: '①', text: 'Ti, kteří zvítězili' },
      { marker: '②', text: 'Fyzické naplnění všech kapitol Zjevení' },
      {
        marker: '③',
        text: 'Protože byli svědky skutečností na místě událostí a bojovali proti ničitelům a zvítězili nad nimi.',
      },
    ])
  })

  test('does not leak the answer heading into the text', () => {
    expect(JSON.stringify(set.cards[0])).not.toMatch(/Odpověď/)
  })

  test('reads all eight verses in order', () => {
    expect(set.passage.verses.map((v) => v.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  test('finds all ten blanks across the passage', () => {
    expect(set.blankCount).toBe(10)
  })

  test('captures both blanks in a verse that has two', () => {
    const v1 = set.passage.verses.find((v) => v.n === 1)
    const blanks = v1.segments.filter((s) => s.type === 'blank')
    expect(blanks).toEqual([
      { type: 'blank', marker: '①', value: 'jiné veliké a podivuhodné znamení' },
      { type: 'blank', marker: '②', value: 'posledních ran' },
    ])
  })

  test('a verse with no blanks still parses as text', () => {
    const v8 = set.passage.verses.find((v) => v.n === 8)
    expect(v8.segments.every((s) => s.type === 'text')).toBe(true)
    expect(v8.raw).toContain('dýmem z Boží slávy')
  })
})

describe('parseStudySet edge cases', () => {
  test('accepts a paste with questions only', () => {
    const set = parseStudySet('1. Who?\n\nOdpověď:\n\n① Someone')
    expect(set.passage).toBeNull()
    expect(set.cards[0].answers[0].text).toBe('Someone')
    expect(set.title).toBe('Who?')
  })

  test('accepts a paste with a passage only', () => {
    const set = parseStudySet('Zj 15:1-8\n\n:1 A verse with ( ① a blank ).')
    expect(set.cards).toHaveLength(0)
    expect(set.blankCount).toBe(1)
  })

  test('handles several numbered questions in one paste', () => {
    const set = parseStudySet(
      '1. First ① one?\n\nOdpověď:\n\n① Alpha\n\n2. Second ① two?\n\nOdpověď:\n\n① Beta',
    )
    expect(set.cards).toHaveLength(2)
    expect(set.cards.map((c) => c.number)).toEqual([1, 2])
    expect(set.cards[1].answers[0].text).toBe('Beta')
  })

  test('joins an answer that wraps onto the next line', () => {
    const set = parseStudySet('1. Q?\n\nOdpověď:\n\n① first part\nsecond part')
    expect(set.cards[0].answers[0].text).toBe('first part second part')
  })

  test('joins a verse that wraps onto the next line', () => {
    const set = parseStudySet('Ref 1\n\n:1 start of verse\ncontinued here')
    expect(set.passage.verses[0].raw).toBe('start of verse continued here')
  })

  test('empty input does not throw', () => {
    const set = parseStudySet('')
    expect(set.cards).toEqual([])
    expect(set.passage).toBeNull()
  })
})
