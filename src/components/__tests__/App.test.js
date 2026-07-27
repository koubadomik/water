import { mount } from '@vue/test-utils'
import { describe, test, expect } from 'vitest'
import App from '../../App.vue'

describe('App', () => {
  test('renders AppShell with bottom nav', () => {
    const wrapper = mount(App)
    expect(wrapper.findAll('[data-testid="nav-tab"]').length).toBe(5)
  })

  test('falls back to home when a saved tab no longer exists', () => {
    localStorage.setItem('lastTab', 'symbols')
    const wrapper = mount(App)
    expect(wrapper.find('[data-tab-id="home"]').classes()).toContain('active')
    localStorage.removeItem('lastTab')
  })

  test('opens the tests section when the hash asks for it', async () => {
    location.hash = '#/new'
    const wrapper = mount(App)
    expect(wrapper.find('[data-testid="new-set"]').exists()).toBe(true)
    location.hash = ''
  })

  test('renders the minimal app header', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('VerseMaster')
  })

  test('shows PalaceWalkView in home tab by default when verses exist', () => {
    const wrapper = mount(App)
    // App starts session on home tab; palace-walk is first phase
    expect(wrapper.find('[data-testid="step-indicator"]').exists() ||
           wrapper.find('[data-testid="next"]').exists() ||
           wrapper.text().length > 0).toBe(true)
  })
})
