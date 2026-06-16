import { mount } from '@vue/test-utils'
import { describe, test, expect } from 'vitest'
import CelebrationView from '../CelebrationView.vue'

describe('CelebrationView', () => {
  test('displays xp earned', () => {
    const wrapper = mount(CelebrationView, { props: { xp: 50, streak: 7 } })
    expect(wrapper.text()).toContain('50')
  })

  test('displays streak', () => {
    const wrapper = mount(CelebrationView, { props: { xp: 50, streak: 7 } })
    expect(wrapper.text()).toContain('7')
  })

  test('has a done button', () => {
    const wrapper = mount(CelebrationView, { props: { xp: 0, streak: 0 } })
    expect(wrapper.find('[data-testid="done"]').exists()).toBe(true)
  })

  test('emits done when button clicked', async () => {
    const wrapper = mount(CelebrationView, { props: { xp: 0, streak: 0 } })
    await wrapper.find('[data-testid="done"]').trigger('click')
    expect(wrapper.emitted('done')).toBeTruthy()
  })
})
