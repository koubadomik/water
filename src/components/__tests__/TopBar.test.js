import { mount } from '@vue/test-utils'
import { describe, test, expect } from 'vitest'
import TopBar from '../TopBar.vue'

describe('TopBar', () => {
  test('displays streak count', () => {
    const wrapper = mount(TopBar, { props: { streak: 7, xp: 120 } })
    expect(wrapper.text()).toContain('7')
  })

  test('displays xp count', () => {
    const wrapper = mount(TopBar, { props: { streak: 7, xp: 120 } })
    expect(wrapper.text()).toContain('120')
  })

  test('shows streak icon', () => {
    const wrapper = mount(TopBar, { props: { streak: 0, xp: 0 } })
    expect(wrapper.find('[data-testid="streak"]').exists()).toBe(true)
  })

  test('shows xp icon', () => {
    const wrapper = mount(TopBar, { props: { streak: 0, xp: 0 } })
    expect(wrapper.find('[data-testid="xp"]').exists()).toBe(true)
  })
})
