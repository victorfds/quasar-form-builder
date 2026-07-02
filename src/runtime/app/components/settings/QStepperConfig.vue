<script setup lang="ts">
import { useQuasar } from 'quasar'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useEventListener } from '#qfb/composables/useEventListener'
import { useFormStore } from '#qfb/stores/formStore'

const { dark } = useQuasar()
const formStore = useFormStore()

const activeStep = computed(() => formStore.activeStepConfig)
const stepTitle = computed(() => activeStep.value?.label || activeStep.value?.name || '')
const stepsCount = computed(() => {
  const stepper = formStore.formFields.find(field => field.$formkit === 'q-stepper') as { steps?: unknown[] } | undefined
  return stepper?.steps?.length || 0
})
const stepsList = computed(() => {
  const stepper = formStore.formFields.find(field => field.$formkit === 'q-stepper') as { steps?: { name: string }[] }
    | undefined
  return stepper?.steps || []
})
const isLastStep = computed(() => {
  if (!activeStep.value) return false
  const index = stepsList.value.findIndex(step => step.name === activeStep.value?.name)
  return index !== -1 && index === stepsList.value.length - 1
})
const activeStepName = computed(() => activeStep.value?.name || null)

const labelInputRef = ref<{ focus: () => void } | null>(null)
const prevLabelInputRef = ref<{ focus: () => void } | null>(null)
const nextLabelInputRef = ref<{ focus: () => void } | null>(null)

const labelValue = computed(() => activeStep.value?.label || '')
const showPreviousValue = computed(() => activeStep.value?.showPrevious !== false)
const prevLabelValue = computed(() => activeStep.value?.prevLabel || '')
const nextLabelValue = computed(() => activeStep.value?.nextLabel || '')

async function focusStepLabel() {
  if (!activeStep.value) return
  await nextTick()
  labelInputRef.value?.focus()
}

let stopFocusStepLabel: (() => void) | undefined

onMounted(() => {
  stopFocusStepLabel = useEventListener(window, 'builder:focus-step-label', focusStepLabel)
})

onBeforeUnmount(() => {
  stopFocusStepLabel?.()
})

function onClickLabel(refElement: { focus: () => void } | null) {
  refElement?.focus()
}

function updateStepLabelValue(value: string | number | null) {
  if (!activeStep.value) return
  formStore.updateStepLabel(activeStep.value.name, String(value || ''))
}

function updateShowPrevious(value: boolean) {
  if (!activeStep.value) return
  formStore.updateStepLayout(activeStep.value.name, { showPrevious: value })
}

function updatePrevLabel(value: string | number | null) {
  if (!activeStep.value) return
  formStore.updateStepLayout(activeStep.value.name, { prevLabel: String(value || '') })
}

function updateNextLabel(value: string | number | null) {
  if (!activeStep.value) return
  formStore.updateStepLayout(activeStep.value.name, { nextLabel: String(value || '') })
}

function closeStepConfig() {
  formStore.setActiveStepConfig(null)
}

function removeStep() {
  if (!activeStep.value) return
  formStore.removeStep(activeStep.value.name)
}

function duplicateStep() {
  if (!activeStep.value) return
  formStore.duplicateStep(activeStep.value.name)
}

function updateStepCondition(prop: 'if' | 'validation' | 'disable' | 'readonly', value: any) {
  if (!activeStepName.value || prop !== 'if') return
  formStore.updateStepProp(activeStepName.value, prop, value)
}
</script>

<template>
  <q-list separator style="max-width: 340px;">
    <q-item :class="{ 'bg-grey-9 text-grey-11': dark.isActive, 'bg-blue-grey-1 text-blue-grey-10': !dark.isActive }">
      <q-item-section avatar>
        <q-btn
          size="sm" flat dense round icon="close" :color="dark.isActive ? 'grey-5' : 'blue-grey-8'"
          @click="closeStepConfig"
        />
      </q-item-section>

      <q-item-section>
        <q-item-label>
          <h6 class="break-all text-h6 no-margin">
            {{ stepTitle }}
          </h6>
        </q-item-label>
      </q-item-section>

      <q-item-section side>
        <div class="q-gutter-xs">
          <q-btn
            size="sm" flat dense round icon="o_content_copy" :color="dark.isActive ? 'grey-5' : 'blue-grey-8'"
            @click="duplicateStep"
          />
          <q-btn
            size="sm" flat dense round icon="o_delete" :color="dark.isActive ? 'grey-5' : 'blue-grey-8'"
            :disable="stepsCount <= 1" @click="removeStep"
          />
        </div>
      </q-item-section>
    </q-item>

    <q-expansion-item
      :header-class="{ 'text-weight-semibold text-subtitle2': true, 'bg-grey-9 text-grey-11': dark.isActive, 'bg-blue-grey-1 text-blue-grey-10': !dark.isActive }"
      :expand-icon-class="dark.isActive ? 'text-grey-5' : 'text-blue-grey-8'" label="Propriedades" default-opened
    >
      <q-card>
        <q-card-section>
          <div class="row align-center items-center justify-between">
            <label for="step-label" @click="onClickLabel(labelInputRef)">
              <span class="text-body2">
                Cabeçalho
              </span>
            </label>
            <q-input
              id="step-label" ref="labelInputRef" :model-value="labelValue" hide-bottom-space filled class="mw-200"
              color="cyan-8" dense type="text" @update:model-value="updateStepLabelValue"
            />
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <q-expansion-item
      :header-class="{ 'text-weight-semibold text-subtitle2': true, 'bg-grey-9 text-grey-11': dark.isActive, 'bg-blue-grey-1 text-blue-grey-10': !dark.isActive }"
      :expand-icon-class="dark.isActive ? 'text-grey-5' : 'text-blue-grey-8'" label="Layout"
    >
      <q-card>
        <q-card-section>
          <div class="row align-center items-center justify-between">
            <label for="step-show-previous">
              <span class="text-body2">
                Mostrar anterior
              </span>
            </label>
            <q-toggle id="step-show-previous" :model-value="showPreviousValue" color="primary" @update:model-value="updateShowPrevious" />
          </div>
          <div class="row align-center items-center justify-between q-mt-sm">
            <label for="step-prev-label" @click="onClickLabel(prevLabelInputRef)">
              <span class="text-body2">
                Texto do anterior
              </span>
            </label>
            <q-input
              id="step-prev-label" ref="prevLabelInputRef" :model-value="prevLabelValue" hide-bottom-space filled
              class="stepper-layout-input" color="cyan-8" dense type="text" placeholder="padrão"
              :disable="!showPreviousValue" @update:model-value="updatePrevLabel"
            />
          </div>
          <div class="row align-center items-center justify-between q-mt-sm">
            <label for="step-next-label" @click="onClickLabel(nextLabelInputRef)">
              <span class="text-body2">
                {{ isLastStep ? 'Texto do finalizar' : 'Texto do próximo' }}
              </span>
            </label>
            <q-input
              id="step-next-label" ref="nextLabelInputRef" :model-value="nextLabelValue" hide-bottom-space filled
              class="stepper-layout-input" color="cyan-8" dense type="text" placeholder="padrão"
              @update:model-value="updateNextLabel"
            />
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <q-expansion-item
      :header-class="{ 'text-weight-semibold text-subtitle2': true, 'bg-grey-9 text-grey-11': dark.isActive, 'bg-blue-grey-1 text-blue-grey-10': !dark.isActive }"
      :expand-icon-class="dark.isActive ? 'text-grey-5' : 'text-blue-grey-8'" label="Condições"
    >
      <SettingsSlotsConditionsCard
        v-if="activeStep"
        :key="activeStep?.name"
        no-conditions-message="A etapa não contém condições"
        save-to="if"
        :element="activeStep"
        :update-prop="updateStepCondition"
      />
    </q-expansion-item>
  </q-list>
</template>

<style scoped>
.stepper-layout-input {
  width: 160px;
}
</style>
