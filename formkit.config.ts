import type { Component } from 'vue'
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
import { createInput, defineFormKitConfig } from '@formkit/vue'

function quasarInput(
  component: Component,
  props: string[] = ['columns'],
  type: 'input' | 'group' | 'list' = 'input',
) {
  return createInput(component, { type, props })
}

const quasarInputs = {
  'q-input': quasarInput(QuasarInput, ['columns', 'clearable', 'counter', 'autogrow', 'loading', 'stackLabel', 'debounce', 'mask', 'fill-mask', 'reverse-fill-mask', 'unmasked-value', 'prefix', 'suffix', 'rounded', 'square', 'dark']),
  'q-date-multiple': quasarInput(QuasarMultipleDate),
  'q-select': quasarInput(QuasarSelect, ['columns', 'options', 'clearable', 'counter', 'multiple', 'useChips', 'useInput', 'fillInput', 'hideSelected', 'optionsDense', 'optionsCover', 'newValueMode', 'behavior', 'maxValues', 'inputDebounce', 'rounded', 'square', 'dark']),
  'q-option-group': quasarInput(QuasarOptionGroup, ['columns', 'options', 'groupType', 'optionStyle', 'inline', 'leftLabel', 'dense', 'disable', 'dark']),
  'q-btn-toggle': quasarInput(QuasarBtnToggle, ['columns', 'options', 'multiple', 'spread', 'rounded', 'square', 'clearable', 'toggleColor', 'textColor']),
  'q-checkbox': quasarInput(QuasarCheckbox),
  'q-toggle': quasarInput(QuasarToggle),
  'q-editor': quasarInput(QuasarEditor),
  'q-date': quasarInput(QuasarDate),
  'q-date-range': quasarInput(QuasarDateRange),
  'q-datetime': quasarInput(QuasarDatetime),
  'q-time': quasarInput(QuasarTime, ['columns', 'mask', 'format24h', 'withSeconds', 'nowBtn']),
  'q-slider': quasarInput(QuasarSlider, ['columns', 'min', 'max', 'step', 'vertical']),
  'q-range': quasarInput(QuasarRange, ['columns', 'min', 'max', 'step']),
  'q-file': quasarInput(QuasarFile, ['columns', 'accept', 'multiple', 'maxFileSize', 'maxTotalSize', 'maxFiles', 'useChips', 'counter', 'clearable', 'gallery', 'rounded', 'square', 'dark']),
  'q-separator': quasarInput(QuasarSeparator, ['columns', 'vertical', 'inset', 'spaced', 'color', 'size']),
  'q-signature': quasarInput(QuasarSignature),
  'q-matrix': quasarInput(QuasarMatrix, ['columns', 'rows', 'columnsConfig', 'table']),
  'q-btn': quasarInput(QuasarBtn, ['columns', 'align']),
  'q-stepper': quasarInput(QuasarSteps, ['steps'], 'group'),
  'q-container': quasarInput(QuasarContainer, ['columns', 'structureChildren'], 'group'),
  'q-tabs': quasarInput(QuasarTabs, ['columns', 'tabs'], 'group'),
  'q-grid': quasarInput(QuasarGrid, ['columns', 'columnsCount', 'rowsCount', 'structureChildren', 'cells'], 'group'),
  'q-table-structure': quasarInput(QuasarTableStructure, ['columns', 'rows', 'columnsConfig', 'cells'], 'group'),
  'q-list-structure': quasarInput(QuasarListStructure, ['columns', 'structureChildren', 'nested'], 'list'),
}

export default defineFormKitConfig({
  inputs: quasarInputs,
  locales: { en, pt },
  locale: 'pt',
})
