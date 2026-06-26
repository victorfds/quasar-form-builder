import type { FormKitNode } from '@formkit/core'
import {
  QuasarBtn,
  QuasarBtnToggle,
  QuasarCheckbox,
  QuasarContainer,
  QuasarDate,
  QuasarDateRange,
  QuasarDatetime,
  QuasarEditor,
  QuasarFile,
  QuasarGrid,
  QuasarInput,
  QuasarListStructure,
  QuasarMatrix,
  QuasarMultipleDate,
  QuasarOptionGroup,
  QuasarRange,
  QuasarSelect,
  QuasarSignature,
  QuasarSlider,
  QuasarSteps,
  QuasarTableStructure,
  QuasarTabs,
  QuasarTime,
  QuasarToggle,
} from '#components'
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
    'q-option-group': () => node.define({
      type: 'input',
      props: ['columns', 'options', 'groupType', 'optionStyle'],
      component: QuasarOptionGroup,
    }),
    'q-btn-toggle': () => node.define({
      type: 'input',
      props: ['columns', 'options', 'multiple'],
      component: QuasarBtnToggle,
    }),
    'q-checkbox': () => node.define({
      type: 'input',
      props: ['columns'],
      component: QuasarCheckbox,
    }),
    'q-toggle': () => node.define({
      type: 'input',
      props: ['columns'],
      component: QuasarToggle,
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
    'q-time': () => node.define({
      type: 'input',
      props: ['columns', 'mask', 'format24h', 'withSeconds', 'nowBtn'],
      component: QuasarTime,
    }),
    'q-slider': () => node.define({
      type: 'input',
      props: ['columns', 'min', 'max', 'step', 'vertical'],
      component: QuasarSlider,
    }),
    'q-range': () => node.define({
      type: 'input',
      props: ['columns', 'min', 'max', 'step'],
      component: QuasarRange,
    }),
    'q-file': () => node.define({
      type: 'input',
      props: ['columns', 'accept', 'multiple', 'maxFileSize', 'maxTotalSize', 'maxFiles', 'useChips', 'counter', 'clearable', 'gallery'],
      component: QuasarFile,
    }),
    'q-signature': () => node.define({
      type: 'input',
      props: ['columns'],
      component: QuasarSignature,
    }),
    'q-matrix': () => node.define({
      type: 'input',
      props: ['columns', 'rows', 'columnsConfig', 'table'],
      component: QuasarMatrix,
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
    'q-container': () => node.define({
      type: 'group',
      props: ['columns', 'structureChildren'],
      component: QuasarContainer,
    }),
    'q-tabs': () => node.define({
      type: 'group',
      props: ['columns', 'tabs'],
      component: QuasarTabs,
    }),
    'q-grid': () => node.define({
      type: 'group',
      props: ['columns', 'columnsCount', 'rowsCount', 'structureChildren', 'cells'],
      component: QuasarGrid,
    }),
    'q-table-structure': () => node.define({
      type: 'group',
      props: ['columns', 'rows', 'columnsConfig', 'cells'],
      component: QuasarTableStructure,
    }),
    'q-list-structure': () => node.define({
      type: 'list',
      props: ['columns', 'structureChildren', 'nested'],
      component: QuasarListStructure,
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
