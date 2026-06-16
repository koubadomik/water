import { mount } from '@vue/test-utils'
import { describe, test, expect } from 'vitest'
import NewVerseDrillView from '../NewVerseDrillView.vue'

const verse = { ref: 'John 3:16', text: 'For God so loved the world', note: 'Heart globe' }

describe('NewVerseDrillView', () => {
  test('shows verse text in first step', () => {
    const wrapper = mount(NewVerseDrillView, { props: { verse } })
    expect(wrapper.text()).toContain('For God so loved the world')
  })

  test('shows step indicator', () => {
    const wrapper = mount(NewVerseDrillView, { props: { verse } })
    expect(wrapper.find('[data-testid="step-indicator"]').exists()).toBe(true)
  })

  test('has a continue button on first step', () => {
    const wrapper = mount(NewVerseDrillView, { props: { verse } })
    expect(wrapper.find('[data-testid="continue"]').exists()).toBe(true)
  })

  test('step indicator advances after continue', async () => {
    const wrapper = mount(NewVerseDrillView, { props: { verse } })
    const before = wrapper.find('[data-testid="step-indicator"]').text()
    await wrapper.find('[data-testid="continue"]').trigger('click')
    const after = wrapper.find('[data-testid="step-indicator"]').text()
    expect(after).not.toBe(before)
  })

  test('emits done after completing all 7 steps', async () => {
    const wrapper = mount(NewVerseDrillView, { props: { verse } })
    let clicks = 0
    while (!wrapper.emitted('done') && clicks < 30) {
      const ta = wrapper.find('textarea')
      if (ta.exists()) await ta.setValue('test answer')
      const inp = wrapper.find('input[type="text"]')
      if (inp.exists()) await inp.setValue('world')
      const btn = wrapper.find('[data-testid="continue"]')
      if (btn.exists()) await btn.trigger('click')
      clicks++
    }
    expect(wrapper.emitted('done')).toBeTruthy()
  })
})
