import { mount } from '@vue/test-utils'
import { describe, test, expect } from 'vitest'
import AppShell from '../AppShell.vue'

describe('AppShell', () => {
  test('renders a tab for every section', () => {
    const wrapper = mount(AppShell)
    const ids = wrapper.findAll('[data-testid="nav-tab"]').map((t) => t.attributes('data-tab-id'))
    expect(ids).toEqual(['home', 'palace', 'new', 'more'])
  })

  test('home tab is active by default', () => {
    const wrapper = mount(AppShell)
    const homeTab = wrapper.find('[data-tab-id="home"]')
    expect(homeTab.classes()).toContain('active')
  })
})
