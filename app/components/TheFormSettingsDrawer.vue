<script setup lang="ts">
import { createHighlighter } from 'shiki'

const model = defineModel<boolean>()
const { dark, localStorage } = useQuasar()
const formStore = useFormStore()
const { setActiveField, copyField, removeField, changePreviewWidth, togglePreviewFullWidth } = formStore

// Possible properties are: ["properties","submission","validation","layout"]
const formClosed = JSON.parse(localStorage.getItem('form-closed') || '[]')
const highlighter = await createHighlighter({ langs: ['json'], themes: ['vitesse-dark', 'vitesse-light'] })
const SettingsQBtnConfigComponent = resolveComponent('SettingsQBtnConfig')

const formNameInputRef = ref<HTMLElement | null>(null)

const htmlValues = computed(() => {
  return highlighter.codeToHtml(JSON.stringify(formStore.values, null, 2), {
    lang: 'json',
    theme: dark.isActive ? 'vitesse-dark' : 'vitesse-light',
    colorReplacements: {
      'vitesse-dark': {
        '#121212': '#1D1D1D'
      },
    }
  })
})

const getComponentSettings = computed(() => {
  if (formStore.activeField?.$formkit === 'q-btn') return SettingsQBtnConfigComponent

  return ''
})

function onClickLabelFormName() {
  formNameInputRef.value?.focus()
}

</script>

<template>
  <q-drawer v-model="model" class="no-scroll" show-if-above persistent side="right" :width="340">
    <q-scroll-area class="fit" visible>
      <div v-if="formStore.formSettings.previewMode === 'editing' && formStore.activeField">
        <component :is="getComponentSettings" />
      </div>
      <div v-else-if="formStore.formSettings.previewMode === 'editing' && !formStore.activeField">
        <q-list separator>
          <q-expansion-item
            :header-class="{ 'text-weight-semibold text-subtitle2': true, 'bg-grey-9 text-grey-11': dark.isActive, 'bg-blue-grey-1 text-blue-grey-10': !dark.isActive }"
            :expand-icon-class="dark.isActive ? 'text-grey-11' : 'text-grey-10'" label="Propriedades" default-opened>
            <q-card>
              <q-card-section>
                <div>
                  <div class="row align-center items-center justify-between">
                    <label for="form-name" @click="onClickLabelFormName">
                      Nome
                    </label>
                    <q-input id="form-name" ref="formNameInputRef" v-model.trim="formStore.formSettings.formName" filled
                      color="cyan-8" dense type="text" />
                  </div>

                  <div class="row align-center items-center justify-between q-mt-sm">
                    <div>
                      <label class="">Pré-visualizar largura</label>
                      <q-checkbox :model-value="formStore.formSettings.preview.isFullWidth" label="Total" size="sm"
                        @update:model-value="togglePreviewFullWidth" />
                    </div>
                    <q-input v-if="!formStore.formSettings.preview.isFullWidth"
                      :model-value="formStore.formSettings.preview.width" suffix="px" filled color="cyan-8" dense
                      type="number" style="max-width: 100px;" @update:model-value="changePreviewWidth" />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </q-list>
      </div>
      <div v-else-if="formStore.formSettings.previewMode === 'previewing'">
        <q-list separator>
          <q-card flat>
            <q-card-section>
              <div>
                <span class="text-weight-semibold">
                  Informações
                </span>

              </div>
            </q-card-section>
            <q-card-section>
              <div v-html="htmlValues">
              </div>
            </q-card-section>
          </q-card>
        </q-list>
      </div>
    </q-scroll-area>
  </q-drawer>
</template>
