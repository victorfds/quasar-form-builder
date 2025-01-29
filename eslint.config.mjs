import withNuxt from './.playground/.nuxt/eslint.config.mjs'
import antfu from '@antfu/eslint-config'

const antfuConfig= antfu({
  typescript: true,
  vue: true,
  rules: {
    'antfu/if-newline': 'off',
  },
  ignores: ['.*'],
})

export default withNuxt(antfuConfig)
