import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'happy-dom'
  },
  resolve: {
    alias: {
      'obsidian': resolve(__dirname, 'vitest/src/mocks/obsidian.js')
    }
  }
})