import { ref } from 'vue'

export const skins = [
  { id: 'paper', name: 'Quiet Paper', description: 'Warm, calm, and journal-like.', swatches: ['#fffdf8', '#755d49', '#496582'] },
  { id: 'midnight', name: 'Midnight Study', description: 'Deep navy with a soft gold accent.', swatches: ['#172033', '#d8b36a', '#91a7d0'] },
  { id: 'forest', name: 'Forest', description: 'Moss green, parchment, and earth.', swatches: ['#f7f4e9', '#41634d', '#84976d'] },
  { id: 'dawn', name: 'Rose / Dawn', description: 'Soft rose paper and burgundy ink.', swatches: ['#fff7f5', '#87475a', '#d99a9a'] },
  { id: 'ink', name: 'Minimal Ink', description: 'Clean white paper and black ink.', swatches: ['#ffffff', '#202020', '#bdbdbd'] },
]

const STORAGE_KEY = 'appearanceSkin'
const selectedSkin = ref('paper')

function validSkin(id) {
  return skins.some(skin => skin.id === id) ? id : 'paper'
}

export function applyAppearance(id) {
  const skin = validSkin(id)
  selectedSkin.value = skin
  if (typeof document !== 'undefined') document.documentElement.dataset.skin = skin
  try { localStorage.setItem(STORAGE_KEY, skin) } catch { /* storage is optional */ }
}

export function applySavedAppearance() {
  let saved = 'paper'
  try { saved = localStorage.getItem(STORAGE_KEY) || 'paper' } catch { /* storage is optional */ }
  applyAppearance(saved)
}

export function useAppearance() {
  return { skins, selectedSkin, applyAppearance }
}
