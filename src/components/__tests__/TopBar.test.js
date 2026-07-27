import { mount } from '@vue/test-utils'
import { describe, test, expect } from 'vitest'
import TopBar from '../TopBar.vue'

describe('TopBar', () => {
  test('shows the app name', () => {
    const wrapper = mount(TopBar)
    expect(wrapper.text()).toContain('VerseMaster')
  })
})
