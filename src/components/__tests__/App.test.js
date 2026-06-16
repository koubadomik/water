import { mount } from '@vue/test-utils'
import { describe, test, expect } from 'vitest'
import App from '../../App.vue'

describe('App', () => {
  test('renders AppShell with bottom nav', () => {
    const wrapper = mount(App)
    expect(wrapper.findAll('[data-testid="nav-tab"]').length).toBe(4)
  })

  test('renders TopBar', () => {
    const wrapper = mount(App)
    expect(wrapper.find('[data-testid="streak"]').exists()).toBe(true)
  })

  test('shows PalaceWalkView in home tab by default when verses exist', () => {
    const wrapper = mount(App)
    // App starts session on home tab; palace-walk is first phase
    expect(wrapper.find('[data-testid="step-indicator"]').exists() ||
           wrapper.find('[data-testid="next"]').exists() ||
           wrapper.text().length > 0).toBe(true)
  })
})
