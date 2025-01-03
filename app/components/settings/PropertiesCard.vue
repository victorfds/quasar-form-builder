<script setup lang="ts">
import type {ColumnsType} from "~/types"
import type {FormKitSchemaDefinition} from "@formkit/core"

const {dark, localStorage} = useQuasar()
const formStore = useFormStore()
const {updatePropFromActiveField, onEnteredProp} = formStore

const elementsClosed = localStorage.getItem('elements-closed')

const elementStates = reactive<{
  name?: string
  nameError?: string
  label?: string
  tooltip?: string
  description?: string
}>({
  name: formStore.activeField?.name,
  label: formStore.activeField?.label,
  tooltip: formStore.activeField?.info,
  description: formStore.activeField?.description,
})
const propNameInputRef = ref<HTMLInputElement | null>(null)
const propLabelInputRef = ref<HTMLInputElement | null>(null)
const propTooltipInputRef = ref<HTMLInputElement | null>(null)
const propDescriptionInputRef = ref<HTMLInputElement | null>(null)

watch(() => formStore.activeField, (newVal) => {
  elementStates.name = newVal?.name
  elementStates.nameError = ''
}, {deep: true})

function onClickLabel(refElement: HTMLInputElement | null, {select = false}: { select?: boolean } = {}) {
  refElement?.focus()
  if (select) {
    refElement?.select()
  }
}

function onBlurName(_: Event) {
  elementStates.nameError = ''
  if (elementStates.name === formStore.activeField?.name)
    return

  const response = formStore.updateNameField(formStore.activeField?.name, elementStates.name)

  if (response?.message === 'name cannot be empty') {
    elementStates.nameError = 'Nome não pode ser vazio'
    return
  }

  if (response?.message === 'name already exists') {
    elementStates.nameError = 'Este nome já existe'
  }
}

function getOptionsBasedOnField(fieldName: string): FormKitSchemaDefinition {
  if (!fieldName) return []

  const field = formStore.formFields.find(element => element.name === fieldName)
  if (field?.options) {
    return field?.options
  }
  return []
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
                   :error="Boolean(elementStates.nameError)" :error-message="elementStates.nameError"
                   hide-bottom-space
                   filled class="mw-200" color="secondary" dense type="text" @blur="onBlurName"/>
        </div>
      </div>
    </q-card-section>
    <q-separator :color="dark.isActive ? 'grey-9' : 'blue-grey-1'"/>
    <q-card-section>
      <div>
        <div class="row align-center items-center justify-between">
          <label for="form-label" @click="onClickLabel(propLabelInputRef)">
                <span class="text-body2">
                  Cabeçalho
                </span>
          </label>
          <q-input id="form-label" ref="propLabelInputRef" v-model.trim="elementStates.label" hide-bottom-space
                   filled class="mw-200" color="cyan-8" dense type="text"
                   @update:model-value="val => onEnteredProp('label', val)"/>
        </div>
        <div class="row align-center items-center justify-between q-mt-sm">
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
          <q-input id="form-tooltip" ref="propTooltipInputRef" v-model.trim="elementStates.tooltip"
                   hide-bottom-space filled class="mw-200" color="cyan-8" dense type="text"
                   @update:model-value="val => onEnteredProp('info', val)"/>
        </div>
      </div>
    </q-card-section>
    <q-separator :color="dark.isActive ? 'grey-9' : 'blue-grey-1'"/>
    <q-card-section>
      <div class="row align-center items-center justify-between">
        <label for="form-description" @click="onClickLabel(propDescriptionInputRef)">
              <span class="text-body2">
                Descrição
              </span>
        </label>
        <q-input id="form-description" ref="propDescriptionInputRef" v-model.trim="elementStates.description"
                 hide-bottom-space filled class="mw-200" color="cyan-8" dense type="text"
                 @update:model-value="val => onEnteredProp('description', val)"/>
      </div>
    </q-card-section>
  </q-card>
</template>