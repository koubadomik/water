import { mount } from '@vue/test-utils'
import { describe, test, expect } from 'vitest'
import RandomReviewView from '../RandomReviewView.vue'

const verses = [
  { ref: 'John 3:16', text: 'For God so loved the world' },
  { ref: 'Psalm 23:1', text: 'The Lord is my shepherd' },
]

describe('RandomReviewView', () => {
  test('renders a verse reference', () => {
    const wrapper = mount(RandomReviewView, { props: { verses } })
    const text = wrapper.text()
    const hasRef = text.includes('John 3:16') || text.includes('Psalm 23:1')
    expect(hasRef).toBe(true)
  })

  test('has a text input for recall', () => {
    const wrapper = mount(RandomReviewView, { props: { verses } })
    expect(wrapper.find('textarea, input[type="text"], input:not([type])').exists()).toBe(true)
  })

  test('submit button is present', () => {
    const wrapper = mount(RandomReviewView, { props: { verses } })
    expect(wrapper.find('[data-testid="submit"]').exists()).toBe(true)
  })

  test('shows result feedback after submit', async () => {
    const wrapper = mount(RandomReviewView, { props: { verses } })
    const input = wrapper.find('textarea, input[type="text"], input:not([type])')
    await input.setValue('For God so loved the world')
    await wrapper.find('[data-testid="submit"]').trigger('click')
    expect(wrapper.find('[data-testid="feedback"]').exists()).toBe(true)
  })

  test('emits done after reviewing all assigned verses', async () => {
    const wrapper = mount(RandomReviewView, { props: { verses: [verses[0]] } })
    const input = wrapper.find('textarea, input[type="text"], input:not([type])')
    await input.setValue('anything')
    await wrapper.find('[data-testid="submit"]').trigger('click')
    await wrapper.find('[data-testid="continue"]').trigger('click')
    expect(wrapper.emitted('done')).toBeTruthy()
  })
})
