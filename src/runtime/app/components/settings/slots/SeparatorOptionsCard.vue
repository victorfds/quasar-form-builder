<script setup lang="ts">
const formStore = useFormStore()
const { onEnteredProp } = formStore

const elementStates = reactive({
  vertical: Boolean(formStore.activeField?.vertical),
  inset: Boolean(formStore.activeField?.inset),
  spaced: Boolean(formStore.activeField?.spaced),
  color: String(formStore.activeField?.color || ''),
  size: String(formStore.activeField?.size || ''),
})

const colorOptions = [
  { label: 'Padrão', value: '' },
  { label: 'Primária', value: 'primary' },
  { label: 'Secundária', value: 'secondary' },
  { label: 'Cinza', value: 'grey-5' },
  { label: 'Escura', value: 'grey-9' },
]

const colorSelectRef = ref<HTMLInputElement | null>(null)
const sizeInputRef = ref<HTMLInputElement | null>(null)

function onClickLabel(refElement: HTMLInputElement | null) {
  refElement?.focus()
}
</script>

<template>
  <q-card flat>
    <q-card-section>
      <div class="column q-gutter-sm">
        <div class="row align-center items-center justify-between">
          <label for="separator-vertical">
            <span class="text-body2">Vertical</span>
          </label>
          <q-toggle
            id="separator-vertical"
            :model-value="elementStates.vertical"
            color="primary"
            @update:model-value="val => { elementStates.vertical = val; onEnteredProp('vertical', val) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="separator-spaced">
            <span class="text-body2">Espaçado</span>
          </label>
          <q-toggle
            id="separator-spaced"
            :model-value="elementStates.spaced"
            color="primary"
            @update:model-value="val => { elementStates.spaced = val; onEnteredProp('spaced', val) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="separator-inset">
            <span class="text-body2">Recuado</span>
          </label>
          <q-toggle
            id="separator-inset"
            :model-value="elementStates.inset"
            color="primary"
            @update:model-value="val => { elementStates.inset = val; onEnteredProp('inset', val) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="separator-color" @click="onClickLabel(colorSelectRef)">
            <span class="text-body2">Cor</span>
          </label>
          <q-select
            id="separator-color"
            ref="colorSelectRef"
            :model-value="elementStates.color"
            :options="colorOptions"
            emit-value
            map-options
            hide-bottom-space
            filled
            class="mw-200"
            color="cyan-8"
            dense
            @update:model-value="val => { elementStates.color = String(val || ''); onEnteredProp('color', elementStates.color) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="separator-size" @click="onClickLabel(sizeInputRef)">
            <span class="text-body2">Espessura</span>
          </label>
          <q-input
            id="separator-size"
            ref="sizeInputRef"
            :model-value="elementStates.size"
            hide-bottom-space
            filled
            class="mw-200"
            color="cyan-8"
            dense
            placeholder="1px"
            @update:model-value="val => { elementStates.size = String(val || ''); onEnteredProp('size', elementStates.size) }"
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>
