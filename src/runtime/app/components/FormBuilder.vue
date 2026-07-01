<script setup lang="ts">
import type { ColumnsType } from '#qfb/types'
import type { FormKitNode, FormKitSchemaDefinition } from '@formkit/core'
import { builderModeKey, formBuilderDndKey, schemaDataKey } from '#qfb/constants/injectionKeys'
import { clearErrors, reset } from '@formkit/vue'

type ViewerField = FormKitSchemaDefinition & {
  name?: string
  columns?: ColumnsType & Record<string, any>
  align?: 'left' | 'center' | 'right'
  $el?: string
  label?: string
  info?: string
  description?: string
}

const { dark } = useQuasar()
const formStore = useFormStore()
const fieldUi = useFieldUi()
const hasStepper = computed(() => formStore.hasStepper)
const stepperField = computed(() => formStore.formFields.find(field => field.$formkit === 'q-stepper'))

const {
  // refs
  highlightDropArea,
  previewFormSectionRef,
  formDroppableRef,
  formRefComponent,
  indexPointer,
  elementBeingDragged,
  originalListKey,
  targetListKey,
  activeNameFields,
  dragInIndicator,
  isUserDraggingOver,
  isDraggingStepper,
  isDraggingRootOnlyStructure,
  // computed
  getUserWidthInput,
  // methods
  onDragEnterFormSectionArea,
  onDragLeaveFormSectionArea,
  onDrop,
  onDragStartField,
  handleDragover,
  onDragEnterInDropArea,
  onDragOverDropArea,
  onDragEnd,
  onClickAtFormElement,
  onMouseOverAtFormElement,
  onMouseLeaveAtFormElement,
  onDragEnterStepHeader,
  onDropOnStepHeader,
  onDragEnterContainer,
  onDropOnContainer,
  handleCopyField,
  removeField,
  startResize,
  throttleResize,
  stopResize,
} = useFormBuilderDnd(formStore)

provide(builderModeKey, true)
provide(formBuilderDndKey, {
  highlightDropArea,
  previewFormSectionRef,
  formDroppableRef,
  indexPointer,
  elementBeingDragged,
  originalListKey,
  targetListKey,
  activeNameFields,
  dragInIndicator,
  isUserDraggingOver,
  isDraggingStepper,
  isDraggingRootOnlyStructure,
  onDrop,
  handleDragover,
  onDragEnterFormSectionArea,
  onDragLeaveFormSectionArea,
  onDragStartField,
  onDragOverDropArea,
  onDragEnd,
  onClickAtFormElement,
  onMouseOverAtFormElement,
  onMouseLeaveAtFormElement,
  onDragEnterStepHeader,
  onDropOnStepHeader,
  onDragEnterContainer,
  onDropOnContainer,
  handleCopyField,
  removeField,
  onDragEnterInDropArea,
  startResize,
})

const scrollAreaContentStyle = { display: 'flex', justifyContent: 'center' }
const offset = useState('offset')

// unsubscribe from listeners
let stopDocumentClick: (() => void) | undefined
let stopPreviewModeChange: (() => void) | undefined

function hasActiveSelection() {
  return Boolean(formStore.activeField || formStore.activeStepConfigName || formStore.activeTabConfigName)
}

function clearActiveSelection() {
  formStore.setActiveField(null)
  formStore.setActiveStepConfig(null)
  formStore.setActiveTabConfig(null)
}

function isClickInsideActiveField(ev: MouseEvent, activeName?: string | null) {
  if (!activeName) return false
  return ev.composedPath().some((node) => {
    if (!(node instanceof HTMLElement)) return false
    return node.dataset?.fieldName === activeName
  })
}

function isClickInsideBuilderSelection(ev: MouseEvent) {
  if (isClickInsideActiveField(ev, formStore.activeField?.name)) return true

  return ev.composedPath().some((node) => {
    if (!(node instanceof HTMLElement)) return false
    return Boolean(node.closest(
      [
        '[data-drawer="right"]',
        '[data-keep-active]',
        '.q-menu',
        '.q-dialog',
        '.structure-tabs__tab',
        '.q-stepper__header',
        '.q-stepper__tab',
        '.stepper-header-overlay-wrapper',
      ].join(','),
    ))
  })
}

function handleDocumentClick(ev: MouseEvent) {
  if (!hasActiveSelection()) return
  if (isClickInsideBuilderSelection(ev)) return
  clearActiveSelection()
}

function resetPreviewForm() {
  reset('myForm')
  clearErrors('myForm', true)
}

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', throttleResize)
  document.removeEventListener('mouseup', stopResize)
})

onMounted(() => {
  formStore.hydrateFromStorage()
  stopDocumentClick = useEventListener(document, 'click', handleDocumentClick, { capture: true })
  stopPreviewModeChange = useEventListener(window, 'builder:preview-mode-change', resetPreviewForm)
})

onUnmounted(() => {
  stopDocumentClick?.()
  stopPreviewModeChange?.()
})

const data = computed(() => createFormSchemaData(formStore.formFields, formStore.values))

provide(schemaDataKey, data)

function onSubmit(_data: any, node: FormKitNode) {
  reset(node, {})
}

const isPreviewEditing = computed(() => formStore.formSettings.previewMode === 'editing')
const builderFields = computed(() => withStructureChildrenListForRender(formStore.getFields as unknown as ViewerField[]))
const previewFormStyle = computed(() => ({
  '--preview-content-width': `${getUserWidthInput.value}px`,
}))

function hasCondition(field: ViewerField) {
  return Object.keys(field).some(key => key.includes('hasCondition'))
}

function isHiddenInputField(field: ViewerField) {
  return field?.$formkit === 'q-input' && field.inputType === 'hidden'
}

function getFieldClasses(field: ViewerField) {
  return [
    fieldUi.getAlignClass(field as any),
    hasCondition(field) && isPreviewEditing.value ? 'opacity-50' : '',
    isHiddenInputField(field) && !isPreviewEditing.value ? 'form-field--hidden-preview' : '',
  ]
}

function getFieldStyle(field: ViewerField) {
  return fieldUi.getGridColumnStyle(field as any)
}
</script>

<template>
  <section class="full-width" :class="dark.isActive ? 'bg-grey-10' : 'bg-blue-grey-1'">
    <q-scroll-area
      class="full-width relative-position" :content-style="scrollAreaContentStyle"
      :content-active-style="scrollAreaContentStyle" :style="`height: calc(100vh - ${offset}px);`"
      :thumb-style="{ width: '4px' }"
    >
      <article ref="previewFormSectionRef" class="row items-start justify-center full-width">
        <q-card
          flat class="preview-form-container q-my-md"
          :class="{
            'bg-dark': dark.isActive,
            'bg-white': !dark.isActive,
            'preview-form-container--full': formStore.formSettings.preview.isFullWidth,
          }"
          :style="previewFormStyle"
        >
          <q-card-section class="my-form-wrapper no-padding">
            <FormKit
              id="myForm" ref="formRefComponent" v-model="formStore.values" type="form" :actions="false"
              @submit="onSubmit"
            >
              <FormCanvas
                v-if="!hasStepper"
                v-model:root-ref="formDroppableRef"
                droppable
                :empty="!formStore.formFields.length"
                :highlight-empty="highlightDropArea"
                @drop="(ev) => onDrop(ev, 'root')"
                @dragover="handleDragover"
                @dragenter="(ev) => { onDragEnterContainer('root'); onDragEnterFormSectionArea(ev) }"
                @dragleave="onDragLeaveFormSectionArea"
              >
                <div
                  v-for="(field, index) in builderFields" :key="field?.name || index" class="form-field form-field--responsive"
                  :data-field-name="field?.name"
                  :class="getFieldClasses(field)"
                  :style="getFieldStyle(field)"
                  @mouseover.prevent="onMouseOverAtFormElement(field)"
                  @mouseleave.prevent="onMouseLeaveAtFormElement"
                >
                  <WithLabelAndDescription
                    v-if="field.$el" :label="field.label" :info="field.info"
                    :description="field.description"
                  >
                    <FormKitSchema :schema="field" :data="data" />
                  </WithLabelAndDescription>

                  <FormKitSchema v-else :schema="field" :data="data" />

                  <BuilderFieldOverlay
                    :field="field"
                    :index="index"
                    :state="{
                      activeNames: activeNameFields.active,
                      hoverName: activeNameFields.hover,
                      elementBeingDragged: elementBeingDragged as any,
                      isUserDraggingOver,
                      dragInIndicator: dragInIndicator as any,
                      listKey: 'root',
                      isDraggingStepper,
                      isDraggingRootOnlyStructure,
                      hasStepper,
                    }"
                    :preview-mode-editing="isPreviewEditing"
                    @click="(idx) => onClickAtFormElement(idx, 'root')"
                    @dragstart="({ field: f, index: i, ev }) => onDragStartField(f, i, ev, 'root')"
                    @dragend="onDragEnd"
                    @dragover="(ev) => onDragOverDropArea(ev, 'root')"
                    @drag-enter-top="({ ev, name, index: idx, placement }) => onDragEnterInDropArea(ev, name || '', idx, placement, 'root')"
                    @drag-enter-bottom="({ ev, name, index: idx, placement }) => onDragEnterInDropArea(ev, name || '', idx, placement, 'root')"
                    @drag-enter-left="({ ev, name, index: idx, placement }) => onDragEnterInDropArea(ev, name || '', idx, placement, 'root')"
                    @drag-enter-right="({ ev, name, index: idx, placement }) => onDragEnterInDropArea(ev, name || '', idx, placement, 'root')"
                    @copy="({ field: f, index: i }) => handleCopyField(f, i, 'root')"
                    @remove="({ field: f, index: i }) => removeField(f, i)"
                    @resize-start="({ ev, field: f }) => startResize(ev, f)"
                  />
                </div>
              </FormCanvas>
              <FormKitSchema v-else-if="stepperField" :schema="stepperField" :data="data" />
            </FormKit>
          </q-card-section>
        </q-card>
      </article>
    </q-scroll-area>
  </section>
</template>

<style lang="scss">
.preview-form-container {
  --preview-container-padding: clamp(1rem, 4vw, 2.5rem);
  --preview-container-extra: clamp(2rem, 8vw, 5rem);

  box-sizing: border-box;
  max-width: 100%;
  min-height: 100px;
  padding: var(--preview-container-padding);
  width: min(100%, calc(var(--preview-content-width, 432px) + var(--preview-container-extra)));
}

.preview-form-container--full {
  width: 100%;
}
</style>
