<script setup lang="ts">
const formStore = useFormStore()
const { onEnteredProp } = formStore

const elementStates = reactive({
  fieldStyle: formStore.activeField?.outlined
    ? 'outlined'
    : formStore.activeField?.standout
      ? 'standout'
      : formStore.activeField?.borderless
        ? 'borderless'
        : 'filled',
  rounded: Boolean(formStore.activeField?.rounded),
  square: Boolean(formStore.activeField?.square),
  dark: Boolean(formStore.activeField?.dark),
})

function updateFieldStyle(value: string) {
  elementStates.fieldStyle = value
  onEnteredProp('filled', value === 'filled')
  onEnteredProp('outlined', value === 'outlined')
  onEnteredProp('standout', value === 'standout')
  onEnteredProp('borderless', value === 'borderless')
}

function updateBooleanProp(propName: 'rounded' | 'square' | 'dark', value: boolean) {
  elementStates[propName] = value
  onEnteredProp(propName, value)
}
</script>

<template>
  <q-card flat>
    <q-card-section>
      <div class="row align-center items-center justify-between">
        <label for="field-style">
          <span class="text-body2">Aparência</span>
        </label>
        <q-btn-toggle
          id="field-style"
          :model-value="elementStates.fieldStyle"
          no-wrap
          unelevated
          dense
          no-caps
          toggle-color="primary"
          color="grey-10"
          text-color="white"
          :options="[
            { label: 'Filled', value: 'filled' },
            { label: 'Outlined', value: 'outlined' },
            { label: 'Standout', value: 'standout' },
            { label: 'Borderless', value: 'borderless' },
          ]"
          @update:model-value="updateFieldStyle"
        />
      </div>

      <div class="row align-center items-center justify-between q-mt-sm">
        <label for="field-rounded">
          <span class="text-body2">Arredondado</span>
        </label>
        <q-toggle
          id="field-rounded"
          :model-value="elementStates.rounded"
          color="primary"
          @update:model-value="val => updateBooleanProp('rounded', val)"
        />
      </div>

      <div class="row align-center items-center justify-between q-mt-sm">
        <label for="field-square">
          <span class="text-body2">Quadrado</span>
        </label>
        <q-toggle
          id="field-square"
          :model-value="elementStates.square"
          color="primary"
          @update:model-value="val => updateBooleanProp('square', val)"
        />
      </div>

      <div class="row align-center items-center justify-between q-mt-sm">
        <label for="field-dark">
          <span class="text-body2">Forçar escuro</span>
        </label>
        <q-toggle
          id="field-dark"
          :model-value="elementStates.dark"
          color="primary"
          @update:model-value="val => updateBooleanProp('dark', val)"
        />
      </div>
    </q-card-section>
  </q-card>
</template>
