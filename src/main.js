import { createApp } from 'vue'
import './styles/theme.css'
import App from './App.vue'
import { applySavedAppearance } from './composables/useAppearance.js'
import { initZen } from './composables/useZen.js'

applySavedAppearance()
initZen()
createApp(App).mount('#app')
