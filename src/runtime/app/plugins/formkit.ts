import { defaultConfig, plugin, resetCount, ssrComplete } from '@formkit/vue'
import { defineNuxtPlugin } from '#imports'
import importedConfig from '../../formkit.config'
import { createFormKitIdPlugin } from '../composables/formkitId'

export default defineNuxtPlugin((nuxtApp) => {
  const config = defaultConfig(typeof importedConfig === 'function' ? importedConfig() : importedConfig)
  config.plugins = [createFormKitIdPlugin(), ...(config.plugins || [])]

  nuxtApp.hook('app:rendered', () => {
    resetCount()
    ssrComplete(nuxtApp.vueApp)
  })

  nuxtApp.vueApp.use(plugin, config)
})
