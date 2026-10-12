import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: { '#qfb': fileURLToPath(new URL('./src/runtime/app', import.meta.url)) } },
  test: { include: ['tests/unit/**/*.test.{ts,mjs}'], environment: 'node' },
})
