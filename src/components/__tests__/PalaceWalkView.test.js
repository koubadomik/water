import { mount } from '@vue/test-utils'
import { describe, test, expect } from 'vitest'
import PalaceWalkView from '../PalaceWalkView.vue'

const verses = [
  { ref: 'John 3:16', text: 'For God so loved the world', note: 'Picture a heart globe' },
  { ref: 'Psalm 23:1', text: 'The Lord is my shepherd',   note: 'Green pasture door' },
]

describe('PalaceWalkView', () => {
  test('renders first verse text', () => {
    const wrapper = mount(PalaceWalkView, { props: { verses } })
    expect(wrapper.text()).toContain('For God so loved the world')
  })

  test('renders first verse reference', () => {
    const wrapper = mount(PalaceWalkView, { props: { verses } })
    expect(wrapper.text()).toContain('John 3:16')
  })

  test('renders palace note for first verse', () => {
    const wrapper = mount(PalaceWalkView, { props: { verses } })
    expect(wrapper.text()).toContain('Picture a heart globe')
  })

  test('next button advances to second verse', async () => {
    const wrapper = mount(PalaceWalkView, { props: { verses } })
    await wrapper.find('[data-testid="next"]').trigger('click')
    expect(wrapper.text()).toContain('Psalm 23:1')
  })

  test('shows position indicator', () => {
    const wrapper = mount(PalaceWalkView, { props: { verses } })
    expect(wrapper.text()).toContain('1')
    expect(wrapper.text()).toContain('2')
  })

  test('emits done when next is clicked on last verse', async () => {
    const wrapper = mount(PalaceWalkView, { props: { verses } })
    await wrapper.find('[data-testid="next"]').trigger('click')
    await wrapper.find('[data-testid="next"]').trigger('click')
    expect(wrapper.emitted('done')).toBeTruthy()
  })
})
