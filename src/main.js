import { createApp } from 'vue'
import './styles/theme.css'
import App from './App.vue'
import { applySavedAppearance } from './composables/useAppearance.js'

applySavedAppearance()
createApp(App).mount('#app')
