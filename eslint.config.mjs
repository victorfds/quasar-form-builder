import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  vue: true,
  rules: {
    'antfu/if-newline': 'off',
  },
  ignores: ['.*'],
})
