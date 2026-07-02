import { addComponent, addComponentsDir, addImports, addImportsDir, addPlugin, addTypeTemplate, createResolver, defineNuxtModule } from '@nuxt/kit'
import { defu } from 'defu'

export type {
  FormBuilderAppConfig,
  FormBuilderLabelsConfig,
  FormBuilderLayoutConfig,
  FormBuilderShellUiConfig,
  FormViewerFieldChangePayload,
  FormViewerReadyPayload,
  FormViewerSubmitInvalidPayload,
  FormViewerValues,
  FormViewerValuesUpdatePayload,
} from './runtime/app/types'

export interface ModuleOptions {
  /**
   * Registers a ready-to-use builder page when set.
   * Use `false` to expose components only.
   */
  route?: false | string
  /**
   * Prefix for the public component aliases.
   */
  prefix?: string
  /**
   * Includes the builder global CSS utilities and Quasar/FormKit fixes.
   */
  includeCss?: boolean
  /**
   * Registers public component aliases for Nuxt auto import.
   * Internal runtime components stay registered so the ready-made route works.
   */
  autoImport?: boolean
  storage?: {
    formFieldsKey?: string
    themeCookieName?: string
  }
}

const resolver = createResolver(import.meta.url)
const runtimeDir = resolver.resolve('./runtime')
const runtimeAppDir = resolver.resolve('./runtime/app')
const runtimeComponentsDir = resolver.resolve('./runtime/app/components')
const runtimeComposablesDir = resolver.resolve('./runtime/app/composables')
const runtimeUtilsDir = resolver.resolve('./runtime/app/utils')
const runtimeCss = resolver.resolve('./runtime/app/assets/css/index.css')

const quasarDefaults = {
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
  extras: {
    animations: 'all',
    fontIcons: ['material-icons', 'material-icons-outlined', 'material-symbols-outlined'],
  },
  config: {
    brand: {
      primary: '#2980b9',
    },
  },
  sassVariables: true,
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-quasar-form-builder',
    configKey: 'formBuilder',
    compatibility: {
      nuxt: '>=4.0.0',
    },
  },
  defaults: {
    route: false,
    prefix: 'Qfb',
    includeCss: true,
    autoImport: true,
    storage: {
      formFieldsKey: 'form-fields',
      themeCookieName: 'theme',
    },
  },
  moduleDependencies: {
    'nuxt-quasar-ui': {
      defaults: quasarDefaults,
    },
    '@pinia/nuxt': {},
  },
  setup(options, nuxt) {
    const prefix = options.prefix || 'Qfb'

    nuxt.options.alias ||= {}
    nuxt.options.alias['#qfb'] = runtimeAppDir
    nuxt.options.build.transpile ||= []
    nuxt.options.build.transpile.push(runtimeDir)
    nuxt.options.build.transpile.push('@formkit/vue')

    nuxt.hook('prepare:types', (opts) => {
      opts.references.push({ types: '@formkit/vue' })
    })

    nuxt.options.runtimeConfig.public.formBuilder = defu(
      nuxt.options.runtimeConfig.public.formBuilder,
      {
        storage: options.storage,
      },
    )

    if (options.includeCss && !nuxt.options.css.includes(runtimeCss)) {
      nuxt.options.css.push(runtimeCss)
    }

    addComponentsDir({
      path: runtimeComponentsDir,
      pathPrefix: true,
    })

    addPlugin({
      src: resolver.resolve('./runtime/app/plugins/formkit'),
    })

    if (options.autoImport !== false) {
      addComponent({
        name: `${prefix}BuilderShell`,
        filePath: resolver.resolve('./runtime/app/components/BuilderShell.vue'),
      })
      addComponent({
        name: `${prefix}FormBuilder`,
        filePath: resolver.resolve('./runtime/app/components/FormBuilder.vue'),
      })
      addComponent({
        name: `${prefix}FormViewer`,
        filePath: resolver.resolve('./runtime/app/components/FormViewer.vue'),
      })
      addComponent({
        name: `${prefix}ElementsDrawer`,
        filePath: resolver.resolve('./runtime/app/components/TheElementsDrawer.vue'),
      })
      addComponent({
        name: `${prefix}PropertiesDrawer`,
        filePath: resolver.resolve('./runtime/app/components/TheFormSettingsDrawer.vue'),
      })
    }

    addImportsDir(runtimeComposablesDir)
    addImportsDir(runtimeUtilsDir)
    addImports([
      {
        name: 'useFormStore',
        from: resolver.resolve('./runtime/app/stores/formStore'),
      },
      {
        name: 'useFormStore',
        as: 'useQfbFormStore',
        from: resolver.resolve('./runtime/app/stores/formStore'),
      },
      {
        name: 'useFormHistoryStore',
        from: resolver.resolve('./runtime/app/stores/formHistoryStore'),
      },
      {
        name: 'useFormHistoryStore',
        as: 'useQfbFormHistoryStore',
        from: resolver.resolve('./runtime/app/stores/formHistoryStore'),
      },
    ])

    if (typeof options.route === 'string' && options.route.trim()) {
      nuxt.hook('pages:extend', (pages) => {
        pages.push({
          name: 'qfb-form-builder',
          path: options.route as string,
          file: resolver.resolve('./runtime/app/pages/builder.vue'),
        })
      })
    }

    addTypeTemplate({
      filename: 'types/nuxt-quasar-form-builder.d.ts',
      getContents: () => `
declare module '@nuxt/schema' {
  interface NuxtConfig {
    formBuilder?: import('nuxt-quasar-form-builder').ModuleOptions
  }
  interface NuxtOptions {
    formBuilder?: import('nuxt-quasar-form-builder').ModuleOptions
  }
  interface CustomAppConfig {
    formBuilder?: import('nuxt-quasar-form-builder').FormBuilderAppConfig
  }
}

declare module 'nuxt/schema' {
  interface CustomAppConfig {
    formBuilder?: import('nuxt-quasar-form-builder').FormBuilderAppConfig
  }
}

export {}
`,
    })
  },
})
