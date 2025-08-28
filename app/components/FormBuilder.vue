<script setup lang="ts">
import type { FormKitNode, FormKitSchemaDefinition } from '@formkit/core'
import { clearErrors, reset } from '@formkit/vue'
import { empty, eq } from '@formkit/utils'
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

// unsubscribe from listener
let stopListening: () => void

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', throttleResize)
  document.removeEventListener('mouseup', stopResize)
})

onMounted(() => {
  stopListening = useClickOutside(previewFormSectionRef, formDroppableRef, () => {
    activeNameFields.value.active = []
    formStore.setActiveField(null)
  })

  useEventOutside(previewFormSectionRef, formDroppableRef, 'dragover', () => {
    indexPointer.value = null
    dragInIndicator.value = {}
  })
})

onUnmounted(() => {
  if (stopListening)
    stopListening()
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

const data = computed(() => ({ ...formStore.values,  empty, eq, contains  }))

function onSubmit(data: any, node: FormKitNode) {
  console.log(data)
  reset(node, {})
}

const builderFields = computed(() => formStore.getFields as unknown as ViewerField[])

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
              <div ref="formDroppableRef"
                class="form-canvas q-py-sm rounded-borders grid grid-cols-12 row-gap-y-gutter column-gap-x-gutter"
                @drop.prevent="onDrop" @dragover.prevent="handleDragover">
                <!-- No elements display message -->
                <div v-if="!formStore.formFields.length"
                  class="overlay-drop-here row items-center justify-center rounded-borders span-12"
                  :class="{ 'bg-green-8': !formStore.formFields.length && highlightDropArea }"
                  @dragenter.prevent="onDragEnterFormSectionArea" @dragleave.prevent="onDragLeaveFormSectionArea">
                  Arraste e solte aqui os elementos
                  da coluna esquerda
                </div>

                <div v-for="(field, index) in builderFields" :key="field?.name || index" class="form-field" :class="[
                  useFieldUi().getSpanClass(field as any, formStore.formSettings.columns),
                  useFieldUi().getAlignClass(field as any),
                  (Object.keys(field).some(objKey => objKey.includes('hasCondition')) && formStore.formSettings.previewMode === 'editing') ? 'opacity-50' : ''
                ]" @mouseover.prevent="onMouseOverAtFormElement(field)"
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
                    :preview-mode-editing="formStore.formSettings.previewMode === 'editing'"
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
              </div>
            </FormKit>
          </q-card-section>
        </q-card>
      </article>
    </q-scroll-area>
  </section>
</template>

<style lang="scss">
:root {
  --overlay-accent-color: #2980b9;
  --overlay-accent-color-rgba: rgba(41, 128, 185, .2);
}

.preview-form-container {
  margin-left: 4rem;
  margin-right: 4rem;
  min-height: 100px;
  padding: 3.125rem;
  width: 100%;
}

.form-canvas {
  height: fit-content;
}

.form-field {
  position: relative;
  pointer-events: auto;
}

.overlay-drop-here {
  position: relative;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
  height: 328px;
}

/* Overlay-specific styles moved to FieldOverlay.vue */

.text-weight-semibold {
  font-weight: 600;
}

.break-all {
  word-break: break-all;
}

.grid {
  display: grid
}

.grid-cols-12 {
  grid-template-columns: repeat(12, minmax(0, 1fr))
}

.row-gap-y-gutter {
  row-gap: 1rem;
}

.column-gap-x-gutter {
  column-gap: 1rem;
}

.span-1 {
  grid-column: span 1;
}

.span-2 {
  grid-column: span 2;
}

.span-3 {
  grid-column: span 3;
}

.span-4 {
  grid-column: span 4;
}

.span-5 {
  grid-column: span 5;
}

.span-6 {
  grid-column: span 6;
}

.span-7 {
  grid-column: span 7;
}

.span-8 {
  grid-column: span 8;
}

.span-9 {
  grid-column: span 9;
}

.span-10 {
  grid-column: span 10;
}

.span-11 {
  grid-column: span 11;
}

.span-12 {
  grid-column: span 12;
}

.justify-stretch {
  justify-content: stretch;
}

.opacity-50 {
  opacity: 0.5;
}

.mw-200 {
  max-width: 200px;
}
</style>
