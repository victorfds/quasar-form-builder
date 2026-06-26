<script setup lang="ts">
import type { FormKitNode, FormKitSchemaDefinition } from '@formkit/core'
import type { ColumnsType } from '~/types'
import { empty, eq } from '@formkit/utils'
import { clearErrors, reset } from '@formkit/vue'
import { builderModeKey, formBuilderDndKey, schemaDataKey } from '~/constants/injectionKeys'

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
let stopFormAreaClick: (() => void) | undefined
let stopPreviewModeChange: (() => void) | undefined

function clearActiveField() {
  formStore.setActiveField(null)
}

function isClickInsideActiveField(ev: MouseEvent, activeName?: string | null) {
  if (!activeName) return false
  return ev.composedPath().some((node) => {
    if (!(node instanceof HTMLElement)) return false
    return node.dataset?.fieldName === activeName
  })
}

function handleFormAreaClick(ev: MouseEvent) {
  const activeName = formStore.activeField?.name
  if (!activeName) return
  if (isClickInsideActiveField(ev, activeName)) return
  clearActiveField()
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
  stopFormAreaClick = useEventListener(previewFormSectionRef, 'click', handleFormAreaClick, { capture: true })
  stopPreviewModeChange = useEventListener(window, 'builder:preview-mode-change', resetPreviewForm)
})

onUnmounted(() => {
  if (stopFormAreaClick)
    stopFormAreaClick()
  stopPreviewModeChange?.()
})

const data = computed(() => ({
  ...formStore.values,
  empty,
  eq,
  contains,
  isToday,
  isTomorrow,
  isYesterday,
  isDayAfterTomorrow,
  isDayBeforeYesterday,
}))

provide(schemaDataKey, data)

function onSubmit(_data: any, node: FormKitNode) {
  reset(node, {})
}

const isPreviewEditing = computed(() => formStore.formSettings.previewMode === 'editing')
const builderFields = computed(() => withStructureChildrenListForRender(formStore.getFields as unknown as ViewerField[]))

function hasCondition(field: ViewerField) {
  return Object.keys(field).some(key => key.includes('hasCondition'))
}

function getFieldClasses(field: ViewerField) {
  return [
    fieldUi.getAlignClass(field as any),
    hasCondition(field) && isPreviewEditing.value ? 'opacity-50' : '',
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
          :class="{ 'bg-dark': dark.isActive, 'bg-white': !dark.isActive }"
          :style="{ 'max-width': formStore.formSettings.preview.isFullWidth ? 'calc(9999px + 5rem)' : `calc(100px + ${getUserWidthInput}px)` }"
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
  margin-left: 4rem;
  margin-right: 4rem;
  min-height: 100px;
  padding: 3.125rem;
  width: 100%;
}
</style>
