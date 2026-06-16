import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: 'vue.html',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.js'],
  },
})
