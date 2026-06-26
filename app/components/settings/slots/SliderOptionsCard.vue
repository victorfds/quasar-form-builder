<script setup lang="ts">
const formStore = useFormStore()
const { onEnteredProp } = formStore

const elementStates = reactive({
  min: formStore.activeField?.min ?? 0,
  max: formStore.activeField?.max ?? 100,
  step: formStore.activeField?.step ?? 1,
  vertical: Boolean(formStore.activeField?.vertical),
})

watch(() => formStore.activeField, (field) => {
  elementStates.min = field?.min ?? 0
  elementStates.max = field?.max ?? 100
  elementStates.step = field?.step ?? 1
  elementStates.vertical = Boolean(field?.vertical)
}, { deep: true })
</script>

<template>
  <q-card flat>
    <q-card-section>
      <div class="column q-gutter-sm">
        <div class="row align-center items-center justify-between">
          <label><span class="text-body2">Mínimo</span></label>
          <q-input
            :model-value="elementStates.min"
            type="number"
            hide-bottom-space
            filled
            class="mw-200"
            color="cyan-8"
            dense
            @update:model-value="val => { elementStates.min = val; onEnteredProp('min', Number(val)) }"
          />
        </div>
        <div class="row align-center items-center justify-between">
          <label><span class="text-body2">Máximo</span></label>
          <q-input
            :model-value="elementStates.max"
            type="number"
            hide-bottom-space
            filled
            class="mw-200"
            color="cyan-8"
            dense
            @update:model-value="val => { elementStates.max = val; onEnteredProp('max', Number(val)) }"
          />
        </div>
        <div class="row align-center items-center justify-between">
          <label><span class="text-body2">Passo</span></label>
          <q-input
            :model-value="elementStates.step"
            type="number"
            hide-bottom-space
            filled
            class="mw-200"
            color="cyan-8"
            dense
            @update:model-value="val => { elementStates.step = val; onEnteredProp('step', Number(val)) }"
          />
        </div>
        <div v-if="formStore.activeField?.$formkit === 'q-slider'" class="row align-center items-center justify-between">
          <label><span class="text-body2">Vertical</span></label>
          <q-toggle
            :model-value="elementStates.vertical"
            color="primary"
            @update:model-value="val => { elementStates.vertical = val; onEnteredProp('vertical', val) }"
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>
