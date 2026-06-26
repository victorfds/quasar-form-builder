<script setup lang="ts">
const formStore = useFormStore()
const { onEnteredProp } = formStore

const elementStates = reactive({
  clearable: Boolean(formStore.activeField?.clearable),
  counter: Boolean(formStore.activeField?.counter),
  multiple: Boolean(formStore.activeField?.multiple),
  useChips: Boolean(formStore.activeField?.useChips),
  useInput: Boolean(formStore.activeField?.useInput),
  fillInput: Boolean(formStore.activeField?.fillInput),
  hideSelected: Boolean(formStore.activeField?.hideSelected),
  optionsDense: Boolean(formStore.activeField?.optionsDense),
  optionsCover: Boolean(formStore.activeField?.optionsCover),
  newValueMode: String(formStore.activeField?.newValueMode || ''),
  behavior: String(formStore.activeField?.behavior || ''),
  maxValues: formStore.activeField?.maxValues ?? '',
  inputDebounce: formStore.activeField?.inputDebounce ?? '',
})

const newValueModeOptions = [
  { label: 'Desativado', value: '' },
  { label: 'Adicionar', value: 'add' },
  { label: 'Adicionar único', value: 'add-unique' },
  { label: 'Alternar', value: 'toggle' },
]

const behaviorOptions = [
  { label: 'Automático', value: '' },
  { label: 'Menu', value: 'menu' },
  { label: 'Diálogo', value: 'dialog' },
]

const maxValuesInputRef = ref<HTMLInputElement | null>(null)
const inputDebounceInputRef = ref<HTMLInputElement | null>(null)

function onClickLabel(refElement: HTMLInputElement | null) {
  refElement?.focus()
}
</script>

<template>
  <q-card flat>
    <q-card-section>
      <div class="column q-gutter-sm">
        <div class="row align-center items-center justify-between">
          <label for="select-clearable">
            <span class="text-body2">Limpável</span>
          </label>
          <q-toggle
            id="select-clearable"
            :model-value="elementStates.clearable"
            color="primary"
            @update:model-value="val => { elementStates.clearable = val; onEnteredProp('clearable', val) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="select-multiple">
            <span class="text-body2">Múltiplo</span>
          </label>
          <q-toggle
            id="select-multiple"
            :model-value="elementStates.multiple"
            color="primary"
            @update:model-value="val => { elementStates.multiple = val; onEnteredProp('multiple', val) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="select-use-chips">
            <span class="text-body2">Usar chips</span>
          </label>
          <q-toggle
            id="select-use-chips"
            :model-value="elementStates.useChips"
            color="primary"
            @update:model-value="val => { elementStates.useChips = val; onEnteredProp('useChips', val) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="select-use-input">
            <span class="text-body2">Permitir digitação</span>
          </label>
          <q-toggle
            id="select-use-input"
            :model-value="elementStates.useInput"
            color="primary"
            @update:model-value="val => { elementStates.useInput = val; onEnteredProp('useInput', val) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="select-fill-input">
            <span class="text-body2">Preencher input</span>
          </label>
          <q-toggle
            id="select-fill-input"
            :model-value="elementStates.fillInput"
            color="primary"
            @update:model-value="val => { elementStates.fillInput = val; onEnteredProp('fillInput', val) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="select-hide-selected">
            <span class="text-body2">Ocultar selecionados</span>
          </label>
          <q-toggle
            id="select-hide-selected"
            :model-value="elementStates.hideSelected"
            color="primary"
            @update:model-value="val => { elementStates.hideSelected = val; onEnteredProp('hideSelected', val) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="select-counter">
            <span class="text-body2">Contador</span>
          </label>
          <q-toggle
            id="select-counter"
            :model-value="elementStates.counter"
            color="primary"
            @update:model-value="val => { elementStates.counter = val; onEnteredProp('counter', val) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="select-options-dense">
            <span class="text-body2">Opções densas</span>
          </label>
          <q-toggle
            id="select-options-dense"
            :model-value="elementStates.optionsDense"
            color="primary"
            @update:model-value="val => { elementStates.optionsDense = val; onEnteredProp('optionsDense', val) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="select-options-cover">
            <span class="text-body2">Menu cobre campo</span>
          </label>
          <q-toggle
            id="select-options-cover"
            :model-value="elementStates.optionsCover"
            color="primary"
            @update:model-value="val => { elementStates.optionsCover = val; onEnteredProp('optionsCover', val) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="select-new-value-mode">
            <span class="text-body2">Novos valores</span>
          </label>
          <q-select
            id="select-new-value-mode"
            :model-value="elementStates.newValueMode"
            :options="newValueModeOptions"
            emit-value
            map-options
            hide-bottom-space
            filled
            class="mw-200"
            color="cyan-8"
            dense
            @update:model-value="val => { elementStates.newValueMode = String(val || ''); onEnteredProp('newValueMode', elementStates.newValueMode) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="select-behavior">
            <span class="text-body2">Exibição</span>
          </label>
          <q-select
            id="select-behavior"
            :model-value="elementStates.behavior"
            :options="behaviorOptions"
            emit-value
            map-options
            hide-bottom-space
            filled
            class="mw-200"
            color="cyan-8"
            dense
            @update:model-value="val => { elementStates.behavior = String(val || ''); onEnteredProp('behavior', elementStates.behavior) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="select-max-values" @click="onClickLabel(maxValuesInputRef)">
            <span class="text-body2">Máximo de valores</span>
          </label>
          <q-input
            id="select-max-values"
            ref="maxValuesInputRef"
            :model-value="elementStates.maxValues"
            hide-bottom-space
            filled
            class="mw-200"
            color="cyan-8"
            dense
            type="number"
            @update:model-value="val => { elementStates.maxValues = val || ''; onEnteredProp('maxValues', val ? Number(val) : '') }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="select-input-debounce" @click="onClickLabel(inputDebounceInputRef)">
            <span class="text-body2">Debounce filtro</span>
          </label>
          <q-input
            id="select-input-debounce"
            ref="inputDebounceInputRef"
            :model-value="elementStates.inputDebounce"
            hide-bottom-space
            filled
            class="mw-200"
            color="cyan-8"
            dense
            type="number"
            suffix="ms"
            @update:model-value="val => { elementStates.inputDebounce = val || ''; onEnteredProp('inputDebounce', val ? Number(val) : '') }"
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>
