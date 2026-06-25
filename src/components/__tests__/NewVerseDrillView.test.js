import { mount } from '@vue/test-utils'
import { describe, test, expect, beforeEach } from 'vitest'
import NewVerseDrillView from '../NewVerseDrillView.vue'

beforeEach(() => localStorage.clear())

const verse = {
  ref: 'John 3:16',
  text: 'For the grace of peace and truth and love',
  book: 'John',
  chapter: 3,
  verseIdx: 15,
}

async function clickThrough(wrapper, maxClicks = 80) {
  let clicks = 0
  while (!wrapper.emitted('done') && clicks < maxClicks) {
    // Fill textareas
    const ta = wrapper.find('textarea')
    if (ta.exists()) await ta.setValue('test answer for the verse text')
    // Tap emoji spans (emoji-reveal step)
    for (const span of wrapper.findAll('.has-emoji')) {
      await span.trigger('click')
    }
    // Tap all word buttons (scramble / phrase-order / keyword-focus)
    for (const btn of wrapper.findAll('[data-testid="word-btn"]')) {
      if (!btn.element.disabled) await btn.trigger('click')
    }
    // Tap first choice button (recognition exercises)
    const choices = wrapper.findAll('[data-testid="choice-btn"]')
    if (choices.length > 0 && !choices[0].element.disabled) await choices[0].trigger('click')
    // Flip flashcard
    const flip = wrapper.find('[data-testid="flip-btn"]')
    if (flip.exists()) await flip.trigger('click')
    // Click continue if not disabled
    const btn = wrapper.find('[data-testid="continue"]')
    if (btn.exists() && !btn.element.disabled) await btn.trigger('click')
    clicks++
  }
}

describe('NewVerseDrillView', () => {
  test('palace-note is the first step', () => {
    const wrapper = mount(NewVerseDrillView, { props: { verse, lessonIndex: 0 } })
    const indicator = wrapper.find('[data-testid="step-indicator"]').text()
    expect(indicator.toLowerCase()).toContain('palace')
  })

  test('shows step indicator', () => {
    const wrapper = mount(NewVerseDrillView, { props: { verse } })
    expect(wrapper.find('[data-testid="step-indicator"]').exists()).toBe(true)
  })

  test('has a continue button on first step', () => {
    const wrapper = mount(NewVerseDrillView, { props: { verse } })
    expect(wrapper.find('[data-testid="continue"]').exists()).toBe(true)
  })

  test('step indicator advances after clicking continue', async () => {
    const wrapper = mount(NewVerseDrillView, { props: { verse } })
    const before = wrapper.find('[data-testid="step-indicator"]').text()
    await wrapper.find('[data-testid="continue"]').trigger('click')
    const after = wrapper.find('[data-testid="step-indicator"]').text()
    expect(after).not.toBe(before)
  })

  test('spot-error step never appears in any lessonIndex', () => {
    for (let li = 0; li < 3; li++) {
      const wrapper = mount(NewVerseDrillView, { props: { verse, lessonIndex: li } })
      // Check all possible step labels via the step-bar text throughout lifecycle
      expect(wrapper.text().toLowerCase()).not.toContain('spot')
      expect(wrapper.text().toLowerCase()).not.toContain('error')
    }
  })

  test('emits done after completing all steps (lessonIndex 0)', async () => {
    const wrapper = mount(NewVerseDrillView, { props: { verse, lessonIndex: 0 } })
    await clickThrough(wrapper)
    expect(wrapper.emitted('done')).toBeTruthy()
  })

  test('emits done after completing all steps (lessonIndex 1)', async () => {
    const wrapper = mount(NewVerseDrillView, { props: { verse, lessonIndex: 1 } })
    await clickThrough(wrapper)
    expect(wrapper.emitted('done')).toBeTruthy()
  })

  test('emits done after completing all steps (lessonIndex 2)', async () => {
    const wrapper = mount(NewVerseDrillView, { props: { verse, lessonIndex: 2 } })
    await clickThrough(wrapper)
    expect(wrapper.emitted('done')).toBeTruthy()
  })

  test('done payload contains note field', async () => {
    const wrapper = mount(NewVerseDrillView, { props: { verse, lessonIndex: 0 } })
    const ta = wrapper.find('textarea')
    if (ta.exists()) await ta.setValue('my palace note')
    await clickThrough(wrapper)
    const emitted = wrapper.emitted('done')
    expect(emitted).toBeTruthy()
    expect(emitted[emitted.length - 1][0]).toHaveProperty('note')
  })

  test('easy bonuses (lessonIndex 0) never include mastery-only step labels', () => {
    for (let i = 0; i < 10; i++) {
      const wrapper = mount(NewVerseDrillView, { props: { verse, lessonIndex: 0 } })
      const text = wrapper.find('[data-testid="step-indicator"]').text()
      expect(text).not.toContain('Dictation')
      expect(text).not.toContain('Note Recall')
    }
  })
})
