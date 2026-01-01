import type { FormKitNode } from '@formkit/core'
import { QuasarBtn, QuasarBtnToggle, QuasarCheckbox, QuasarDate, QuasarDatetime, QuasarEditor, QuasarInput, QuasarSelect, QuasarMultipleDate, QuasarDateRange, QuasarSteps } from '#components'
import { en, pt } from '@formkit/i18n'
import { defineFormKitConfig } from '@formkit/vue'

function quasarPlugin() { }
quasarPlugin.library = (node: FormKitNode) => {
  const type: string = node.props.type
  const quasarTypes = {
    'q-input': () => node.define({
      type: 'input',
      props: ['columns'],
      component: QuasarInput,
    }),
    'q-date-multiple': () => node.define({
      type: 'input',
      props: ['columns'],
      component: QuasarMultipleDate,
    }),
    'q-select': () => node.define({
      type: 'input',
      props: ['columns'],
      component: QuasarSelect,
    }),
    'q-btn-toggle': () => node.define({
      type: 'input',
      props: ['columns'],
      component: QuasarBtnToggle,
    }),
    'q-checkbox': () => node.define({
      type: 'input',
      props: ['columns'],
      component: QuasarCheckbox,
    }),
    'q-editor': () => node.define({
      type: 'input',
      props: ['columns'],
      component: QuasarEditor,
    }),
    'q-date': () => node.define({
      type: 'input',
      props: ['columns'],
      component: QuasarDate,
    }),
    'q-date-range': () => node.define({
      type: 'input',
      props: ['columns'],
      component: QuasarDateRange,
    }),
    'q-datetime': () => node.define({
      type: 'input',
      props: ['columns'],
      component: QuasarDatetime,
    }),
    'q-btn': () => node.define({
      type: 'input',
      props: ['columns', 'align'],
      component: QuasarBtn,
    }),
    'q-stepper': () => node.define({
      type: 'group',
      props: ['steps'],
      component: QuasarSteps,
    }),
  }

  return quasarTypes[type]?.()
}

export default defineFormKitConfig({
  plugins: [
    quasarPlugin,
  ],
  locales: { en, pt },
  locale: 'pt',
})
