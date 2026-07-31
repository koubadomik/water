import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: { main: 'index.html', editor: 'editor/index.html', thank: 'thank/index.html' },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.js'],
  },
})
