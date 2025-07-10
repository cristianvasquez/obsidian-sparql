import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom'
  },
  resolve: {
    alias: {
      'obsidian': resolve(__dirname, 'vitest/src/mocks/obsidian.js')
    }
  }
})