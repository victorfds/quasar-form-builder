<script setup lang="ts">
import { fieldTypes } from "../../../constants"
import { getTypesBasedOnFieldType } from "../../../utils"

defineProps<{ hasInputType?: boolean, hasTooltip?: boolean, hasPlaceholder?: boolean, hasDescription?: boolean }>()

const { dark, localStorage } = useQuasar()
const formStore = useFormStore()
const { onEnteredProp } = formStore

const elementsClosed = localStorage.getItem('elements-closed')

const elementStates = reactive<{
  name?: string
  type?: { label: string, value: string }
  nameError?: string
  label?: string
  tooltip?: string
  placeholder?: string
  description?: string
}>({
  name: formStore.activeField?.name,
  type: fieldTypes[formStore.activeField?.$formkit]?.find(el => el.value === formStore.activeField?.inputType),
  label: formStore.activeField?.label,
  tooltip: formStore.activeField?.info,
  placeholder: formStore.activeField?.placeholder,
  description: formStore.activeField?.description,
})
const propNameInputRef = ref<HTMLInputElement | null>(null)
const propTypeInputRef = ref<HTMLInputElement | null>(null)
const propLabelInputRef = ref<HTMLInputElement | null>(null)
const propTooltipInputRef = ref<HTMLInputElement | null>(null)
const propPlaceholderInputRef = ref<HTMLInputElement | null>(null)
const propDescriptionInputRef = ref<HTMLInputElement | null>(null)

watch(() => formStore.activeField, (newVal) => {
  elementStates.name = newVal?.name
  elementStates.nameError = ''
  elementStates.type = fieldTypes[newVal?.$formkit]?.find(el => el.value === newVal?.inputType)
  elementStates.label = newVal?.label
  elementStates.tooltip = formStore.activeField?.info
  elementStates.placeholder = newVal?.placeholder
  elementStates.description = newVal?.description
}, { deep: true })

function onClickLabel(refElement: HTMLInputElement | null, { select = false }: { select?: boolean } = {}) {
  refElement?.focus()
  if (select) {
    refElement?.select()
  }
}

function onBlurName(_: Event) {
  // TODO: do not enter space on name
  elementStates.nameError = ''
  if (elementStates.name === formStore.activeField?.name) return

  const response = formStore.updateNameField(formStore.activeField?.name, elementStates.name)

  if (response?.message === 'name cannot be empty') {
    elementStates.nameError = 'Nome não pode ser vazio'
    return
  }

  if (response?.message === 'name cannot contain spaces') {
    elementStates.nameError = 'Nome não pode conter espaço(s)'
    return
  }

  if (response?.message === 'name already exists') {
    elementStates.nameError = 'Este nome já existe'
  }
}

function onTypeUpdateModelValue(val: any) {
  onEnteredProp('inputType', val.value)

  onEnteredProp('validation', '')
  const toExclude = ['text', 'textarea', 'password']
  if (!toExclude.includes(val.value)) {
    setTimeout(() => {
      onEnteredProp('validation', val.value)
    }, 500)
  }

  elementStates.type = val
}
</script>
<template>
  <q-card flat>
    <q-card-section>
      <div>
        <div class="row align-center items-center justify-between">
          <label for="form-name" @click="onClickLabel(propNameInputRef)">
            <span class="text-body2">
              Nome
            </span>
          </label>
          <q-input id="form-name" ref="propNameInputRef" v-model.trim="elementStates.name"
            :error="Boolean(elementStates.nameError)" :error-message="elementStates.nameError" hide-bottom-space filled
            class="mw-200" color="secondary" dense type="text" @blur="onBlurName" />
        </div>
        <div v-if="hasInputType" class="row align-center items-center justify-between q-mt-sm">
          <label for="form-type" @click="onClickLabel(propTypeInputRef)">
            <span class="text-body2">
              Tipo de entrada
            </span>
          </label>
          <q-select id="form-type" ref="propTypeInputRef" :model-value="elementStates.type" hide-bottom-space filled
            class="mw-200 full-width" color="cyan-8" dense
            :options="getTypesBasedOnFieldType(formStore.activeField?.$formkit)"
            @update:model-value="onTypeUpdateModelValue" style="max-width: 200px;" />
        </div>
      </div>
    </q-card-section>
    <q-separator :color="dark.isActive ? 'grey-9' : 'blue-grey-1'" />
    <q-card-section>
      <div>
        <div class="row align-center items-center justify-between">
          <label for="form-label" @click="onClickLabel(propLabelInputRef)">
            <span class="text-body2">
              Cabeçalho
            </span>
          </label>
          <q-input id="form-label" ref="propLabelInputRef" v-model.trim="elementStates.label" hide-bottom-space filled
            class="mw-200" color="cyan-8" dense type="text" @update:model-value="val => onEnteredProp('label', val)" />
        </div>
        <div v-if="hasTooltip" class="row align-center items-center justify-between q-mt-sm">
          <label for="form-tooltip" @click="onClickLabel(propTooltipInputRef)">
            <span class="text-body2">
              Texto auxiliar
            </span>
            <q-icon name="info" :color="dark.isActive ? 'grey' : 'grey-13'" class="cursor-pointer">
              <q-tooltip class="bg-grey-10" :offset="[10, 10]">
                Apenas exibido em combinação com cabeçalho
              </q-tooltip>
            </q-icon>
          </label>
          <q-input id="form-tooltip" ref="propTooltipInputRef" v-model.trim="elementStates.tooltip" hide-bottom-space
            filled class="mw-200" color="cyan-8" dense type="text"
            @update:model-value="val => onEnteredProp('info', val)" />
        </div>
        <div v-if="hasPlaceholder" class="row align-center items-center justify-between q-mt-sm">
          <label for="form-placeholder" @click="onClickLabel(propPlaceholderInputRef)">
            <span class="text-body2">
              Placeholder
            </span>
          </label>
          <q-input id="form-placeholder" ref="propPlaceholderInputRef" v-model.trim="elementStates.placeholder"
            hide-bottom-space filled class="mw-200" color="cyan-8" dense type="text"
            @update:model-value="val => onEnteredProp('placeholder', val)" />
        </div>

      </div>
    </q-card-section>
    <q-separator :color="dark.isActive ? 'grey-9' : 'blue-grey-1'" />
    <q-card-section v-if="hasDescription">
      <div class="row align-center items-center justify-between">
        <label for="form-description" @click="onClickLabel(propDescriptionInputRef)">
          <span class="text-body2">
            Descrição
          </span>
        </label>
        <q-input id="form-description" ref="propDescriptionInputRef" v-model.trim="elementStates.description"
          hide-bottom-space filled class="mw-200" color="cyan-8" dense type="text"
          @update:model-value="val => onEnteredProp('description', val)" />
      </div>
    </q-card-section>
  </q-card>
</template>
