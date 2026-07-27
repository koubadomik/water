import { createApp } from 'vue'
import './styles/theme.css'
import App from './App.vue'
import { applySavedAppearance } from './composables/useAppearance.js'
import { initZen } from './composables/useZen.js'
import { initPaperBird } from './composables/usePaperBird.js'

applySavedAppearance()
initZen()
initPaperBird()
createApp(App).mount('#app')
