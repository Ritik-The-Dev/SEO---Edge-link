import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
    setupFiles: ['src/tests/setup.ts'],
    env: {
      USE_MOCKS: 'true',
      AI_USE_MOCKS: 'true',
      ANTHROPIC_API_KEY: '',
    },
    reporters: ['default'],
    testTimeout: 20000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
