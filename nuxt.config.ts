// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4
  },
  modules: [
    "nuxt-quasar-ui",
    "@pinia/nuxt",
    "@formkit/nuxt"
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
    extras: { animations: 'all', fontIcons: ['material-icons-outlined'] },
    config: { brand: { primary: '#6F511D' } }
  },
  formkit: {
    // Experimental support for auto loading (see note):
    autoImport: true
  }
})
