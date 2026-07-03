<script setup lang="ts">
import { except } from '@formkit/utils'
import { useQuasar } from 'quasar'
import { isDevelopment } from 'std-env'
import { computed, ref, resolveComponent } from 'vue'
import { htmlTypes } from '#qfb/constants'
import { useFormStore } from '#qfb/stores/formStore'
import { highlightJson } from '#qfb/utils/highlight'

const model = defineModel<boolean>()
const { dark } = useQuasar()
const formStore = useFormStore()
const { changePreviewWidth, togglePreviewFullWidth } = formStore

// Possible properties are: ["properties","submission","validation","layout"]
const SettingsQBtnConfigComponent = resolveComponent('SettingsQBtnConfig')
const SettingsQInputConfigComponent = resolveComponent('SettingsQInputConfig')
const SettingsQSelectConfigComponent = resolveComponent('SettingsQSelectConfig')
const SettingsQCheckboxConfigComponent = resolveComponent('SettingsQCheckboxConfig')
const SettingsQSeparatorConfigComponent = resolveComponent('SettingsQSeparatorConfig')
const SettingsHTMLConfigComponent = resolveComponent('SettingsHTMLConfig')
const SettingsDefaultNoConfigComponent = resolveComponent('SettingsDefaultNoConfig')
const SettingsQDateConfigComponent = resolveComponent('SettingsQDateConfig')
const SettingsQTimeConfigComponent = resolveComponent('SettingsQTimeConfig')
const SettingsQFileConfigComponent = resolveComponent('SettingsQFileConfig')
const SettingsQStepperConfigComponent = resolveComponent('SettingsQStepperConfig')
const SettingsQTabConfigComponent = resolveComponent('SettingsQTabConfig')
const SettingsQOptionsConfigComponent = resolveComponent('SettingsQOptionsConfig')
const SettingsQSliderConfigComponent = resolveComponent('SettingsQSliderConfig')
const SettingsQMatrixConfigComponent = resolveComponent('SettingsQMatrixConfig')
const SettingsQStructureConfigComponent = resolveComponent('SettingsQStructureConfig')
const SettingsQFieldConfigComponent = resolveComponent('SettingsQFieldConfig')

const formNameInputRef = ref<HTMLElement | null>(null)
const useHighlight = await highlightJson()

const htmlValues = computed(() => {
  const validValues = except(formStore.values, ['submit', 'slots', 'empty', 'eq'])
  return useHighlight(validValues, dark.isActive)
})

const getComponentSettings = computed(() => {
  if (formStore.activeField?.$formkit === 'q-btn') return SettingsQBtnConfigComponent
  if (formStore.activeField?.$formkit === 'q-input' && formStore.activeField?.inputType !== 'file') return SettingsQInputConfigComponent
  if (formStore.activeField?.$formkit === 'q-input' && formStore.activeField?.inputType === 'file') return SettingsQFileConfigComponent
  if (formStore.activeField?.$formkit === 'q-file') return SettingsQFileConfigComponent
  if (formStore.activeField?.$formkit === 'q-select') return SettingsQSelectConfigComponent
  if (['q-option-group', 'q-btn-toggle'].includes(formStore.activeField?.$formkit as string)) return SettingsQOptionsConfigComponent
  if (formStore.activeField?.$formkit === 'q-checkbox') return SettingsQCheckboxConfigComponent
  if (formStore.activeField?.$formkit === 'q-toggle') return SettingsQCheckboxConfigComponent
  if (formStore.activeField?.$formkit === 'q-separator' || formStore.activeField?.$el === 'hr') return SettingsQSeparatorConfigComponent
  if (formStore.activeField?.$formkit === 'q-time') return SettingsQTimeConfigComponent
  if (['q-date', 'q-date-multiple', 'q-date-range', 'q-datetime'].includes(formStore.activeField?.$formkit as string)) return SettingsQDateConfigComponent
  if (['q-slider', 'q-range'].includes(formStore.activeField?.$formkit as string)) return SettingsQSliderConfigComponent
  if (formStore.activeField?.$formkit === 'q-matrix') return SettingsQMatrixConfigComponent
  if (['q-container', 'q-tabs', 'q-grid', 'q-table-structure', 'q-list-structure'].includes(formStore.activeField?.$formkit as string)) return SettingsQStructureConfigComponent
  if (['q-editor', 'q-signature'].includes(formStore.activeField?.$formkit as string)) return SettingsQFieldConfigComponent

  if (formStore.activeField?.$el && htmlTypes.map(htmlType => htmlType.value).includes(formStore.activeField?.$el as string)) return SettingsHTMLConfigComponent

  return SettingsDefaultNoConfigComponent
})

const activeConfigKey = computed(() => [
  formStore.activeField?.name,
  formStore.activeField?.$formkit,
  formStore.activeField?.$el,
  formStore.activeStepConfig?.name,
  formStore.activeTabConfig?.name,
].filter(Boolean).join(':') || 'empty')

const drawerSlotProps = computed(() => ({
  formStore,
  activeField: formStore.activeField,
  activeStepConfig: formStore.activeStepConfig,
  activeTabConfig: formStore.activeTabConfig,
  previewMode: formStore.formSettings.previewMode,
  values: formStore.values,
}))

function onClickLabelFormName() {
  formNameInputRef.value?.focus()
}
</script>

<template>
  <q-drawer v-model="model" class="no-scroll" show-if-above persistent side="right" :width="340" data-drawer="right">
    <q-scroll-area class="fit" visible>
      <slot v-if="$slots.before" name="before" v-bind="drawerSlotProps" />
      <div v-if="formStore.formSettings.previewMode === 'editing' && formStore.activeField">
        <component :is="getComponentSettings" :key="activeConfigKey" />
        <div v-if="isDevelopment" v-html="useHighlight(formStore.activeField, dark.isActive)" />
      </div>
      <div v-else-if="formStore.formSettings.previewMode === 'editing' && formStore.activeStepConfig">
        <component :is="SettingsQStepperConfigComponent" :key="activeConfigKey" />
        <div v-if="isDevelopment" v-html="useHighlight(formStore.activeStepConfig, dark.isActive)" />
      </div>
      <div v-else-if="formStore.formSettings.previewMode === 'editing' && formStore.activeTabConfig">
        <component :is="SettingsQTabConfigComponent" :key="activeConfigKey" />
        <div v-if="isDevelopment" v-html="useHighlight(formStore.activeTabConfig, dark.isActive)" />
      </div>
      <div v-else-if="formStore.formSettings.previewMode === 'editing' && !formStore.activeField">
        <q-list separator>
          <q-expansion-item
            :header-class="{ 'text-weight-semibold text-subtitle2': true, 'bg-grey-9 text-grey-11': dark.isActive, 'bg-blue-grey-1 text-blue-grey-10': !dark.isActive }"
            :expand-icon-class="dark.isActive ? 'text-grey-11' : 'text-grey-10'" label="Propriedades" default-opened
          >
            <q-card>
              <q-card-section>
                <div>
                  <div class="row align-center items-center justify-between">
                    <label @click="onClickLabelFormName">
                      Nome
                    </label>
                    <q-input
                      id="form-name" ref="formNameInputRef" v-model.trim="formStore.formSettings.formName" filled
                      color="primary" dense type="text"
                    />
                  </div>

                  <div class="row align-center items-center justify-between q-mt-sm">
                    <div>
                      <label class="">Pré-visualizar largura</label>
                      <q-checkbox
                        :model-value="formStore.formSettings.preview.isFullWidth" label="Total" size="sm"
                        @update:model-value="togglePreviewFullWidth"
                      />
                    </div>
                    <q-input
                      v-if="!formStore.formSettings.preview.isFullWidth"
                      :model-value="formStore.formSettings.preview.width" suffix="px" filled color="primary" dense
                      type="number" style="max-width: 100px;" @update:model-value="changePreviewWidth"
                    />
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
              <div v-html="htmlValues" />
            </q-card-section>
          </q-card>
        </q-list>
      </div>
      <slot v-if="$slots.default" v-bind="drawerSlotProps" />
      <slot v-if="$slots.after" name="after" v-bind="drawerSlotProps" />
    </q-scroll-area>
  </q-drawer>
</template>
