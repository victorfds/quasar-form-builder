import { addComponent, addComponentsDir, addImports, addImportsDir, addPlugin, addTypeTemplate, createResolver, defineNuxtModule, resolveModule } from '@nuxt/kit'
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
  QfbFormFieldError,
  QfbSchemaField,
  QfbSchemaMetadata,
  QfbSchemaSection,
} from './runtime/types'
export type * from './runtime/types/media'
export type { QfbSchemaDiagnostic } from './runtime/utils/schemaIdentity'

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
      nuxt: '>=4.5.1 <5',
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
    // A nested consumer must share the host Pinia with plugins resolved from ancestor packages.
    nuxt.options.alias.pinia ||= resolveModule('pinia', { paths: [`${nuxt.options.rootDir}/`] })
    nuxt.options.vite.resolve ||= {}
    nuxt.options.vite.resolve.dedupe = [...new Set([...(nuxt.options.vite.resolve.dedupe || []), 'vue', 'pinia'])]
    nuxt.options.build.transpile ||= []
    nuxt.options.build.transpile.push(runtimeDir)
    nuxt.options.build.transpile.push('@formkit/vue')
    nuxt.options.build.transpile.push('shiki')

    nuxt.hook('prepare:types', (opts) => {
      opts.references.push({ types: '@formkit/vue' })
    })

    nuxt.options.runtimeConfig.public.formBuilder = defu(
      nuxt.options.runtimeConfig.public.formBuilder as Record<string, unknown> | undefined,
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
      addComponent({ name: `${prefix}AudioRecorder`, filePath: resolver.resolve('./runtime/app/components/AudioRecorder.vue') })
      addComponent({ name: `${prefix}MediaAttachments`, filePath: resolver.resolve('./runtime/app/components/MediaAttachments.vue') })
      addComponent({
        name: `${prefix}ElementsDrawer`,
        filePath: resolver.resolve('./runtime/app/components/TheElementsDrawer.vue'),
      })
      addComponent({
        name: `${prefix}PropertiesDrawer`,
        filePath: resolver.resolve('./runtime/app/components/TheFormSettingsDrawer.vue'),
      })
    }

    addImportsDir(`${runtimeComposablesDir}/use*.{ts,js}`)
    addImportsDir(runtimeUtilsDir)
    addImports([
      { name: 'useEventListener', from: resolver.resolve('./runtime/app/composables/useEventListener'), priority: 10 },
      { name: 'useEventListener', as: 'useQfbEventListener', from: resolver.resolve('./runtime/app/composables/useEventListener') },
      ...[
        { file: 'formData', names: ['extractFormData', 'createFormSchemaData'] },
        { file: 'logic', names: ['contains', 'startsWith', 'endsWith'] },
        { file: 'dateLogic', names: ['isToday', 'isTomorrow', 'isYesterday', 'isDayAfterTomorrow', 'isDayBeforeYesterday'] },
      ].flatMap(({ file, names }) => names.map(name => ({ name, from: resolver.resolve(`./runtime/utils/${file}`) }))),
      { name: 'QfbExtractOptions', from: resolver.resolve('./runtime/utils/formData'), type: true },
      ...['createQfbIndexedDbStorage', 'createQfbHttpMediaTransport', 'createQfbMediaError', 'isQfbMediaError'].map(name => ({ name, from: resolver.resolve('./runtime/media') })),
      ...['adoptQfbSchema', 'cloneQfbSchemaAsTemplate', 'createQfbSchemaError', 'isQfbSchemaError'].map(name => ({ name, from: resolver.resolve('./runtime/schema') })),
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
