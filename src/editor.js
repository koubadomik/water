import { createApp } from 'vue'
import './styles/theme.css'
import { applySavedAppearance } from './composables/useAppearance.js'
import EditorApp from './EditorApp.vue'

applySavedAppearance()
createApp(EditorApp).mount('#app')
