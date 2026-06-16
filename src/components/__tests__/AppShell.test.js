import { mount } from '@vue/test-utils'
import { describe, test, expect } from 'vitest'
import AppShell from '../AppShell.vue'

describe('AppShell', () => {
  test('renders 4 bottom nav tabs', () => {
    const wrapper = mount(AppShell)
    const tabs = wrapper.findAll('[data-testid="nav-tab"]')
    expect(tabs).toHaveLength(4)
  })

  test('home tab is active by default', () => {
    const wrapper = mount(AppShell)
    const homeTab = wrapper.find('[data-tab-id="home"]')
    expect(homeTab.classes()).toContain('active')
  })
})
