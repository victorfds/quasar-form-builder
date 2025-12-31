<script setup lang="ts">
import type { FormKitNode, FormKitSchemaDefinition } from '@formkit/core'
import { empty, eq } from '@formkit/utils'
import { clearErrors, reset } from '@formkit/vue'
import type { ColumnsType } from '~/types'

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

const {
  // refs
  highlightDropArea,
  previewFormSectionRef,
  formDroppableRef,
  formRefComponent,
  indexPointer,
  elementBeingDragged,
  originalFieldIndex,
  activeNameFields,
  dragInIndicator,
  isUserDraggingOver,
  isDragging,
  startX,
  lastDeltaColumns,
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
  handleCopyField,
  removeField,
  startResize,
  throttleResize,
  stopResize,
} = useFormBuilderDnd(formStore)

const scrollAreaContentStyle = { display: 'flex', justifyContent: 'center' }
const offset = useState('offset')

// unsubscribe from listeners
let stopFormAreaClick: (() => void) | undefined

function clearActiveField() {
  activeNameFields.value.active = []
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

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', throttleResize)
  document.removeEventListener('mouseup', stopResize)
})

onMounted(() => {
  stopFormAreaClick = useEventListener(previewFormSectionRef, 'click', handleFormAreaClick, { capture: true })

  useEventOutside(previewFormSectionRef, formDroppableRef, 'dragover', () => {
    indexPointer.value = null
    dragInIndicator.value = {}
  })
})

onUnmounted(() => {
  if (stopFormAreaClick)
    stopFormAreaClick()
})

watch(() => formStore.activeField, (newVal) => {
  if (!activeNameFields.value.active.includes(newVal?.name)) {
    activeNameFields.value.active[0] = ''
    activeNameFields.value.active[1] = newVal?.name
  }
}, { deep: true })

watch(() => formStore.formSettings.previewMode, () => {
  reset('myForm')
  clearErrors('myForm', true)
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

function onSubmit(data: any, node: FormKitNode) {
  console.log(data)
  reset(node, {})
}

const isPreviewEditing = computed(() => formStore.formSettings.previewMode === 'editing')
const builderFields = computed(() => formStore.getFields as unknown as ViewerField[])

function hasCondition(field: ViewerField) {
  return Object.keys(field).some(key => key.includes('hasCondition'))
}

function getFieldClasses(field: ViewerField) {
  return [
    fieldUi.getSpanClass(field as any, formStore.formSettings.columns),
    fieldUi.getAlignClass(field as any),
    hasCondition(field) && isPreviewEditing.value ? 'opacity-50' : '',
  ]
}

</script>

<template>
  <section class="full-width" :class="dark.isActive ? 'bg-grey-10' : 'bg-blue-grey-1'">
    <q-scroll-area class="full-width relative-position" :content-style="scrollAreaContentStyle"
      :content-active-style="scrollAreaContentStyle" :style="`height: calc(100vh - ${offset}px);`"
      :thumb-style="{ width: '4px' }">

      <article ref="previewFormSectionRef" class="row items-start justify-center full-width">
        <q-card flat class="preview-form-container q-my-md"
          :class="{ 'bg-dark': dark.isActive, 'bg-white': !dark.isActive }"
          :style="{ 'max-width': formStore.formSettings.preview.isFullWidth ? 'calc(9999px + 5rem)' : `calc(100px + ${getUserWidthInput}px)` }">
          <q-card-section class="my-form-wrapper no-padding">
            <FormKit id="myForm" ref="formRefComponent" v-model="formStore.values" type="form" :actions="false"
              @submit="onSubmit">
              <FormCanvas
                v-model:root-ref="formDroppableRef"
                droppable
                :empty="!formStore.formFields.length"
                :highlight-empty="highlightDropArea"
                @drop="onDrop"
                @dragover="handleDragover"
                @dragenter="onDragEnterFormSectionArea"
                @dragleave="onDragLeaveFormSectionArea"
              >
                <div v-for="(field, index) in builderFields" :key="field?.name || index" class="form-field"
                  :data-field-name="field?.name"
                  :class="getFieldClasses(field)" @mouseover.prevent="onMouseOverAtFormElement(field)"
                  @mouseleave.prevent="onMouseLeaveAtFormElement">

                  <WithLabelAndDescription v-if="field.$el" :label="field.label" :info="field.info"
                    :description="field.description">
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
                    }"
                    :preview-mode-editing="isPreviewEditing"
                    @click="onClickAtFormElement"
                    @dragstart="({ field: f, index: i }) => onDragStartField(f, i)"
                    @dragend="onDragEnd"
                    @dragover="onDragOverDropArea"
                    @dragenter:top="({ ev, name, index: idx }) => onDragEnterInDropArea(ev, name || '', idx)"
                    @dragenter:bottom="({ ev, name, index: idx }) => onDragEnterInDropArea(ev, name || '', idx)"
                    @copy="({ field: f, index: i }) => handleCopyField(f, i)"
                    @remove="({ field: f, index: i }) => removeField(f, i)"
                    @resize:start="({ ev, field: f }) => startResize(ev, f)"
                  />
                </div>
              </FormCanvas>
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
