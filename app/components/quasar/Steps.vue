<script setup lang="ts">
import type { FormKitFrameworkContext, FormKitSchemaDefinition } from '@formkit/core'
import type { LogicField } from '~/types'
import { builderModeKey, formBuilderDndKey, schemaDataKey } from '~/constants/injectionKeys'

interface StepDefinition {
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

const { screen } = useQuasar()
const formStore = useFormStore()
const fieldUi = useFieldUi()
const schemaData = inject(schemaDataKey, computed(() => ({})))
const builderMode = inject(builderModeKey, false)
const isFormSettingsDrawerOpened = useState<boolean>('form-settings-drawer', () => false)
const builderDnd = inject(formBuilderDndKey, null) as Record<string, any> | null
const { activeStep, visitedSteps, steps: stepStates, stepPlugin, setActiveStep: setLocalActiveStep } = useSteps()

const steps = computed(() => (props.context?.steps || []) as StepDefinition[])
const isEditing = computed(() => builderMode && formStore.formSettings.previewMode === 'editing')
const isPreviewEditing = computed(() => builderMode && formStore.formSettings.previewMode === 'editing')
const canDrag = computed(() => Boolean(isEditing.value && builderDnd))
const isSmallScreen = computed(() => screen.lt.md)
const stepCanvasRefs = reactive<Record<string, HTMLElement | null>>({})
const stepperWrapperRef = ref<HTMLElement | null>(null)
const selectedHeaderEl = ref<HTMLElement | null>(null)
const headerOverlayWrapperRef = ref<HTMLElement | null>(null)
const headerOverlayRect = ref<{ top: number, left: number, width: number, height: number } | null>(null)
const selectedStepName = computed(() => formStore.activeStepConfigName)
let headerListenerCleanup: Array<() => void> = []
let headerResizeObserver: ResizeObserver | null = null
const schemaValues = computed(() => unref(schemaData) || {})
const dndState = computed(() => ({
  activeNames: unref(builderDnd?.activeNameFields)?.active || [],
  hoverName: unref(builderDnd?.activeNameFields)?.hover,
  elementBeingDragged: unref(builderDnd?.elementBeingDragged),
  isUserDraggingOver: unref(builderDnd?.isUserDraggingOver),
  dragInIndicator: unref(builderDnd?.dragInIndicator),
  highlightDropArea: unref(builderDnd?.highlightDropArea),
  isDraggingStepper: unref(builderDnd?.isDraggingStepper),
  isDraggingRootOnlyStructure: unref(builderDnd?.isDraggingRootOnlyStructure),
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
      return targets.includes(value)
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

function setCurrentStep(stepName: string, { syncStore = true }: { syncStore?: boolean } = {}) {
  if (activeStep.value !== stepName) {
    setLocalActiveStep(stepName)
  }
  if (syncStore && stepName && formStore.activeStepName !== stepName) {
    formStore.setActiveStep(stepName)
  }
  syncActiveCanvasRef(stepName)
}

function syncActiveCanvasRef(stepName = activeStep.value) {
  if (!builderDnd?.formDroppableRef) return
  void nextTick(() => {
    const nextCanvas = stepCanvasRefs[stepName] || null
    if (builderDnd.formDroppableRef.value !== nextCanvas) {
      builderDnd.formDroppableRef.value = nextCanvas
    }
  })
}

function ensureRenderableActiveStep() {
  const newSteps = renderedSteps.value
  if (!newSteps.length) {
    setCurrentStep('')
    formStore.setActiveStep('')
    formStore.setActiveStepConfig(null)
    return
  }

  const storeStepName = formStore.activeStepName
  if (storeStepName && newSteps.some(step => step.name === storeStepName)) {
    setCurrentStep(storeStepName, { syncStore: false })
    return
  }

  if (!newSteps.find(step => step.name === activeStep.value)) {
    setCurrentStep(newSteps[0].name)
  }
}

function selectStep(stepName: string, { openDrawer = true }: { openDrawer?: boolean } = {}) {
  if (!isEditing.value) return
  setCurrentStep(stepName)
  formStore.setActiveField(null)
  formStore.setActiveStepConfig(stepName)
  if (openDrawer) {
    isFormSettingsDrawerOpened.value = true
  }
}

function isClickInsideActiveStepArea(ev: MouseEvent) {
  const activeCanvas = builderDnd?.formDroppableRef?.value || stepCanvasRefs[activeStep.value] || null
  const overlayWrapper = headerOverlayWrapperRef.value
  const target = ev.target as Node | null
  if (!target) return false
  if (activeCanvas?.contains(target)) return true
  if (overlayWrapper?.contains(target)) return true
  return false
}

function handleStepperClick(ev: MouseEvent) {
  if (!isEditing.value) return
  if (!selectedStepName.value) return
  if (isClickInsideActiveStepArea(ev)) return
  formStore.setActiveStepConfig(null)
}

function cleanupHeaderListeners() {
  headerListenerCleanup.forEach(cleanup => cleanup())
  headerListenerCleanup = []
}

function getStepperTabs() {
  return stepperWrapperRef.value?.querySelectorAll('.q-stepper__tab') || []
}

function attachHeaderListeners() {
  cleanupHeaderListeners()
  if (!isEditing.value || !stepperWrapperRef.value) return
  const tabs = getStepperTabs()
  tabs.forEach((tab, index) => {
    const stepName = renderedSteps.value[index]?.name
    if (!stepName) return
    const clickHandler = () => selectStep(stepName)
    const dragenterHandler = (ev: Event) => {
      ev.preventDefault()
      setCurrentStep(stepName)
      builderDnd?.onDragEnterStepHeader?.(stepName)
    }
    const dragoverHandler = (ev: Event) => {
      ev.preventDefault()
      setCurrentStep(stepName)
      builderDnd?.onDragEnterStepHeader?.(stepName)
    }
    tab.addEventListener('click', clickHandler)
    tab.addEventListener('dragenter', dragenterHandler)
    tab.addEventListener('dragover', dragoverHandler)
    headerListenerCleanup.push(() => {
      tab.removeEventListener('click', clickHandler)
      tab.removeEventListener('dragenter', dragenterHandler)
      tab.removeEventListener('dragover', dragoverHandler)
    })
  })
}

function syncSelectedHeader() {
  if (!isEditing.value || !stepperWrapperRef.value || !selectedStepName.value) {
    selectedHeaderEl.value = null
    return
  }
  const tabs = getStepperTabs()
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
  const nextRect = {
    top: headerRect.top - wrapperRect.top,
    left: headerRect.left - wrapperRect.left,
    width: headerRect.width,
    height: headerRect.height,
  }
  const currentRect = headerOverlayRect.value
  if (
    currentRect
    && currentRect.top === nextRect.top
    && currentRect.left === nextRect.left
    && currentRect.width === nextRect.width
    && currentRect.height === nextRect.height
  ) {
    return
  }
  headerOverlayRect.value = nextRect
}

function getHeaderStepNameFromPoint(ev: DragEvent) {
  if (!isEditing.value || !stepperWrapperRef.value) return null
  const tabs = getStepperTabs()
  for (let index = 0; index < tabs.length; index++) {
    const tab = tabs[index] as HTMLElement
    const rect = tab.getBoundingClientRect()
    const isInside = ev.clientX >= rect.left && ev.clientX <= rect.right && ev.clientY >= rect.top && ev.clientY <= rect.bottom
    if (isInside) return renderedSteps.value[index]?.name || null
  }
  return null
}

function handleWindowHeaderDragover(ev: DragEvent) {
  const stepName = getHeaderStepNameFromPoint(ev)
  if (!stepName) return
  ev.preventDefault()
  setCurrentStep(stepName)
  builderDnd?.onDragEnterStepHeader?.(stepName)
}

function handleWindowHeaderDrop(ev: DragEvent) {
  const stepName = getHeaderStepNameFromPoint(ev)
  if (!stepName) return
  ev.preventDefault()
  const fieldName = ev.dataTransfer?.getData('application/x-builder-field')
  builderDnd?.onDropOnStepHeader?.(stepName, fieldName)
}

function observeSelectedHeader() {
  headerResizeObserver?.disconnect()
  headerResizeObserver = null
  if (!selectedHeaderEl.value || typeof ResizeObserver === 'undefined') return
  const observer = new ResizeObserver(() => updateHeaderOverlay())
  observer.observe(selectedHeaderEl.value)
  headerResizeObserver = observer
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

let stopStepperClick: (() => void) | undefined
let stepperUiRefreshScheduled = false
let stepperUiSignature = ''

function getStepperUiSignature() {
  return [
    isEditing.value ? 'editing' : 'preview',
    activeStep.value,
    selectedStepName.value || '',
    renderedSteps.value.map(step => `${step.name}:${step.label || ''}`).join('|'),
  ].join('::')
}

function refreshStepperUi() {
  if (stepperUiRefreshScheduled) return
  stepperUiRefreshScheduled = true
  void nextTick(() => {
    stepperUiRefreshScheduled = false
    ensureRenderableActiveStep()
    const nextSignature = getStepperUiSignature()
    if (stepperUiSignature === nextSignature) {
      syncActiveCanvasRef()
      return
    }
    stepperUiSignature = nextSignature
    attachHeaderListeners()
    syncSelectedHeader()
    updateHeaderOverlay()
    observeSelectedHeader()
    syncActiveCanvasRef()
  })
}

onMounted(() => {
  if (typeof window === 'undefined') return
  const clickTarget = builderDnd?.previewFormSectionRef || stepperWrapperRef
  stopStepperClick = useEventListener(clickTarget, 'click', handleStepperClick, { capture: true })
  window.addEventListener('resize', updateHeaderOverlay)
  window.addEventListener('dragover', handleWindowHeaderDragover)
  window.addEventListener('drop', handleWindowHeaderDrop)
  refreshStepperUi()
})

onUpdated(() => {
  refreshStepperUi()
})

onBeforeUnmount(() => {
  cleanupHeaderListeners()
  stopStepperClick?.()
  headerResizeObserver?.disconnect()
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateHeaderOverlay)
    window.removeEventListener('dragover', handleWindowHeaderDragover)
    window.removeEventListener('drop', handleWindowHeaderDrop)
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
  if (!isPreviewEditing.value) return withStructureChildrenListForRender(fields)

  return fields.map((field) => {
    if (field && Object.keys(field).some(key => key.includes('if'))) {
      // @ts-expect-error schema keys are dynamic
      const { if: _if, ...rest } = field
      return withStructureChildrenForRender({ ...rest, hasCondition: true } as FormKitSchemaDefinition)
    }
    return withStructureChildrenForRender(field)
  })
}

function hasCondition(field: FormKitSchemaDefinition & { hasCondition?: boolean }) {
  return Boolean(field?.hasCondition)
}

function getFieldClasses(field: FormKitSchemaDefinition & { columns?: any, align?: any }) {
  return [
    fieldUi.getAlignClass(field as any),
    hasCondition(field) && isPreviewEditing.value ? 'opacity-50' : '',
  ]
}

function getFieldStyle(field: FormKitSchemaDefinition & { columns?: any, align?: any }) {
  return fieldUi.getGridColumnStyle(field as any)
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

function removeStepperStructure() {
  if (!isEditing.value) return
  formStore.removeStepper()
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
      <q-btn
        round flat icon="add" size="sm" class="steps-header-action steps-header-action--add" color="grey-6"
        @click="addStep"
      />
      <q-btn
        round flat icon="close" size="sm" class="steps-header-action steps-header-action--remove" color="grey-6"
        @click="removeStepperStructure"
      />
    </div>

    <q-stepper
      :model-value="activeStep"
      :vertical="isSmallScreen"
      animated
      header-nav
      keep-alive
      flat
      class="bg-transparent"
      @update:model-value="stepName => setCurrentStep(String(stepName))"
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
            @drop="(ev) => builderDnd?.onDrop?.(ev, `step:${step.name}`)"
            @dragover="builderDnd?.handleDragover"
            @dragenter="(ev) => { builderDnd?.onDragEnterContainer?.(`step:${step.name}`); builderDnd?.onDragEnterFormSectionArea?.(ev) }"
            @dragleave="builderDnd?.onDragLeaveFormSectionArea"
          >
            <div
              v-for="(field, index) in getDisplayFields(step)"
              :key="field?.name || index"
              class="form-field form-field--responsive"
              :data-field-name="field?.name"
              :class="getFieldClasses(field)"
              :style="getFieldStyle(field)"
              @mouseover.prevent="canDrag ? builderDnd?.onMouseOverAtFormElement(field) : undefined"
              @mouseleave.prevent="canDrag ? builderDnd?.onMouseLeaveAtFormElement() : undefined"
            >
              <WithLabelAndDescription
                v-if="field.$el" :label="field.label" :info="field.info"
                :description="field.description"
              >
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
                  listKey: `step:${step.name}`,
                  isDraggingStepper: dndState.isDraggingStepper,
                  isDraggingRootOnlyStructure: dndState.isDraggingRootOnlyStructure,
                  hasStepper: dndState.hasStepper,
                }"
                :preview-mode-editing="isPreviewEditing"
                @click="(idx) => builderDnd?.onClickAtFormElement?.(idx, `step:${step.name}`)"
                @dragstart="({ field: f, index: i, ev }) => builderDnd?.onDragStartField(f, i, ev, `step:${step.name}`)"
                @dragend="builderDnd?.onDragEnd"
                @dragover="(ev) => builderDnd?.onDragOverDropArea?.(ev, `step:${step.name}`)"
                @drag-enter-top="({ ev, name, index: idx, placement }) => builderDnd?.onDragEnterInDropArea(ev, name || '', idx, placement, `step:${step.name}`)"
                @drag-enter-bottom="({ ev, name, index: idx, placement }) => builderDnd?.onDragEnterInDropArea(ev, name || '', idx, placement, `step:${step.name}`)"
                @drag-enter-left="({ ev, name, index: idx, placement }) => builderDnd?.onDragEnterInDropArea(ev, name || '', idx, placement, `step:${step.name}`)"
                @drag-enter-right="({ ev, name, index: idx, placement }) => builderDnd?.onDragEnterInDropArea(ev, name || '', idx, placement, `step:${step.name}`)"
                @copy="({ field: f, index: i }) => builderDnd?.handleCopyField(f, i, `step:${step.name}`)"
                @remove="({ field: f, index: i }) => builderDnd?.removeField(f, i)"
                @resize-start="({ ev, field: f }) => builderDnd?.startResize(ev, f)"
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
      ref="headerOverlayWrapperRef"
      class="stepper-header-overlay-wrapper"
      :style="headerOverlayStyle"
    >
      <div class="stepper-header-overlay stepper-header-overlay--active" />
      <q-icon
        name="o_edit" class="stepper-header-action stepper-header-action--left cursor-pointer"
        @click.stop="focusSelectedStepLabel"
      >
        <q-tooltip
          class="bg-dark" transition-show="fade" transition-hide="fade" anchor="top middle"
          self="bottom middle" :offset="[4, 4]"
        >
          Editar
        </q-tooltip>
      </q-icon>
      <q-icon
        name="o_delete" class="stepper-header-action stepper-header-action--right cursor-pointer"
        :class="{ disabled: steps.length <= 1 }" @click.stop="steps.length <= 1 ? undefined : removeSelectedStep()"
      >
        <q-tooltip
          class="bg-dark" transition-show="fade" transition-hide="fade" anchor="top middle"
          self="bottom middle" :offset="[4, 4]"
        >
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
