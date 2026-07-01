import antfu from '@antfu/eslint-config'
import withNuxt from './.playground/.nuxt/eslint.config.mjs'

const antfuConfig = antfu({
  standalone: false,
  typescript: true,
  vue: true,
  rules: {
    'antfu/if-newline': 'off',
  },
  ignores: ['.*', 'test-results/**', 'playwright-report/**'],
})

export default withNuxt(antfuConfig)
