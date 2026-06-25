import { mount } from '@vue/test-utils'
import { describe, test, expect } from 'vitest'
import FinalMasteryTestView from '../FinalMasteryTestView.vue'

const verses = [
  { ref: 'John 3:16', text: 'For God so loved the world' },
  { ref: 'Ps 23:1', text: 'The Lord is my shepherd' },
]

describe('FinalMasteryTestView', () => {
  test('shows first verse reference', () => {
    const wrapper = mount(FinalMasteryTestView, { props: { verses } })
    expect(wrapper.text()).toContain('John 3:16')
  })

  test('has textarea and submit button initially', () => {
    const wrapper = mount(FinalMasteryTestView, { props: { verses } })
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.find('[data-testid="submit"]').exists()).toBe(true)
  })

  test('submitting shows self-assess buttons', async () => {
    const wrapper = mount(FinalMasteryTestView, { props: { verses } })
    await wrapper.find('textarea').setValue('test')
    await wrapper.find('[data-testid="submit"]').trigger('click')
    expect(wrapper.find('[data-testid="got-it"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="needs-more"]').exists()).toBe(true)
  })

  test('"got-it" advances to the next verse', async () => {
    const wrapper = mount(FinalMasteryTestView, { props: { verses } })
    await wrapper.find('textarea').setValue('test')
    await wrapper.find('[data-testid="submit"]').trigger('click')
    await wrapper.find('[data-testid="got-it"]').trigger('click')
    expect(wrapper.text()).toContain('Ps 23:1')
  })

  test('completing all verses shows the summary screen', async () => {
    const wrapper = mount(FinalMasteryTestView, { props: { verses: [verses[0]] } })
    await wrapper.find('textarea').setValue('test')
    await wrapper.find('[data-testid="submit"]').trigger('click')
    await wrapper.find('[data-testid="got-it"]').trigger('click')
    expect(wrapper.find('[data-testid="new-goal"]').exists()).toBe(true)
  })

  test('summary shows "Extend Path" button when there are failures', async () => {
    const wrapper = mount(FinalMasteryTestView, { props: { verses: [verses[0]] } })
    await wrapper.find('textarea').setValue('wrong')
    await wrapper.find('[data-testid="submit"]').trigger('click')
    await wrapper.find('[data-testid="needs-more"]').trigger('click')
    expect(wrapper.find('[data-testid="extend-path"]').exists()).toBe(true)
  })

  test('"Extend Path" not shown when all verses mastered', async () => {
    const wrapper = mount(FinalMasteryTestView, { props: { verses: [verses[0]] } })
    await wrapper.find('textarea').setValue('test')
    await wrapper.find('[data-testid="submit"]').trigger('click')
    await wrapper.find('[data-testid="got-it"]').trigger('click')
    expect(wrapper.find('[data-testid="extend-path"]').exists()).toBe(false)
  })

  test('"New Goal" emits done with action:new', async () => {
    const wrapper = mount(FinalMasteryTestView, { props: { verses: [verses[0]] } })
    await wrapper.find('textarea').setValue('test')
    await wrapper.find('[data-testid="submit"]').trigger('click')
    await wrapper.find('[data-testid="got-it"]').trigger('click')
    await wrapper.find('[data-testid="new-goal"]').trigger('click')
    const emitted = wrapper.emitted('done')
    expect(emitted).toBeTruthy()
    expect(emitted[emitted.length - 1][0].action).toBe('new')
    expect(emitted[emitted.length - 1][0].failedVerses).toHaveLength(0)
  })

  test('"Extend Path" emits done with action:extend and failedVerses', async () => {
    const wrapper = mount(FinalMasteryTestView, { props: { verses: [verses[0]] } })
    await wrapper.find('textarea').setValue('wrong')
    await wrapper.find('[data-testid="submit"]').trigger('click')
    await wrapper.find('[data-testid="needs-more"]').trigger('click')
    await wrapper.find('[data-testid="extend-path"]').trigger('click')
    const emitted = wrapper.emitted('done')
    expect(emitted).toBeTruthy()
    expect(emitted[emitted.length - 1][0].action).toBe('extend')
    expect(emitted[emitted.length - 1][0].failedVerses[0].ref).toBe('John 3:16')
  })
})
