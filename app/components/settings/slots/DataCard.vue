<script setup lang="ts">
const { dark, localStorage } = useQuasar()
const formStore = useFormStore()
const { onEnteredProp } = formStore

const elementsClosed = localStorage.getItem('elements-closed')

const elementStates = reactive<{
  options?: { label: string, value: string }[]
}>({
  options: formStore.activeField?.options?.length ? toRaw(formStore.activeField?.options) : [{ label: '', value: '' }]
})

function addNewOption() {
  elementStates.options?.push({ label: '', value: '' })
}

function onBlurInput() {
  const hasValues = elementStates.options?.filter(opt => opt.value && opt.label)
  if (hasValues?.length) {
    onEnteredProp('options', hasValues)
  }

  if (!hasValues?.length) {
    onEnteredProp('options', [])
  }
}

function removeOption(index: number) {
  elementStates.options?.splice(index, 1)
  onBlurInput()
}
</script>
<template>
  <q-card flat>
    <q-card-section>
      <div class="text-subtitle2">Opções</div>
      <div v-for="(option, index) in elementStates.options" :key="index">
        <div class="row align-center items-center justify-between q-mt-sm">
          <q-btn size="xs" flat dense round icon="close" :color="dark.isActive ? 'grey-5' : 'blue-grey-8'"
            @click="removeOption(index)" />

          <q-input id="form-value" v-model.trim="option.value" placeholder="valor" hide-bottom-space filled
            class="mw-140" color="secondary" dense type="text" @blur="onBlurInput" />

          <q-input id="form-label" v-model.trim="option.label" placeholder="texto" hide-bottom-space filled
            class="mw-140" color="secondary" dense type="text" @blur="onBlurInput" />
        </div>
      </div>
      <q-btn class="q-mt-md" label="Adicionar campo" no-caps @click="addNewOption" color="primary" />
    </q-card-section>
  </q-card>
</template>

<style lang="scss">
.mw-140 {
  max-width: 140px;
}
</style>
