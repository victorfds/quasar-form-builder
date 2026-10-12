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

export default withNuxt(antfuConfig, {
  files: ['**/*.{js,cjs,mjs}'],
  rules: {
    // Espree references do not carry TypeScript's isValueReference marker.
    'unused-imports/no-unused-vars': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true }],
  },
})
