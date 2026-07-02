<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useFormStore } from '#qfb/stores/formStore'

const formStore = useFormStore()
const { onEnteredProp } = formStore

const defaultValueRef = ref<HTMLInputElement | null>(null)

const elementStates = reactive({
  defaultValue: formStore.activeField?.default == null ? '' : String(formStore.activeField.default),
  expressionValue: Boolean(formStore.activeField?.expressionValue),
  forceNumeric: Boolean(formStore.activeField?.forceNumeric),
  submitData: formStore.activeField?.ignore !== true,
})

function focusInput(inputRef: HTMLInputElement | null) {
  inputRef?.focus()
}

function updateDefaultValue(value: string | number | null) {
  elementStates.defaultValue = value == null ? '' : String(value)
  onEnteredProp('default', elementStates.defaultValue)
}

function updateExpressionValue(value: boolean) {
  elementStates.expressionValue = value
  onEnteredProp('expressionValue', value)
}

function updateForceNumeric(value: boolean) {
  elementStates.forceNumeric = value
  onEnteredProp('forceNumeric', value)
}

function updateSubmitData(value: boolean) {
  elementStates.submitData = value
  onEnteredProp('ignore', !value)
}
</script>

<template>
  <q-card flat>
    <q-card-section>
      <div class="row align-center items-center justify-between">
        <label for="hidden-default-value" @click="focusInput(defaultValueRef)">
          <span class="text-body2">
            Valor padrão
          </span>
        </label>
        <q-input
          id="hidden-default-value"
          ref="defaultValueRef"
          :model-value="elementStates.defaultValue"
          hide-bottom-space
          filled
          class="mw-200"
          color="cyan-8"
          dense
          type="text"
          @update:model-value="updateDefaultValue"
        />
      </div>

      <div class="row align-center items-center justify-between q-mt-sm">
        <label for="hidden-expression-value">
          <span class="text-body2">
            Usar valor de expressão
          </span>
        </label>
        <q-toggle
          id="hidden-expression-value"
          :model-value="elementStates.expressionValue"
          color="primary"
          @update:model-value="updateExpressionValue"
        />
      </div>

      <div class="row align-center items-center justify-between q-mt-sm">
        <label for="hidden-force-numeric">
          <span class="text-body2">
            Forçar valores numéricos
          </span>
        </label>
        <q-toggle
          id="hidden-force-numeric"
          :model-value="elementStates.forceNumeric"
          color="primary"
          @update:model-value="updateForceNumeric"
        />
      </div>

      <div class="row align-center items-center justify-between q-mt-sm">
        <label for="hidden-submit-data">
          <span class="text-body2">
            Submeter dados
          </span>
        </label>
        <q-toggle
          id="hidden-submit-data"
          :model-value="elementStates.submitData"
          color="primary"
          @update:model-value="updateSubmitData"
        />
      </div>
    </q-card-section>
  </q-card>
</template>
