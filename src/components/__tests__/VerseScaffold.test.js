import { mount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'
import VerseScaffold from '../study/VerseScaffold.vue'

const verse = { ref: 'John 3:16', text: 'For God so loved the world' }

describe('VerseScaffold', () => {
  test('lets a blank be revealed only when tapped', async () => {
    const wrapper = mount(VerseScaffold, { props: { verse, mode: 'blanks' } })
    const blank = wrapper.find('[data-testid="scaffold-blank"]')

    expect(blank.text()).toBe('Tap to reveal')
    await blank.trigger('click')
    expect(blank.text()).not.toBe('Tap to reveal')
  })

  test('writing into blanks gives no automatic correctness verdict', async () => {
    const wrapper = mount(VerseScaffold, { props: { verse, mode: 'blanks' } })
    await wrapper.findAll('.vs-mode')[1].trigger('click')
    const input = wrapper.find('[data-testid="scaffold-write"]')

    await input.setValue('something else')
    expect(wrapper.text()).not.toContain('Wrong')
    expect(wrapper.find('[data-testid="scaffold-continue"]').exists()).toBe(true)
  })

  test('offers a fresh blank pattern on request', async () => {
    const wrapper = mount(VerseScaffold, { props: { verse, mode: 'blanks' } })

    await wrapper.find('[data-testid="scaffold-blank"]').trigger('click')
    expect(wrapper.find('[data-testid="scaffold-blank"]').text()).not.toBe('Tap to reveal')

    await wrapper.find('[data-testid="randomize-blanks"]').trigger('click')
    expect(wrapper.find('[data-testid="scaffold-blank"]').text()).toBe('Tap to reveal')
  })

  test('first letters can reveal individual words', async () => {
    const wrapper = mount(VerseScaffold, { props: { verse, mode: 'initials' } })
    const first = wrapper.find('[data-testid="scaffold-initial"]')

    expect(first.text()).toBe('F··')
    await first.trigger('click')
    expect(first.text()).toContain('For')
  })

  test('can move to another exercise without entering full recall', async () => {
    const wrapper = mount(VerseScaffold, { props: { verse, mode: 'blanks' } })

    await wrapper.find('[data-testid="scaffold-next"]').trigger('click')
    expect(wrapper.emitted('next')).toHaveLength(1)
    expect(wrapper.emitted('done')).toBeUndefined()
  })
})
