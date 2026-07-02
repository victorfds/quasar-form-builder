<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useFormStore } from '#qfb/stores/formStore'

const formStore = useFormStore()
const { onEnteredProp } = formStore

const elementStates = reactive<{
  trueValue?: string
  falseValue?: string
  leftLabel?: boolean
  toggleIndeterminate?: boolean
}>({
  trueValue: formStore.activeField?.['true-value'],
  falseValue: formStore.activeField?.['false-value'],
  leftLabel: Boolean(formStore.activeField?.leftLabel),
  toggleIndeterminate: Boolean(formStore.activeField?.toggleIndeterminate),
})
const propTrueValueInputRef = ref<HTMLInputElement | null>(null)
const propFalseValueInputRef = ref<HTMLInputElement | null>(null)

function onClickLabel(refElement: HTMLInputElement | null, { select = false }: { select?: boolean } = {}) {
  refElement?.focus()
  if (select) {
    refElement?.select()
  }
}
</script>

<template>
  <q-card flat>
    <q-card-section>
      <div>
        <div class="row align-center items-center justify-between">
          <label for="form-true-value" @click="onClickLabel(propTrueValueInputRef)">
            <span class="text-body2">
              Valor verdadeiro
            </span>
          </label>
          <q-input
            id="form-true-value" ref="propTrueValueInputRef" :model-value="elementStates.trueValue"
            placeholder="verdadeiro" hide-bottom-space filled class="mw-180" color="secondary" dense type="text" @update:model-value="val => {
              const stringfied = String(val).trim()
              elementStates.trueValue = stringfied
              onEnteredProp('true-value', stringfied)
            }"
          />
        </div>
        <div class="row align-center items-center justify-between q-mt-sm">
          <label for="form-false-value" @click="onClickLabel(propFalseValueInputRef)">
            <span class="text-body2">
              Valor falso
            </span>
          </label>
          <q-input
            id="form-false-value" ref="propFalseValueInputRef" :model-value="elementStates.falseValue"
            placeholder="falso" hide-bottom-space filled class="mw-180" color="secondary" dense type="text" @update:model-value="val => {
              const stringfied = String(val).trim()
              elementStates.falseValue = stringfied
              onEnteredProp('false-value', stringfied)
            }"
          />
        </div>
        <div class="row align-center items-center justify-between q-mt-sm">
          <label for="form-left-label">
            <span class="text-body2">
              Label à esquerda
            </span>
          </label>
          <q-toggle
            id="form-left-label"
            :model-value="elementStates.leftLabel"
            color="primary"
            @update:model-value="val => {
              elementStates.leftLabel = val
              onEnteredProp('leftLabel', val)
            }"
          />
        </div>
        <div v-if="formStore.activeField?.$formkit === 'q-checkbox'" class="row align-center items-center justify-between q-mt-sm">
          <label for="form-toggle-indeterminate">
            <span class="text-body2">
              Indeterminado
            </span>
          </label>
          <q-toggle
            id="form-toggle-indeterminate"
            :model-value="elementStates.toggleIndeterminate"
            color="primary"
            @update:model-value="val => {
              elementStates.toggleIndeterminate = val
              onEnteredProp('toggleIndeterminate', val)
            }"
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<style lang="scss" scoped>
.mw-180 {
  max-width: 180px;
}
</style>
