import { ref, watch } from 'vue'

export function useStorage(key, defaultValue) {
  let initial = defaultValue
  try {
    const raw = localStorage.getItem(key)
    if (raw !== null) initial = JSON.parse(raw)
  } catch {}

  const state = ref(initial)

  watch(state, (val) => {
    try {
      localStorage.setItem(key, JSON.stringify(val))
    } catch {}
  }, { deep: true })

  return state
}
