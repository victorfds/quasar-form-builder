import { fileURLToPath } from 'node:url'
import FormBuilderModule from '../src/module'

export default defineNuxtConfig({
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

  compatibilityDate: '2025-01-28',
})
