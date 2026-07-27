import { ref } from 'vue'

const KEY = 'paperBirdEnabled'
const enabled = ref(true)

export function setPaperBird(next) {
  enabled.value = Boolean(next)
  try { localStorage.setItem(KEY, String(enabled.value)) } catch {}
}

export function initPaperBird() {
  try { enabled.value = localStorage.getItem(KEY) !== 'false' } catch {}
}

export function usePaperBird() { return { enabled, setPaperBird } }
