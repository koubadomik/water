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

// A second real paste. It differs from the first in ways that broke the parser:
// "Odpoved>" instead of "Odpoved:", the first answer sharing the heading's line,
// two numbered questions, and doubled spaces before some blanks.
const SAMPLE_TWO = `1. ① Jaký pokrm Ježíš dává v době konce (době Zjevení)? Uveďte odkaz na kapitolu. ② Co je víno smilstva, které dává ďábel? Uveďte odkaz na kapitolu. ③ Kdo jsou pastoři z organizací, kteří dávají takové pokrmy?

Odpověď> ① Zj 2, skrytá mana (Ježíšova krev a fyzické naplnění Zjevení)

② Zj 17 (Zj 18), hadova (Satanova) doktrína, víno z divoké révy, což je ovoce stromu poznání dobrého a zlého

③ Ježíš a jeho pastýř a ďábel a jeho pastor

2. Napište, co je v čase naplnění Nového zákona pokrm, který dává Bůh, pokrm, který dává ďábel a pokrm, který dává ten, kdo vítězí.

Odpověď > ①Boží pokrm: Zjevení, skrytá mana

② ďáblův pokrm: víno smilstva

③ Pokrm, který dává ten, kdo vítězí: pokrm v pravý čas

Zjevení 14:1-5

:1 A uviděl jsem, hle, Beránek stál na  (① hoře Sión ) a s ním (② sto čtyřicet čtyři tisíce ) těch, kdo mají na svých čelech napsáno  (③ jméno jeho ) i (④ jméno jeho Otce ).

:2 A uslyšel jsem hlas z nebe jako (⑤ zvuk mnohých vod ) a jako (⑥ zvuk velikého hromu ). A hlas, který jsem uslyšel, byl jako hlas harfeníků, hrajících na své harfy.

:3 Zpívali  (⑦ novou píseň ) (⑧ před trůnem, před těmi čtyřmi živými bytostmi a před staršími ). Nikdo se nemohl naučit té písni než těch sto čtyřicet čtyři tisíce (⑨ vykoupených ze země ).

:4 To jsou ti, kteří se neposkvrnili se (⑩ ženami ), jsou to panici. To jsou ti, kteří (⑪ následují Beránka, kamkoli jde ). Ti byli vykoupeni z lidí jako (⑫ prvotiny ) Bohu a Beránkovi.

:5 V jejich ústech  (⑬ nebyla nalezena lež ); jsou (⑭ bez úhony ).`

describe('parseStudySet on the "Odpoved>" paste', () => {
  const set = parseStudySet(SAMPLE_TWO)

  test('splits it into two question cards', () => {
    expect(set.cards).toHaveLength(2)
    expect(set.cards.map((c) => c.number)).toEqual([1, 2])
  })

  test('keeps the answer that shares the heading line', () => {
    expect(set.cards[0].answers[0]).toEqual({
      marker: '①',
      text: 'Zj 2, skrytá mana (Ježíšova krev a fyzické naplnění Zjevení)',
    })
  })

  test('reads all three answers of the first question', () => {
    expect(set.cards[0].answers.map((a) => a.marker)).toEqual(['①', '②', '③'])
    expect(set.cards[0].answers[2].text).toBe('Ježíš a jeho pastýř a ďábel a jeho pastor')
  })

  test('handles "Odpoved >" with a space and a marker with none after it', () => {
    expect(set.cards[1].answers[0]).toEqual({ marker: '①', text: 'Boží pokrm: Zjevení, skrytá mana' })
    expect(set.cards[1].answers).toHaveLength(3)
  })

  test('does not leak the second question into the first', () => {
    expect(set.cards[0].question).not.toContain('Napište')
    expect(set.cards[1].question).toContain('Napište')
  })

  test('does not leak the heading into any answer', () => {
    expect(JSON.stringify(set.cards)).not.toMatch(/Odpověď/)
  })

  test('reads the passage and all fourteen blanks', () => {
    expect(set.title).toBe('Zjevení 14:1-5')
    expect(set.passage.verses.map((v) => v.n)).toEqual([1, 2, 3, 4, 5])
    expect(set.blankCount).toBe(14)
  })

  test('collapses the doubled spaces around blanks', () => {
    const v1 = set.passage.verses.find((v) => v.n === 1)
    expect(v1.raw).not.toMatch(/ {2}/)
    expect(v1.segments[0].value).toBe('A uviděl jsem, hle, Beránek stál na ')
  })

  test('reads four blanks from a verse that has four', () => {
    const v1 = set.passage.verses.find((v) => v.n === 1)
    expect(v1.segments.filter((s) => s.type === 'blank').map((s) => s.value)).toEqual([
      'hoře Sión',
      'sto čtyřicet čtyři tisíce',
      'jméno jeho',
      'jméno jeho Otce',
    ])
  })

  test('keeps two adjacent blanks separate', () => {
    const v3 = set.passage.verses.find((v) => v.n === 3)
    const blanks = v3.segments.filter((s) => s.type === 'blank')
    expect(blanks[0].value).toBe('novou píseň')
    expect(blanks[1].value).toBe('před trůnem, před těmi čtyřmi živými bytostmi a před staršími')
  })
})

describe('parseStudySet accepts every heading form', () => {
  const forms = ['Odpověď:', 'Odpověď :', 'Odpověď>', 'Odpověď >', 'Odpověď', 'odpoved:', 'Answer:']

  test.each(forms)('%s on its own line', (heading) => {
    const set = parseStudySet(`1. Q ①?\n\n${heading}\n\n① Alpha\n\n② Beta`)
    expect(set.cards[0].answers).toEqual([
      { marker: '①', text: 'Alpha' },
      { marker: '②', text: 'Beta' },
    ])
  })

  test.each(forms)('%s with the first answer on the same line', (heading) => {
    const set = parseStudySet(`1. Q ①?\n\n${heading} ① Alpha\n\n② Beta`)
    expect(set.cards[0].answers).toEqual([
      { marker: '①', text: 'Alpha' },
      { marker: '②', text: 'Beta' },
    ])
  })

  test('a question opening with "Answer" is not mistaken for a heading', () => {
    const set = parseStudySet('1. Answer the following ① question?\n\nOdpověď:\n\n① Alpha')
    expect(set.cards[0].question).toBe('Answer the following ① question?')
    expect(set.cards[0].answers).toEqual([{ marker: '①', text: 'Alpha' }])
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
