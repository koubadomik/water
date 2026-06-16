import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: 'vue.html',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
