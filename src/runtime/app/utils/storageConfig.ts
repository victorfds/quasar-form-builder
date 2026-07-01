import { useRuntimeConfig } from '#imports'

interface FormBuilderRuntimeConfig {
  storage?: {
    formFieldsKey?: string
    themeCookieName?: string
  }
}

export function getFormBuilderStorageConfig() {
  const runtimeConfig = useRuntimeConfig()
  const config = runtimeConfig.public.formBuilder as FormBuilderRuntimeConfig | undefined

  return {
    formFieldsKey: config?.storage?.formFieldsKey || 'form-fields',
    themeCookieName: config?.storage?.themeCookieName || 'theme',
  }
}
