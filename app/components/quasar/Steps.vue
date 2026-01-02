<script setup lang="ts">
import type { FormKitFrameworkContext, FormKitSchemaDefinition } from '@formkit/core'
import type { LogicField } from '~/types'
import { builderModeKey, formBuilderDndKey, schemaDataKey } from '~/constants/injectionKeys'

type StepDefinition = {
  name: string
  label?: string
  showPrevious?: boolean
  prevLabel?: string
  nextLabel?: string
  if?: string
  children?: FormKitSchemaDefinition[]
}

const props = defineProps<{
  context: FormKitFrameworkContext & {
    steps?: StepDefinition[]
  }
}>()
const { context } = props

const { dark } = useQuasar()
const formStore = useFormStore()
const fieldUi = useFieldUi()
const schemaData = inject(schemaDataKey, computed(() => ({})))
const builderMode = inject(builderModeKey, false)
const isFormSettingsDrawerOpened = useState<boolean>('form-settings-drawer', () => false)
const builderDnd = inject(formBuilderDndKey, null) as Record<string, any> | null
const { activeStep, visitedSteps, steps: stepStates, stepPlugin } = useSteps()

const steps = computed(() => (props.context?.steps || []) as StepDefinition[])
const isEditing = computed(() => builderMode && formStore.formSettings.previewMode === 'editing')
const isPreviewEditing = computed(() => builderMode && formStore.formSettings.previewMode === 'editing')
const canDrag = computed(() => Boolean(isEditing.value && builderDnd))
const stepLabels = reactive<Record<string, string>>({})
const stepCanvasRefs = reactive<Record<string, HTMLElement | null>>({})
const stepperWrapperRef = ref<HTMLElement | null>(null)
const selectedHeaderEl = ref<HTMLElement | null>(null)
const headerListenerCleanup = ref<Array<() => void>>([])
const headerOverlayRect = ref<{ top: number; left: number; width: number; height: number } | null>(null)
const headerResizeObserver = ref<ResizeObserver | null>(null)
const selectedStepName = computed(() => formStore.activeStepConfigName)
const schemaValues = computed(() => unref(schemaData) || {})
const dndState = computed(() => ({
  activeNames: unref(builderDnd?.activeNameFields)?.active || [],
  hoverName: unref(builderDnd?.activeNameFields)?.hover,
  elementBeingDragged: unref(builderDnd?.elementBeingDragged),
  isUserDraggingOver: unref(builderDnd?.isUserDraggingOver),
  dragInIndicator: unref(builderDnd?.dragInIndicator),
  highlightDropArea: unref(builderDnd?.highlightDropArea),
  isDraggingStepper: unref(builderDnd?.isDraggingStepper),
  hasStepper: formStore.hasStepper,
}))

function normalizeLiteral(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  const unquoted = trimmed.replace(/^['"]|['"]$/g, '')
  if (unquoted === 'true') return true
  if (unquoted === 'false') return false
  const asNumber = Number(unquoted)
  if (!Number.isNaN(asNumber) && unquoted !== '') return asNumber
  return unquoted
}

function isEmptyValue(value: any) {
  const emptyFn = schemaValues.value?.empty
  if (typeof emptyFn === 'function') return emptyFn(value)
  if (Array.isArray(value)) return value.length === 0
  return value === '' || value === null || value === undefined
}

function isPlainRecord(value: unknown): value is Record<string, any> {
  if (!value || typeof value !== 'object') return false
  if (Array.isArray(value)) return false
  return Object.prototype.toString.call(value) === '[object Object]'
}

function getPathValue(source: unknown, path: string) {
  if (!path) return { found: false, value: undefined }
  const segments = path.split('.').filter(Boolean)
  let current: any = source

  for (const segment of segments) {
    if (!isPlainRecord(current) || !Object.prototype.hasOwnProperty.call(current, segment)) {
      return { found: false, value: undefined }
    }
    const next = current[segment]
    if (typeof next === 'function') return { found: false, value: undefined }
    current = next
  }

  return { found: true, value: current }
}

function findNestedValue(source: unknown, targetKey: string, visited = new WeakSet<object>()) {
  if (Array.isArray(source)) {
    for (const item of source) {
      if (isPlainRecord(item) || Array.isArray(item)) {
        const result = findNestedValue(item, targetKey, visited)
        if (result.found) return result
      }
    }
    return { found: false, value: undefined }
  }

  if (!isPlainRecord(source)) return { found: false, value: undefined }
  if (visited.has(source)) return { found: false, value: undefined }
  visited.add(source)

  if (Object.prototype.hasOwnProperty.call(source, targetKey)) {
    const direct = source[targetKey]
    if (typeof direct !== 'function') return { found: true, value: direct }
  }

  for (const key of Object.keys(source)) {
    const value = source[key]
    if (typeof value === 'function') continue
    if (isPlainRecord(value) || Array.isArray(value)) {
      const result = findNestedValue(value, targetKey, visited)
      if (result.found) return result
    }
  }

  return { found: false, value: undefined }
}

function getConditionValue(fieldName: string) {
  if (!fieldName) return undefined
  const source = schemaValues.value
  if (!source) return undefined

  if (fieldName.includes('.')) {
    const pathResult = getPathValue(source, fieldName)
    if (pathResult.found) return pathResult.value
  }

  if (isPlainRecord(source) && Object.prototype.hasOwnProperty.call(source, fieldName)) {
    const direct = source[fieldName]
    if (typeof direct !== 'function') return direct
  }

  const nestedResult = findNestedValue(source, fieldName)
  return nestedResult.found ? nestedResult.value : undefined
}

function evaluateSingleCondition(condition: LogicField) {
  const value = getConditionValue(condition.name)
  const operator = condition.operator

  if (operator === 'empty') return isEmptyValue(value)
  if (operator === 'notEmpty') return !isEmptyValue(value)
  if (operator === 'isTrue') return value === true
  if (operator === 'isFalse') return value === false

  if (operator === 'contains') {
    const containsFn = schemaValues.value?.contains
    if (typeof containsFn === 'function') {
      return containsFn(value, normalizeLiteral(condition.value))
    }
    return Array.isArray(value) ? value.includes(condition.value) : String(value || '').includes(String(condition.value))
  }

  if (operator.startsWith('is')) {
    const fn = schemaValues.value?.[operator]
    if (typeof fn === 'function') return fn(value)
  }

  const normalizeValues = (list: string[]) => list.map(item => normalizeLiteral(item))
  if (operator === 'equals') {
    if (condition.values?.length) {
      const targets = normalizeValues(condition.values)
      return targets.some(target => value === target)
    }
    return value === normalizeLiteral(condition.value)
  }

  if (operator === 'notEquals') {
    if (condition.values?.length) {
      const targets = normalizeValues(condition.values)
      return targets.every(target => value !== target)
    }
    return value !== normalizeLiteral(condition.value)
  }

  const left = Number(value)
  const right = Number(normalizeLiteral(condition.value))
  if (Number.isNaN(left) || Number.isNaN(right)) return false

  if (operator === 'greaterThan') return left > right
  if (operator === 'greaterOrEqualsThan') return left >= right
  if (operator === 'lessThan') return left < right
  if (operator === 'lessOrEqualsThan') return left <= right

  return true
}

function evaluateStepCondition(condition?: string) {
  if (!condition) return true
  const parsed = parseLogic(condition).filter(entry => entry.name && entry.operator)
  if (!parsed.length) return true
  return parsed.every((entry) => {
    const orFields = [entry].concat(entry.or || []).filter(orEntry => orEntry.name && orEntry.operator)
    if (!orFields.length) return true
    return orFields.some(orEntry => evaluateSingleCondition(orEntry))
  })
}

const visibleSteps = computed(() => {
  if (isPreviewEditing.value) return steps.value
  return steps.value.filter(step => evaluateStepCondition(step.if))
})

const renderedSteps = computed(() => (isPreviewEditing.value ? steps.value : visibleSteps.value))
const stepOrder = computed(() => renderedSteps.value.map(step => step.name))

watch(steps, (newSteps) => {
  const known = new Set(newSteps.map(step => step.name))
  newSteps.forEach((step) => {
    stepLabels[step.name] = step.label || step.name
  })
  Object.keys(stepLabels).forEach((stepName) => {
    if (!known.has(stepName)) delete stepLabels[stepName]
  })
}, { deep: true, immediate: true })

watch(renderedSteps, (newSteps) => {
  if (!newSteps.length) {
    activeStep.value = ''
    formStore.setActiveStep('')
    formStore.setActiveStepConfig(null)
    return
  }

  if (!newSteps.find(step => step.name === activeStep.value)) {
    activeStep.value = newSteps[0].name
  }
}, { deep: true, immediate: true })

watch(activeStep, (newStep) => {
  if (newStep && formStore.activeStepName !== newStep) {
    formStore.setActiveStep(newStep)
  }
})

watch(() => formStore.activeStepName, (newStep) => {
  if (newStep && newStep !== activeStep.value) {
    activeStep.value = newStep
  }
})

function selectStep(stepName: string, { openDrawer = true }: { openDrawer?: boolean } = {}) {
  if (!isEditing.value) return
  formStore.setActiveField(null)
  formStore.setActiveStepConfig(stepName)
  if (openDrawer) {
    isFormSettingsDrawerOpened.value = true
  }
}

function cleanupHeaderListeners() {
  headerListenerCleanup.value.forEach((cleanup) => cleanup())
  headerListenerCleanup.value = []
}

function attachHeaderListeners() {
  cleanupHeaderListeners()
  if (!isEditing.value || !stepperWrapperRef.value) return
  const tabs = stepperWrapperRef.value.querySelectorAll('.q-stepper__header .q-stepper__tab')
  tabs.forEach((tab, index) => {
    const stepName = renderedSteps.value[index]?.name
    if (!stepName) return
    const handler = () => selectStep(stepName)
    tab.addEventListener('click', handler)
    headerListenerCleanup.value.push(() => tab.removeEventListener('click', handler))
  })
}

function syncSelectedHeader() {
  if (!isEditing.value || !stepperWrapperRef.value || !selectedStepName.value) {
    selectedHeaderEl.value = null
    return
  }
  const tabs = stepperWrapperRef.value.querySelectorAll('.q-stepper__header .q-stepper__tab')
  const index = renderedSteps.value.findIndex(step => step.name === selectedStepName.value)
  const target = index >= 0 ? (tabs[index] as HTMLElement | undefined) : undefined
  selectedHeaderEl.value = target || null
}

function updateHeaderOverlay() {
  if (!isEditing.value || !stepperWrapperRef.value || !selectedHeaderEl.value) {
    headerOverlayRect.value = null
    return
  }
  const wrapperRect = stepperWrapperRef.value.getBoundingClientRect()
  const headerRect = selectedHeaderEl.value.getBoundingClientRect()
  headerOverlayRect.value = {
    top: headerRect.top - wrapperRect.top,
    left: headerRect.left - wrapperRect.left,
    width: headerRect.width,
    height: headerRect.height,
  }
}

function observeSelectedHeader() {
  headerResizeObserver.value?.disconnect()
  headerResizeObserver.value = null
  if (!selectedHeaderEl.value || typeof ResizeObserver === 'undefined') return
  const observer = new ResizeObserver(() => updateHeaderOverlay())
  observer.observe(selectedHeaderEl.value)
  headerResizeObserver.value = observer
}

const headerOverlayStyle = computed(() => {
  if (!headerOverlayRect.value) return {}
  const { top, left, width, height } = headerOverlayRect.value
  return {
    top: `${top}px`,
    left: `${left}px`,
    width: `${width}px`,
    height: `${height}px`,
  }
})

watch(activeStep, async (newStep) => {
  if (!builderDnd?.formDroppableRef) return
  await nextTick()
  builderDnd.formDroppableRef.value = stepCanvasRefs[newStep] || null
}, { immediate: true })

watch([renderedSteps, selectedStepName, isEditing], async () => {
  await nextTick()
  attachHeaderListeners()
  syncSelectedHeader()
  updateHeaderOverlay()
  observeSelectedHeader()
}, { deep: true, immediate: true })

onMounted(() => {
  if (typeof window === 'undefined') return
  window.addEventListener('resize', updateHeaderOverlay)
})

onBeforeUnmount(() => {
  cleanupHeaderListeners()
  headerResizeObserver.value?.disconnect()
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateHeaderOverlay)
  }
})

function getStepIndex(stepName: string) {
  return stepOrder.value.indexOf(stepName)
}

function isFirstStep(stepName: string) {
  return getStepIndex(stepName) <= 0
}

function isLastStep(stepName: string) {
  const index = getStepIndex(stepName)
  return index !== -1 && index === stepOrder.value.length - 1
}

function goToStep(delta: number, stepName: string) {
  const index = getStepIndex(stepName)
  if (index < 0) return
  const target = stepOrder.value[index + delta]
  if (!target) return
  activeStep.value = target
  selectStep(target)
}

function goToNext(stepName: string) {
  goToStep(1, stepName)
}

function goToPrevious(stepName: string) {
  goToStep(-1, stepName)
}

function shouldShowPrevious(step: StepDefinition) {
  return !isFirstStep(step.name) && step.showPrevious !== false
}

function getPreviousLabel(step: StepDefinition) {
  const label = step.prevLabel?.trim()
  return label || 'Voltar'
}

function getNextLabel(step: StepDefinition) {
  const label = step.nextLabel?.trim()
  if (label) return label
  return isLastStep(step.name) ? 'Finalizar' : 'Avançar'
}

function getStepFields(step: StepDefinition) {
  return Array.isArray(step.children) ? step.children : []
}

function getDisplayFields(step: StepDefinition) {
  const fields = getStepFields(step)
  if (!isPreviewEditing.value) return fields

  return fields.map((field) => {
    if (field && Object.keys(field).some(key => key.includes('if'))) {
      // @ts-expect-error schema keys are dynamic
      const { if: _if, ...rest } = field
      return { ...rest, hasCondition: true }
    }
    return field
  })
}

function hasCondition(field: FormKitSchemaDefinition & { hasCondition?: boolean }) {
  return Boolean(field?.hasCondition)
}

function getFieldClasses(field: FormKitSchemaDefinition & { columns?: any, align?: any }) {
  return [
    fieldUi.getSpanClass(field as any, formStore.formSettings.columns),
    fieldUi.getAlignClass(field as any),
    hasCondition(field) && isPreviewEditing.value ? 'opacity-50' : '',
  ]
}

function stepHasErrors(stepName: string) {
  const state = stepStates[stepName] as { errorCount?: number, blockingCount?: number } | undefined
  return Boolean((state?.errorCount || 0) > 0 || (state?.blockingCount || 0) > 0)
}

function stepDone(stepName: string) {
  return visitedSteps.value.includes(stepName) && !stepHasErrors(stepName)
}

function stepError(stepName: string) {
  return visitedSteps.value.includes(stepName) && stepHasErrors(stepName)
}

function addStep() {
  if (!isEditing.value) return
  formStore.addStep()
  if (formStore.activeStepName) {
    selectStep(formStore.activeStepName)
  }
}

function removeStep(stepName: string) {
  if (!isEditing.value) return
  formStore.removeStep(stepName)
}

function removeStepperStructure() {
  if (!isEditing.value) return
  formStore.removeStepper()
}

function saveStepLabel(stepName: string) {
  if (!isEditing.value) return
  formStore.renameStep(stepName, stepLabels[stepName] || '')
}

function focusSelectedStepLabel() {
  if (!selectedStepName.value) return
  selectStep(selectedStepName.value)
  formStore.requestStepLabelFocus()
}

function removeSelectedStep() {
  if (!selectedStepName.value) return
  formStore.removeStep(selectedStepName.value)
}
</script>

<template>
  <div ref="stepperWrapperRef" class="steps-wrapper">
    <div v-if="isEditing" class="steps-header-actions">     
      <q-btn round flat icon="add" size="sm" class="steps-header-action steps-header-action--add" color="grey-6"
        @click="addStep" />
         <q-btn round flat icon="close" size="sm" class="steps-header-action steps-header-action--remove" color="grey-6"
        @click="removeStepperStructure" />
    </div>

    <q-stepper
      v-model="activeStep"
      animated
      header-nav
      keep-alive
      flat
      class="bg-transparent"
        >
      <q-step
        v-for="step in renderedSteps"
        :key="step.name"
        :name="step.name"
        :title="step.label || step.name"
        :done="stepDone(step.name)"
        :error="stepError(step.name)"
      >
        <FormKit type="group" :name="step.name" :plugins="[stepPlugin]">
          <FormCanvas
            v-model:root-ref="stepCanvasRefs[step.name]"
            :droppable="canDrag"
            :empty="canDrag && !getDisplayFields(step).length"
            :highlight-empty="canDrag ? dndState.highlightDropArea : false"
            @drop="builderDnd?.onDrop"
            @dragover="builderDnd?.handleDragover"
            @dragenter="builderDnd?.onDragEnterFormSectionArea"
            @dragleave="builderDnd?.onDragLeaveFormSectionArea"
          >
            <div
              v-for="(field, index) in getDisplayFields(step)"
              :key="field?.name || index"
              class="form-field"
              :data-field-name="field?.name"
              :class="getFieldClasses(field)"
              @mouseover.prevent="canDrag ? builderDnd?.onMouseOverAtFormElement(field) : undefined"
              @mouseleave.prevent="canDrag ? builderDnd?.onMouseLeaveAtFormElement() : undefined"
            >
              <WithLabelAndDescription v-if="field.$el" :label="field.label" :info="field.info"
                :description="field.description">
                <FormKitSchema :schema="field" :data="schemaData" />
              </WithLabelAndDescription>

              <FormKitSchema v-else :schema="field" :data="schemaData" :readonly="context.attrs?.readonly" />

              <BuilderFieldOverlay
                v-if="canDrag"
                :field="field"
                :index="index"
                :state="{
                  activeNames: dndState.activeNames,
                  hoverName: dndState.hoverName,
                  elementBeingDragged: dndState.elementBeingDragged,
                  isUserDraggingOver: dndState.isUserDraggingOver,
                  dragInIndicator: dndState.dragInIndicator,
                  isDraggingStepper: dndState.isDraggingStepper,
                  hasStepper: dndState.hasStepper,
                }"
                :preview-mode-editing="isPreviewEditing"
                @click="builderDnd?.onClickAtFormElement"
                @dragstart="({ field: f, index: i }) => builderDnd?.onDragStartField(f, i)"
                @dragend="builderDnd?.onDragEnd"
                @dragover="builderDnd?.onDragOverDropArea"
                @dragenter:top="({ ev, name, index: idx }) => builderDnd?.onDragEnterInDropArea(ev, name || '', idx)"
                @dragenter:bottom="({ ev, name, index: idx }) => builderDnd?.onDragEnterInDropArea(ev, name || '', idx)"
                @copy="({ field: f, index: i }) => builderDnd?.handleCopyField(f, i)"
                @remove="({ field: f, index: i }) => builderDnd?.removeField(f, i)"
                @resize:start="({ ev, field: f }) => builderDnd?.startResize(ev, f)"
              />
            </div>
          </FormCanvas>
        </FormKit>

        <q-stepper-navigation class="q-mt-md">
          <q-btn
            v-if="shouldShowPrevious(step)"
            flat
            color="primary"
            :label="getPreviousLabel(step)"
            @click="goToPrevious(step.name)"
          />
          <q-btn
            color="primary"
            unelevated
            :class="shouldShowPrevious(step) ? 'q-ml-sm' : ''"
            :label="getNextLabel(step)"
            :type="isLastStep(step.name) ? 'submit' : 'button'"
            @click="goToNext(step.name)"
          />
        </q-stepper-navigation>
      </q-step>
    </q-stepper>

    <div
      v-if="isEditing && headerOverlayRect"
      class="stepper-header-overlay-wrapper"
      :style="headerOverlayStyle"
    >
      <div class="stepper-header-overlay stepper-header-overlay--active" />
      <q-icon name="o_edit" class="stepper-header-action stepper-header-action--left cursor-pointer"
        @click.stop="focusSelectedStepLabel">
        <q-tooltip class="bg-dark" transition-show="fade" transition-hide="fade" anchor="top middle"
          self="bottom middle" :offset="[4, 4]">
          Editar
        </q-tooltip>
      </q-icon>
      <q-icon name="o_delete" class="stepper-header-action stepper-header-action--right cursor-pointer"
        :class="{ disabled: steps.length <= 1 }" @click.stop="steps.length <= 1 ? undefined : removeSelectedStep()">
        <q-tooltip class="bg-dark" transition-show="fade" transition-hide="fade" anchor="top middle"
          self="bottom middle" :offset="[4, 4]">
          Remover
        </q-tooltip>
      </q-icon>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.steps-wrapper {
  width: 100%;
  position: relative;
}

.steps-header-actions {
  position: absolute;
  top: 1.25rem;
  left: 0;
  right: 0;
  z-index: 3;
  pointer-events: none;
}

.steps-header-action {
  position: absolute;
  pointer-events: auto;
}

.steps-header-action--remove {
  left: -2.5rem;
}

.steps-header-action--add {
  right: -2.5rem;
}

.steps-title {
  position: relative;
}

.stepper-header-overlay {
  border-color: transparent;
  border-style: solid;
  border-width: 1px;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  pointer-events: none;
  z-index: 1;
}

.stepper-header-overlay--active {
  border-color: var(--overlay-accent-color, #2980b9);
}

.stepper-header-action {
  position: absolute;
  top: -1.4rem;
  background-color: var(--overlay-accent-color, #2980b9);
  color: white;
  width: fit-content;
  height: fit-content;
  padding: 4px;
  z-index: 2;
  pointer-events: auto;
}

.stepper-header-action--left {
  left: 0;
}

.stepper-header-action--right {
  right: 0;
}

.stepper-header-action.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.stepper-header-overlay-wrapper {
  position: absolute;
  pointer-events: none;
  z-index: 3;
}
</style>
