// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, test, expect, beforeEach, vi } from 'vitest'
import QuestionTrainer from '../study/QuestionTrainer.vue'
import ClozeTrainer from '../study/ClozeTrainer.vue'
import { parseStudySet } from '../../lib/parseStudySet.js'

beforeEach(() => localStorage.clear())

const SAMPLE = `1. Ve „svatyni stánku svědectví“ ve Zjevení 15:5, ① kdo svědčí, ② o čem svědčí ③ a jaké jsou dva důvody?

Odpověď:

① Ti, kteří zvítězili

② Fyzické naplnění všech kapitol Zjevení

③ Protože byli svědky skutečností na místě událostí.

Zj 15:1-8

:1 Tu jsem uviděl v nebi ( ① jiné veliké a podivuhodné znamení ): sedm andělů, kteří měli sedm ( ② posledních ran ).

:2 Uviděl jsem něco jako ( ③ skelné moře smíšené s ohněm ) a stáli na skelném moři.`

const set = parseStudySet(SAMPLE)

describe('QuestionTrainer', () => {
  test('shows the question but hides every answer at first', () => {
    const w = mount(QuestionTrainer, { props: { cards: set.cards } })
    expect(w.find('[data-testid="question-text"]').text()).toContain('kdo svědčí')
    expect(w.findAll('[data-testid="answer-text"]')).toHaveLength(0)
    expect(w.findAll('[data-testid="reveal-answer"]')).toHaveLength(3)
  })

  test('revealing one answer leaves the others hidden', async () => {
    const w = mount(QuestionTrainer, { props: { cards: set.cards } })
    await w.findAll('[data-testid="reveal-answer"]')[0].trigger('click')
    const shown = w.findAll('[data-testid="answer-text"]')
    expect(shown).toHaveLength(1)
    expect(shown[0].text()).toBe('Ti, kteří zvítězili')
    expect(w.findAll('[data-testid="reveal-answer"]')).toHaveLength(2)
  })

  test('reveal all shows every answer', async () => {
    const w = mount(QuestionTrainer, { props: { cards: set.cards } })
    await w.findAll('button').find((b) => b.text() === 'Reveal all').trigger('click')
    expect(w.findAll('[data-testid="answer-text"]')).toHaveLength(3)
  })
})

describe('ClozeTrainer', () => {
  test('renders one blank per hidden phrase', () => {
    const w = mount(ClozeTrainer, { props: { passage: set.passage } })
    expect(w.findAll('[data-testid="cloze-blank"]')).toHaveLength(3)
    expect(w.text()).toContain('0 / 3')
  })

  test('does not leak a hidden phrase into the markup', () => {
    const w = mount(ClozeTrainer, { props: { passage: set.passage } })
    expect(w.text()).not.toContain('posledních ran')
    expect(w.text()).toContain('Tu jsem uviděl v nebi')
  })

  test('tapping a blank reveals it and advances progress', async () => {
    const w = mount(ClozeTrainer, { props: { passage: set.passage } })
    await w.findAll('[data-testid="cloze-blank"]')[0].trigger('click')
    expect(w.text()).toContain('jiné veliké a podivuhodné znamení')
    expect(w.text()).toContain('1 / 3')
  })

  test('type mode swaps blanks for inputs', async () => {
    const w = mount(ClozeTrainer, { props: { passage: set.passage } })
    await w.findAll('button').find((b) => b.text() === 'Type').trigger('click')
    expect(w.findAll('[data-testid="cloze-input"]')).toHaveLength(3)
    expect(w.findAll('[data-testid="cloze-blank"]')).toHaveLength(0)
  })

  test('a correct typed answer locks the blank in', async () => {
    const w = mount(ClozeTrainer, { props: { passage: set.passage } })
    await w.findAll('button').find((b) => b.text() === 'Type').trigger('click')
    const input = w.findAll('[data-testid="cloze-input"]')[1]
    await input.setValue('posledních ran')
    await input.trigger('keydown.enter')
    expect(w.text()).toContain('posledních ran')
    expect(w.text()).toContain('1 / 3')
  })

  test('a wrong typed answer does not reveal anything', async () => {
    vi.useFakeTimers()
    const w = mount(ClozeTrainer, { props: { passage: set.passage } })
    await w.findAll('button').find((b) => b.text() === 'Type').trigger('click')
    const input = w.findAll('[data-testid="cloze-input"]')[1]
    await input.setValue('úplně jiná odpověď')
    await input.trigger('keydown.enter')
    expect(w.text()).not.toContain('posledních ran')
    expect(w.text()).toContain('0 / 3')
    vi.useRealTimers()
  })

  test('accepts an answer typed with decomposed Czech diacritics', async () => {
    const w = mount(ClozeTrainer, { props: { passage: set.passage } })
    await w.findAll('button').find((b) => b.text() === 'Type').trigger('click')
    const input = w.findAll('[data-testid="cloze-input"]')[1]
    await input.setValue('posledních ran'.normalize('NFD'))
    await input.trigger('keydown.enter')
    expect(w.text()).toContain('1 / 3')
  })

  test('checks on blur so on-screen keyboards without Enter still work', async () => {
    const w = mount(ClozeTrainer, { props: { passage: set.passage } })
    await w.findAll('button').find((b) => b.text() === 'Type').trigger('click')
    const input = w.findAll('[data-testid="cloze-input"]')[1]
    await input.setValue('posledních ran')
    await input.trigger('blur')
    expect(w.text()).toContain('1 / 3')
  })

  test('leaving an untouched blank does not flag it wrong', async () => {
    const w = mount(ClozeTrainer, { props: { passage: set.passage } })
    await w.findAll('button').find((b) => b.text() === 'Type').trigger('click')
    const input = w.findAll('[data-testid="cloze-input"]')[1]
    await input.trigger('blur')
    expect(w.find('.cz-input-wrap.wrong').exists()).toBe(false)
    expect(w.text()).toContain('0 / 3')
  })

  test('reveal all fills every blank', async () => {
    const w = mount(ClozeTrainer, { props: { passage: set.passage } })
    await w.findAll('button').find((b) => b.text() === 'Reveal all').trigger('click')
    expect(w.text()).toContain('3 / 3')
    expect(w.findAll('[data-testid="cloze-blank"]')).toHaveLength(0)
  })

  test('reset hides everything again', async () => {
    const w = mount(ClozeTrainer, { props: { passage: set.passage } })
    await w.findAll('button').find((b) => b.text() === 'Reveal all').trigger('click')
    await w.findAll('button').find((b) => b.text() === 'Reset').trigger('click')
    expect(w.text()).toContain('0 / 3')
    expect(w.text()).not.toContain('posledních ran')
  })
})

describe('StudyView', () => {
  async function freshView() {
    vi.resetModules()
    const mod = await import('../../views/StudyView.vue')
    return mount(mod.default)
  }

  test('starts on the paste screen when nothing is saved', async () => {
    const w = await freshView()
    expect(w.find('[data-testid="paste-box"]').exists()).toBe(true)
  })

  test('previews what the parser found before saving', async () => {
    const w = await freshView()
    await w.find('[data-testid="paste-box"]').setValue(SAMPLE)
    const preview = w.find('[data-testid="paste-preview"]').text()
    expect(preview).toContain('1 question')
    expect(preview).toContain('3 blanks')
  })

  test('saving a set opens it for training', async () => {
    const w = await freshView()
    await w.find('[data-testid="paste-box"]').setValue(SAMPLE)
    await w.findAll('button').find((b) => b.text() === 'Save set').trigger('click')
    expect(w.find('[data-testid="question-text"]').exists()).toBe(true)
    expect(JSON.parse(localStorage.getItem('studySets_v1'))).toHaveLength(1)
  })

  test('a saved set survives a reload and lists its contents', async () => {
    const first = await freshView()
    await first.find('[data-testid="paste-box"]').setValue(SAMPLE)
    await first.findAll('button').find((b) => b.text() === 'Save set').trigger('click')

    const second = await freshView()
    expect(second.find('[data-testid="open-set"]').text()).toContain('Zj 15:1-8')
    expect(second.find('[data-testid="open-set"]').text()).toContain('3 blanks')
  })

  test('switching to the passage tab shows the cloze', async () => {
    const w = await freshView()
    await w.find('[data-testid="paste-box"]').setValue(SAMPLE)
    await w.findAll('button').find((b) => b.text() === 'Save set').trigger('click')
    await w.findAll('button').find((b) => b.text() === 'Passage').trigger('click')
    expect(w.findAll('[data-testid="cloze-blank"]')).toHaveLength(3)
  })
})
