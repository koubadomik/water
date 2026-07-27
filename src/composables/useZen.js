import { ref } from 'vue'

const KEY = 'zenMode'
const isZen = ref(false)

export function setZen(next) {
  isZen.value = Boolean(next)
  if (typeof document !== 'undefined') document.documentElement.dataset.zen = String(isZen.value)
  try { localStorage.setItem(KEY, String(isZen.value)) } catch { /* optional preference */ }
}

export function initZen() {
  try { setZen(localStorage.getItem(KEY) === 'true') } catch { setZen(false) }
}

export function useZen() { return { isZen, setZen } }
