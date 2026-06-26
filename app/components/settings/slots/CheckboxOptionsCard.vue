<script setup lang="ts">
const formStore = useFormStore()
const { onEnteredProp } = formStore

const elementStates = reactive<{
  trueValue?: string
  falseValue?: string
}>({
  trueValue: formStore.activeField?.['true-value'],
  falseValue: formStore.activeField?.['false-value'],
})
const propTrueValueInputRef = ref<HTMLInputElement | null>(null)
const propFalseValueInputRef = ref<HTMLInputElement | null>(null)

watch(() => formStore.activeField, (newVal) => {
  elementStates.trueValue = newVal?.['true-value']
  elementStates.falseValue = newVal?.['false-value']
}, { deep: true })

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
      </div>
    </q-card-section>
  </q-card>
</template>

<style lang="scss" scoped>
.mw-180 {
  max-width: 180px;
}
</style>
