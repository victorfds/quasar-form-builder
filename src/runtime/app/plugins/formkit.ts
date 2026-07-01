import { defineNuxtPlugin } from '#imports'
import { resetCount } from '@formkit/core'
import { defaultConfig, plugin, ssrComplete } from '@formkit/vue'
import importedConfig from '../../formkit.config'

export default defineNuxtPlugin((nuxtApp) => {
  const config = defaultConfig(typeof importedConfig === 'function' ? importedConfig() : importedConfig)

  nuxtApp.hook('app:rendered', () => {
    resetCount()
    ssrComplete(nuxtApp.vueApp)
  })

  nuxtApp.vueApp.use(plugin, config)
})
