// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4
  },
  modules: [
    "nuxt-quasar-ui",
    "@pinia/nuxt"
  ],
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
    lang: "pt-BR",
    iconSet: 'material-icons',
    extras: { animations: 'all', fontIcons: ['material-icons-outlined'] }
  },
})
