import { ref } from 'vue'

export const skins = [
  { id: 'paper', name: 'Quiet Paper', description: 'Warm, calm, and journal-like.', swatches: ['#fffdf8', '#755d49', '#496582'] },
  { id: 'midnight', name: 'Midnight Study', description: 'Deep navy with a soft gold accent.', swatches: ['#172033', '#d8b36a', '#91a7d0'] },
  { id: 'forest', name: 'Forest', description: 'Moss green, parchment, and earth.', swatches: ['#f7f4e9', '#41634d', '#84976d'] },
  { id: 'dawn', name: 'Rose / Dawn', description: 'Soft rose paper and burgundy ink.', swatches: ['#fff7f5', '#87475a', '#d99a9a'] },
  { id: 'solarized', name: 'Solarized', description: 'Developer calm: warm base, cyan, and code-like type.', swatches: ['#fdf6e3', '#268bd2', '#2aa198'] },
  { id: 'commander', name: 'Midnight Commander', description: 'DOS-blue panels, cyan edges, and terminal type.', swatches: ['#0000aa', '#00aaaa', '#ffff55'] },
  { id: 'terminal', name: 'Green Terminal', description: 'Phosphor green on an almost-black screen.', swatches: ['#07110b', '#8cff66', '#244b2b'] },
  { id: 'gameboy', name: 'Game Boy', description: 'Olive pixels, ink, and chunky little controls.', swatches: ['#e0f8cf', '#306230', '#8bac0f'] },
  { id: 'synthwave', name: 'Synthwave', description: 'Midnight violet, neon pink, and electric cyan.', swatches: ['#180b36', '#ff71ce', '#01cdfe'] },
  { id: 'amber', name: 'Amber CRT', description: 'Warm amber phosphor for late-night reading.', swatches: ['#160e04', '#ffb000', '#704b12'] },
  { id: 'matrix', name: 'Matrix', description: 'Black, green, and a quiet digital glow.', swatches: ['#020702', '#00e33b', '#0b5721'] },
  { id: 'win95', name: 'Windows 95', description: 'Classic gray panels and a blue title-bar mood.', swatches: ['#c0c0c0', '#000080', '#ffffff'] },
  { id: 'nord', name: 'Nordic Night', description: 'Calm blue-gray with icy cyan.', swatches: ['#2e3440', '#88c0d0', '#81a1c1'] },
  { id: 'library', name: 'Library Card', description: 'Stamped paper, ink, and old card-catalog warmth.', swatches: ['#f4edda', '#5b3d2e', '#b2583b'] },
  { id: 'manuscript', name: 'Manuscript', description: 'Parchment, dark ink, and rubric red.', swatches: ['#f7edcf', '#30261f', '#a33b2b'] },
  { id: 'y2k', name: 'Y2K Gloss', description: 'Lavender, chrome, and a little bit of joy.', swatches: ['#f6efff', '#8e5bff', '#ff8bd1'] },
  { id: 'chalk', name: 'Chalkboard', description: 'Chalky white on a deep classroom board.', swatches: ['#253b34', '#f6f2e5', '#9ac7b5'] },
  { id: 'notebook', name: 'Notebook', description: 'Ruled paper, red margin, and blue ink.', swatches: ['#fffdf6', '#245ca6', '#c94c4c'] },
  { id: 'sticky', name: 'Sticky Notes', description: 'Sunny notes on a soft desk surface.', swatches: ['#fff7a8', '#ef9ec0', '#8fd1d1'] },
  { id: 'watercolor', name: 'Watercolor', description: 'Quiet washes of paint and soft ink.', swatches: ['#f8f5f0', '#718fc4', '#dfa3a6'] },
  { id: 'campfire', name: 'Campfire', description: 'Charcoal, ember orange, and warm paper.', swatches: ['#241a17', '#e6733f', '#f5dfb5'] },
  { id: 'seaside', name: 'Seaside', description: 'Sea glass, washed blue, and sand.', swatches: ['#eff7f5', '#4c91a4', '#9acbbd'] },
  { id: 'autumn', name: 'Autumn Leaves', description: 'Cream, rust, ochre, and forest.', swatches: ['#f7f0df', '#b4522d', '#8c973d'] },
  { id: 'lavender', name: 'Lavender Garden', description: 'Lavender paper, sage, and plum ink.', swatches: ['#f6f1fb', '#72558c', '#a7bd9a'] },
  { id: 'moonlight', name: 'Moonlight', description: 'Soft silver and midnight blue.', swatches: ['#20283d', '#b9c7e8', '#6b87bd'] },
  { id: 'coffee', name: 'Coffee Shop', description: 'Espresso, oat milk, and terracotta.', swatches: ['#f1e3cf', '#5b3829', '#b96043'] },
  { id: 'storybook', name: 'Storybook', description: 'Warm illustrated color and friendly shapes.', swatches: ['#fff5df', '#d56853', '#6fa8a1'] },
  { id: 'quilt', name: 'Quilt', description: 'Soft fabric colors with stitched warmth.', swatches: ['#f6efe4', '#a65a62', '#6f9b91'] },
  { id: 'ink', name: 'Minimal Ink', description: 'Clean white paper and black ink.', swatches: ['#ffffff', '#202020', '#bdbdbd'] },
]

export const fonts = [
  { id: 'theme', name: 'Theme default', sample: 'Aa' },
  { id: 'sans', name: 'Modern sans', sample: 'Aa' },
  { id: 'book', name: 'Book serif', sample: 'Aa' },
  { id: 'mono', name: 'Monospace', sample: '01' },
]

const STORAGE_KEY = 'appearanceSkin'
const FONT_STORAGE_KEY = 'appearanceFont'
const selectedSkin = ref('paper')
const selectedFont = ref('theme')

function validSkin(id) {
  return skins.some(skin => skin.id === id) ? id : 'paper'
}

export function applyAppearance(id) {
  const skin = validSkin(id)
  selectedSkin.value = skin
  if (typeof document !== 'undefined') document.documentElement.dataset.skin = skin
  try { localStorage.setItem(STORAGE_KEY, skin) } catch { /* storage is optional */ }
}

export function applyFont(id) {
  const font = fonts.some(item => item.id === id) ? id : 'theme'
  selectedFont.value = font
  if (typeof document !== 'undefined') {
    if (font === 'theme') delete document.documentElement.dataset.font
    else document.documentElement.dataset.font = font
  }
  try { localStorage.setItem(FONT_STORAGE_KEY, font) } catch { /* storage is optional */ }
}

export function applySavedAppearance() {
  let saved = 'paper'
  try { saved = localStorage.getItem(STORAGE_KEY) || 'paper' } catch { /* storage is optional */ }
  applyAppearance(saved)
  let savedFont = 'theme'
  try { savedFont = localStorage.getItem(FONT_STORAGE_KEY) || 'theme' } catch { /* storage is optional */ }
  applyFont(savedFont)
}

export function useAppearance() {
  return { skins, fonts, selectedSkin, selectedFont, applyAppearance, applyFont }
}
