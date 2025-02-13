<script setup lang="ts">
import { htmlTypes } from "~/constants"

const { dark, localStorage } = useQuasar()
const formStore = useFormStore()
const { onEnteredProp } = formStore

const elementsClosed = localStorage.getItem('elements-closed')

const elementStates = reactive<{
  type?: { label: string, value: string },
  content?: string
}>({
  type: htmlTypes.find(htmlType => htmlType.value === formStore.activeField?.$el),
  content: formStore.activeField?.children || ''
})

const propTypeRef = ref<HTMLInputElement | null>(null)

watch(() => formStore.activeField, (newVal) => {
  elementStates.type = htmlTypes.find(htmlType => htmlType.value === newVal?.$el)
  elementStates.content = newVal?.children
}, { deep: true })

function onClickLabel(refElement: HTMLInputElement | null, { select = false }: { select?: boolean } = {}) {
  refElement?.focus()
  if (select) {
    refElement?.select()
  }
}

function onTypeUpdateModelValue(val: any) {
  elementStates.type = val
  onEnteredProp('$el', val.value)
}

function onBlurContentInput(_: Event) {
  const trimmedValue = elementStates.content?.trim()
  onEnteredProp('children', trimmedValue)
}
</script>
<template>
  <q-card flat>
    <q-card-section>
      <div class="row align-center items-center justify-between q-mt-sm">
        <label for="form-type" @click="onClickLabel(propTypeRef)">
          <span class="text-body2">
            Tipo
          </span>
        </label>
        <q-select id="form-type" ref="propTypeRef" :model-value="elementStates.type" hide-bottom-space filled
          class="mw-200 full-width" color="cyan-8" dense :options="htmlTypes"
          @update:model-value="onTypeUpdateModelValue" style="max-width: 200px;" />
      </div>
    </q-card-section>
    <q-separator :color="dark.isActive ? 'grey-9' : 'blue-grey-1'" />
    <q-card-section>
      <div>
        <q-input label="Conteúdo" v-model="elementStates.content" hide-bottom-space filled color="secondary" dense
          type="textarea" @blur="onBlurContentInput" />
      </div>
    </q-card-section>
  </q-card>
</template>

<style lang="scss">
.mw-200 {
  max-width: 200px;
}
</style>
