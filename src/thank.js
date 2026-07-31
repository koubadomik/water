import { createApp } from 'vue'
import { MotionPlugin } from '@vueuse/motion'
import Particles from '@tsparticles/vue3'
import { loadStarsPreset } from '@tsparticles/preset-stars'
import { loadStarShape } from '@tsparticles/shape-star'
import './styles/theme.css'
import { applySavedAppearance } from './composables/useAppearance.js'
import ThankApp from './ThankApp.vue'

applySavedAppearance('thank')
createApp(ThankApp)
  .use(MotionPlugin)
  .use(Particles, { init: async (engine) => { await loadStarsPreset(engine); await loadStarShape(engine) } })
  .mount('#app')
