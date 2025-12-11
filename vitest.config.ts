import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    css: true,
    include: ['tests/**/*.{test,spec}.ts', 'tests/**/*.{test,spec}.tsx'],
    exclude: [
      'tests/e2e/**/*', // E2E tests run separately with Playwright
      'node_modules/**/*',
      'lib/__tests__/**/*'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.ts',
        '*.config.js',
        '.next/',
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
