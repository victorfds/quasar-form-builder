<script setup lang="ts">
import { htmlTypes } from '~/constants'

const { dark } = useQuasar()
const formStore = useFormStore()
const { onEnteredProp } = formStore

const elementStates = reactive<{
  type?: { label: string, value: string }
  content?: string
  src?: string
  alt?: string
  href?: string
}>({
  type: htmlTypes.find(htmlType => htmlType.value === formStore.activeField?.$el),
  content: formStore.activeField?.children || '',
  src: formStore.activeField?.attrs?.src || '',
  alt: formStore.activeField?.attrs?.alt || '',
  href: formStore.activeField?.attrs?.href || '',
})

const propTypeRef = ref<HTMLInputElement | null>(null)

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

function updateAttr(name: string, value?: string) {
  onEnteredProp('attrs', `${name}: ${value || ''}`)
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
        <q-select
          id="form-type" ref="propTypeRef" :model-value="elementStates.type" hide-bottom-space filled
          class="mw-200 full-width" color="cyan-8" dense :options="htmlTypes"
          style="max-width: 200px;" @update:model-value="onTypeUpdateModelValue"
        />
      </div>
    </q-card-section>
    <q-separator :color="dark.isActive ? 'grey-9' : 'blue-grey-1'" />
    <q-card-section>
      <div>
        <q-input
          v-if="formStore.activeField?.$el !== 'img'" v-model="elementStates.content" label="Conteúdo" hide-bottom-space filled color="secondary" dense
          type="textarea" @blur="onBlurContentInput"
        />
        <template v-if="formStore.activeField?.$el === 'img'">
          <q-input
            v-model="elementStates.src" label="URL da imagem" hide-bottom-space filled color="secondary" dense
            @blur="updateAttr('src', elementStates.src)"
          />
          <q-input
            v-model="elementStates.alt" label="Texto alternativo" hide-bottom-space filled color="secondary" dense
            class="q-mt-sm" @blur="updateAttr('alt', elementStates.alt)"
          />
        </template>
        <q-input
          v-if="formStore.activeField?.$el === 'a'" v-model="elementStates.href" label="URL do link"
          hide-bottom-space filled color="secondary" dense class="q-mt-sm" @blur="updateAttr('href', elementStates.href)"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<style lang="scss">
.mw-200 {
  max-width: 200px;
}
</style>
