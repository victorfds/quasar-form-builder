<script setup lang="ts">
const formStore = useFormStore()
const { onEnteredProp } = formStore

const isOptionGroup = computed(() => formStore.activeField?.$formkit === 'q-option-group')
const isBtnToggle = computed(() => formStore.activeField?.$formkit === 'q-btn-toggle')

const elementStates = reactive({
  inline: Boolean(formStore.activeField?.inline),
  leftLabel: Boolean(formStore.activeField?.leftLabel),
  multiple: Boolean(formStore.activeField?.multiple),
  spread: Boolean(formStore.activeField?.spread),
  rounded: Boolean(formStore.activeField?.rounded),
})
</script>

<template>
  <q-card flat>
    <q-card-section>
      <div class="column q-gutter-sm">
        <template v-if="isOptionGroup">
          <div class="row align-center items-center justify-between">
            <label for="choice-inline">
              <span class="text-body2">Em linha</span>
            </label>
            <q-toggle
              id="choice-inline"
              :model-value="elementStates.inline"
              color="primary"
              @update:model-value="val => { elementStates.inline = val; onEnteredProp('inline', val) }"
            />
          </div>

          <div class="row align-center items-center justify-between">
            <label for="choice-left-label">
              <span class="text-body2">Label à esquerda</span>
            </label>
            <q-toggle
              id="choice-left-label"
              :model-value="elementStates.leftLabel"
              color="primary"
              @update:model-value="val => { elementStates.leftLabel = val; onEnteredProp('leftLabel', val) }"
            />
          </div>
        </template>

        <template v-if="isBtnToggle">
          <div class="row align-center items-center justify-between">
            <label for="choice-multiple">
              <span class="text-body2">Múltiplo</span>
            </label>
            <q-toggle
              id="choice-multiple"
              :model-value="elementStates.multiple"
              color="primary"
              @update:model-value="val => { elementStates.multiple = val; onEnteredProp('multiple', val) }"
            />
          </div>

          <div class="row align-center items-center justify-between">
            <label for="choice-spread">
              <span class="text-body2">Distribuir largura</span>
            </label>
            <q-toggle
              id="choice-spread"
              :model-value="elementStates.spread"
              color="primary"
              @update:model-value="val => { elementStates.spread = val; onEnteredProp('spread', val) }"
            />
          </div>

          <div class="row align-center items-center justify-between">
            <label for="choice-rounded">
              <span class="text-body2">Arredondado</span>
            </label>
            <q-toggle
              id="choice-rounded"
              :model-value="elementStates.rounded"
              color="primary"
              @update:model-value="val => { elementStates.rounded = val; onEnteredProp('rounded', val) }"
            />
          </div>
        </template>
      </div>
    </q-card-section>
  </q-card>
</template>
