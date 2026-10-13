import { fileURLToPath } from 'node:url'
import FormBuilderModule from '../src/module'

export default defineNuxtConfig({
  devtools: { enabled: false },
  alias: {
    'nuxt-quasar-form-builder/media': fileURLToPath(new URL('../src/runtime/app/media/index.ts', import.meta.url)),
    'nuxt-quasar-form-builder/schema': fileURLToPath(new URL('../src/runtime/app/schema/index.ts', import.meta.url)),
  },
  modules: [
    FormBuilderModule,
    '@nuxt/eslint',
  ],

  formBuilder: {
    route: '/',
  },

  eslint: {
    config: {
      standalone: false,
      // Use the generated ESLint config for lint root project as well
      rootDir: fileURLToPath(new URL('..', import.meta.url)),
    },
  },

  vite: {
    build: {
      modulePreload: {
        polyfill: false,
      },
    },
  },

  $env: {
    e2e: {
      vite: {
        // Startup HMR reloads can abort imports before Firefox hydration finishes.
        server: { hmr: false },
        // Late discovery invalidates dependency URLs already loading in other workers.
        optimizeDeps: {
          noDiscovery: true,
          include: ['@formkit/core', '@formkit/i18n', '@formkit/utils', 'idb', 'jsep', 'uuid'],
        },
      },
    },
  },

  compatibilityDate: '2025-01-28',
})
