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
  QuasarSeparator,
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
      props: ['columns', 'attrs', 'clearable', 'counter', 'autogrow', 'loading', 'stackLabel', 'debounce', 'mask', 'fill-mask', 'reverse-fill-mask', 'unmasked-value', 'prefix', 'suffix', 'filled', 'outlined', 'standout', 'borderless', 'rounded', 'square', 'dark', 'readonly', 'disable', 'disabled'],
      component: QuasarInput,
    }),
    'q-date-multiple': () => node.define({
      type: 'input',
      props: ['columns'],
      component: QuasarMultipleDate,
    }),
    'q-select': () => node.define({
      type: 'input',
      props: ['columns', 'options', 'clearable', 'counter', 'multiple', 'useChips', 'useInput', 'fillInput', 'hideSelected', 'optionsDense', 'optionsCover', 'newValueMode', 'behavior', 'maxValues', 'inputDebounce', 'filled', 'outlined', 'standout', 'borderless', 'rounded', 'square', 'dark', 'readonly', 'disable', 'disabled'],
      component: QuasarSelect,
    }),
    'q-option-group': () => node.define({
      type: 'input',
      props: ['columns', 'options', 'groupType', 'optionStyle', 'inline', 'leftLabel', 'dense', 'disable', 'disabled', 'readonly', 'dark'],
      component: QuasarOptionGroup,
    }),
    'q-btn-toggle': () => node.define({
      type: 'input',
      props: ['columns', 'options', 'multiple', 'spread', 'rounded', 'square', 'clearable', 'toggleColor', 'textColor', 'disable', 'disabled', 'readonly'],
      component: QuasarBtnToggle,
    }),
    'q-checkbox': () => node.define({
      type: 'input',
      props: ['columns', 'disable', 'disabled', 'readonly'],
      component: QuasarCheckbox,
    }),
    'q-toggle': () => node.define({
      type: 'input',
      props: ['columns', 'disable', 'disabled', 'readonly'],
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
      props: ['columns', 'accept', 'multiple', 'maxFileSize', 'maxTotalSize', 'maxFiles', 'useChips', 'counter', 'clearable', 'gallery', 'filled', 'outlined', 'standout', 'borderless', 'rounded', 'square', 'dark'],
      component: QuasarFile,
    }),
    'q-separator': () => node.define({
      type: 'input',
      props: ['columns', 'vertical', 'inset', 'spaced', 'color', 'size'],
      component: QuasarSeparator,
    }),
    'q-signature': () => node.define({
      type: 'input',
      props: ['columns', 'disable', 'disabled', 'readonly'],
      component: QuasarSignature,
    }),
    'q-matrix': () => node.define({
      type: 'input',
      props: ['columns', 'rows', 'columnsConfig', 'defaultColumnType', 'defaultColumnOptions', 'table', 'rowsMode', 'initialRows', 'minRows', 'maxRows', 'canAddRows', 'addButtonText', 'canRemoveRows', 'matrixView', 'minColumnWidth', 'maxColumnWidth', 'cellGap', 'horizontalPadding', 'hideRowLabels', 'allowMultilineRows', 'stickyRowLabels', 'hideColumnLabels', 'allowMultilineColumns', 'stickyColumnHeaders', 'matrixSize', 'disable', 'disabled', 'readonly'],
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
