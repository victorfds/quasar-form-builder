import { addComponent, addComponentsDir, addImports, addImportsDir, addPlugin, addTypeTemplate, createResolver, defineNuxtModule } from '@nuxt/kit'
import { defu } from 'defu'

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
const runtimeCss = resolver.resolve('./runtime/app/assets/scss/index.scss')

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
      primary: '#FFA726',
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
}

export {}
`,
    })
  },
})
