// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,
  modules: [
    'nuxt-quasar-ui',
    '@pinia/nuxt',
    '@formkit/nuxt',
  ],
  imports: {
    dirs: ['stores'],
  },
  quasar: {
    plugins: [
      'BottomSheet',
      'Dialog',
      'Loading',
      'LoadingBar',
      'Notify',
      'Dark',
      'LocalStorage',
      'Platform',
    ],
    lang: 'pt-BR',
    iconSet: 'material-icons',
    extras: { animations: 'all', fontIcons: ['material-icons', 'material-icons-outlined', 'material-symbols-outlined'] },
    config: { brand: { primary: '#FFA726' } },
    sassVariables: true,
  }
})
