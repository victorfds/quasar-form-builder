<script setup lang="ts">
import type { FormKitNode, FormKitSchemaDefinition, FormKitSchemaNode } from '@formkit/core'
import { empty, eq } from '@formkit/utils'
import { clearErrors, FormKitSchema, reset } from '@formkit/vue'
import type { ActiveFieldType } from "~/types"

// local variables
const highlightDropArea = ref<boolean>(false)
const previewFormSectionRef = ref<HTMLElement | null>(null)
const formDroppableRef = ref<HTMLElement | null>(null)
const formRefComponent = ref<HTMLElement | null>(null)
const indexPointer = ref<number | null>(null)
const elementBeingDragged = ref<{ field?: FormKitSchemaDefinition, index?: number }>({})
const originalFieldIndex = ref<number | null>(null)
const activeNameFields = ref<{ active: string[], hover?: string }>({ active: [] })
const dragInIndicator = ref<{ index?: number, name?: string }>({})
const isUserDraggingOver = ref(false)
const isDragging = ref(true)
const startX = ref(0)
const lastDeltaColumns = ref(0)

const { dark } = useQuasar()
const formStore = useFormStore()
const formFields: FormKitSchemaDefinition[] = formStore.formFields
const { setActiveField, copyField, updateActiveFieldColumns, updateActiveFieldOnFormFields } = formStore

const scrollAreaContentStyle = { display: 'flex', justifyContent: 'center' }

// Global state
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
    setActiveField(null)
  })

  useEventOutside(previewFormSectionRef, formDroppableRef, 'dragover', (e) => {
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

const getUserWidthInput: ComputedRef<number> = computed(() => {
  // Returns the initial width form value if undefined
  if (!formStore.formSettings.preview.width)
    return 432
  if (Number(formStore.formSettings.preview.width) < 0)
    return 0

  return Number(formStore.formSettings.preview.width)
})

const data = computed(() => {
  /*
  This returned functions are essentials for FormKit's data expression
  */
  return { ...formStore.values, empty, eq, contains }
})

function onDragEnterFormSectionArea() {
  highlightDropArea.value = true
}

function onDragLeaveFormSectionArea() {
  highlightDropArea.value = false
}

function onSubmit(data: any, node: FormKitNode) {
  reset(node, {})
}

function onDrop(ev: DragEvent) {
  const toolData = ev.dataTransfer?.getData('text')
  if (toolData) {
    try {
      const tool: FormKitSchemaNode = JSON.parse(toolData)
      formStore.addField(tool, indexPointer.value)
    } catch {
      // silent error
    } finally {
      originalFieldIndex.value = null
      indexPointer.value = null
      elementBeingDragged.value = {}
      dragInIndicator.value = {}
      isUserDraggingOver.value = false
      highlightDropArea.value = false
    }
  }
}

function onDragStartField(field: FormKitSchemaDefinition, index: number) {
  originalFieldIndex.value = index
  elementBeingDragged.value = { field, index }
}

function handleDragover(ev: DragEvent) {
  // this fn is needed in order to drop work in from area
  isUserDraggingOver.value = true
}

function onDragEnterInDropArea(e: DragEvent, fieldName: string, index: number) {
  dragInIndicator.value.index = index
  dragInIndicator.value.name = fieldName
  indexPointer.value = index
}

function onDragOverDropArea(e: DragEvent) {
  if (!originalFieldIndex.value && !elementBeingDragged.value.field && !elementBeingDragged.value.index) {
    elementBeingDragged.value.index = formFields.length
    elementBeingDragged.value.field = formFields.at(-1)?.name
  }
}

function onDragEnd(index: number) {
  if (originalFieldIndex.value !== null && indexPointer.value !== null && originalFieldIndex.value !== indexPointer.value) {
    const draggedField = formFields[index]!
    formStore.updateFieldIndex({ draggedField, originalPosition: index, destinationIndex: indexPointer.value })
  }

  originalFieldIndex.value = null
  indexPointer.value = null
  elementBeingDragged.value = {}
  dragInIndicator.value = {}
  isUserDraggingOver.value = false
}

function onClickAtFormElement(index: number) {
  const field = formStore.formFields.find((_, idx) => idx === index) || null

  activeNameFields.value.active[0] = field?.name
  activeNameFields.value.active[1] = field?.name
  setActiveField(field as ActiveFieldType)
}

function onMouseOverAtFormElement(field: FormKitSchemaNode) {
  activeNameFields.value.hover = field?.name
}

function onMouseLeaveAtFormElement() {
  activeNameFields.value.hover = ''
}

function handleCopyField(field: FormKitSchemaNode, index: number) {
  copyField(index)
  activeNameFields.value.active[0] = field?.name
  activeNameFields.value.active[1] = formFields.at(index + 1)?.name
}

function removeField(field: FormKitSchemaNode, index: number) {
  formStore.removeField(field, index)
  if (formStore.activeField?.name === field?.name) {
    setActiveField(null)
  }
}

function startResize(evt: MouseEvent, field: ActiveFieldType) {
  setActiveField(field)
  isDragging.value = true
  startX.value = evt.clientX
  document.addEventListener('mousemove', throttleResize)
  document.addEventListener('mouseup', stopResize)
}

function resize(event: MouseEvent) {
  if (!isDragging.value) return

  const wrapperElement = document.querySelector('.my-form-wrapper') as HTMLElement
  const containerWidth = wrapperElement.getBoundingClientRect().width || getUserWidthInput.value
  const columnWidth = containerWidth / 12
  const deltaX = event.clientX - startX.value
  const deltaColumns = Math.round(deltaX / columnWidth)
  const direction = deltaColumns > lastDeltaColumns.value ? 1 : -1 // from left-to-right (positive), from right-to-left (negative)

  // Calculate column change based on the direction value
  const columnChange = formStore.getActiveFieldColumns + direction

  const newColumns = Math.max(1, Math.min(12, columnChange))

  if (newColumns !== formStore.getActiveFieldColumns && lastDeltaColumns.value !== deltaColumns) {
    lastDeltaColumns.value = deltaColumns
    updateActiveFieldColumns(newColumns)
  }
}

function throttleResize(event: MouseEvent) {
  requestAnimationFrame(() => resize(event))
}

function stopResize() {
  isDragging.value = false
  lastDeltaColumns.value = 0
  updateActiveFieldOnFormFields()
  document.removeEventListener('mousemove', throttleResize)
  document.removeEventListener('mouseup', stopResize)
}
</script>

<template>
  <section class="full-width" :class="dark.isActive ? 'bg-grey-10' : 'bg-blue-grey-1'">
    <q-scroll-area class="full-width relative-position" :content-style="scrollAreaContentStyle"
      :content-active-style="scrollAreaContentStyle" :style="`height: calc(100vh - ${offset}px);`"
      :thumb-style="{ width: '4px' }">
      <q-tabs v-model="formStore.formSettings.previewMode" vertical dense shrink
        class="rounded-borders fixed-left q-ml-sm q-mt-md"
        :class="dark.isActive ? 'bg-dark text-white' : 'bg-white text-blue-grey-10'" indicator-color="transparent"
        active-bg-color="secondary" active-color="blue-grey-1" style="max-height: 4.5rem;">
        <q-tab name="editing">
          <template #default>
            <q-icon name="edit" size="xs">
              <q-tooltip class="bg-grey-10" anchor="center right" self="center left" :offset="[12, 12]">
                Editar
              </q-tooltip>
            </q-icon>
          </template>
        </q-tab>
        <q-tab name="previewing">
          <template #default>
            <q-icon name="visibility" size="xs">
              <q-tooltip class="bg-grey-10" anchor="center right" self="center left" :offset="[12, 12]">
                Pré-visualizar
              </q-tooltip>
            </q-icon>
          </template>
        </q-tab>
      </q-tabs>

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
                <div v-if="!formFields.length"
                  class="overlay-drop-here row items-center justify-center rounded-borders span-12"
                  :class="{ 'bg-green-8': !formFields.length && highlightDropArea }"
                  @dragenter.prevent="onDragEnterFormSectionArea" @dragleave.prevent="onDragLeaveFormSectionArea">
                  Arraste e solte aqui os elementos
                  da coluna esquerda
                </div>

                <div v-for="(field, index) in formStore.getFields" :key="field.name" class="form-field" :class="[
                  field.columns ? `span-${formStore.formSettings.columns === 'default' ? field.columns?.container || field.columns?.default?.container || 12 : field.columns?.[formStore.formSettings.columns]?.container || 12}` : 'span-12',
                  field.align && {
                    right: 'flex justify-end',
                    center: 'flex justify-center',
                    left: 'flex justify-start',
                  }[field.align] || '',
                  (Object.keys(field).some(objKey => objKey.includes('hasCondition')) && formStore.formSettings.previewMode === 'editing') ? 'opacity-50' : ''
                ]" @mouseover.prevent="onMouseOverAtFormElement(field)"
                  @mouseleave.prevent="onMouseLeaveAtFormElement">

                  <FormKitSchema :schema="field" :data="data" />
                  <!-- Overlay preview -->
                  <div class="overlay-preview-element cursor-pointer" :class="{
                    __latest: !elementBeingDragged.field && !elementBeingDragged.index && activeNameFields.active.at(-1) === field?.name,
                    __active: !elementBeingDragged.field && !elementBeingDragged.index && activeNameFields.active?.includes(field?.name),
                    __dragging: elementBeingDragged.field?.name === field?.name,
                    __hover: !activeNameFields.active?.includes(field?.name) && activeNameFields.hover === field?.name,
                    hidden: formStore.formSettings.previewMode !== 'editing',
                  }" draggable="true" @click="onClickAtFormElement(index)" @dragstart="onDragStartField(field, index)"
                    @dragend="onDragEnd(index)" />
                  <!-- Top are drop  -->
                  <div class="preview-element-area-top"
                    :class="{ hidden: elementBeingDragged.field?.name === field?.name || !isUserDraggingOver }"
                    @dragenter.prevent="(ev) => onDragEnterInDropArea(ev, field?.name, Number(elementBeingDragged?.index) < index ? index - 1 : index)"
                    @dragover.prevent="onDragOverDropArea">
                    <div class="preview-element-label-wrapper preview-element-label-wrapper__top"
                      :class="{ hidden: dragInIndicator.name !== field?.name || (Number(elementBeingDragged?.index) > index && dragInIndicator.index !== index) || (Number(elementBeingDragged?.index) < index && dragInIndicator.index !== index - 1) }">
                      <div class="preview-element-label">
                        Drag it here
                      </div>
                    </div>
                  </div>
                  <!-- Bottom area drop -->
                  <div class="preview-element-area-bottom"
                    :class="{ hidden: elementBeingDragged.field?.name === field?.name || !isUserDraggingOver }"
                    @dragenter.prevent="(ev) => onDragEnterInDropArea(ev, field?.name, Number(elementBeingDragged?.index) > index ? index + 1 : index)"
                    @dragover.prevent="onDragOverDropArea">
                    <div class="preview-element-label-wrapper preview-element-label-wrapper__bottom"
                      :class="{ hidden: dragInIndicator.name !== field?.name || (Number(elementBeingDragged?.index) > index && dragInIndicator.index !== index + 1) || (Number(elementBeingDragged?.index) < index && dragInIndicator?.index !== index) }">
                      <div class="preview-element-label">
                        Drag it here
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="formStore.formSettings.previewMode === 'editing' && !elementBeingDragged.field && !elementBeingDragged.index && activeNameFields.active?.includes(field?.name) || (activeNameFields.hover === field?.name && formStore.formSettings.previewMode === 'editing')"
                    class="preview-form-name" @click="onClickAtFormElement(index)">
                    {{ field?.name }}
                  </div>
                  <q-icon
                    v-if="formStore.formSettings.previewMode === 'editing' && !elementBeingDragged.field && !elementBeingDragged.index && activeNameFields.active?.includes(field?.name) || (activeNameFields.hover === field?.name && formStore.formSettings.previewMode === 'editing')"
                    name="content_copy" class="preview-form-copy-action cursor-pointer"
                    @click="handleCopyField(field, index)">
                    <q-tooltip class="bg-dark" transition-show="fade" transition-hide="fade" anchor="top middle"
                      self="bottom middle" :offset="[4, 4]">
                      Clone
                    </q-tooltip>
                  </q-icon>
                  <q-icon
                    v-if="formStore.formSettings.previewMode === 'editing' && !elementBeingDragged.field && !elementBeingDragged.index && activeNameFields.active?.includes(field?.name) || (activeNameFields.hover === field?.name && formStore.formSettings.previewMode === 'editing')"
                    name="o_delete" class="preview-form-remove-action cursor-pointer"
                    @click="removeField(field, index)">
                    <q-tooltip class="bg-dark" transition-show="fade" transition-hide="fade" anchor="top middle"
                      self="bottom middle" :offset="[4, 4]">
                      Remove
                    </q-tooltip>
                  </q-icon>
                  <!-- Resizer icon -->
                  <div
                    v-if="formStore.formSettings.previewMode === 'editing' && !elementBeingDragged.field && !elementBeingDragged.index && activeNameFields.active?.includes(field?.name) || (activeNameFields.hover === field?.name && formStore.formSettings.previewMode === 'editing')"
                    class="preview-element-resizer-icon" />
                  <!-- Resizer -->
                  <div
                    v-if="formStore.formSettings.previewMode === 'editing' && !elementBeingDragged.field && !elementBeingDragged.index && activeNameFields.active?.includes(field?.name) || (activeNameFields.hover === field?.name && formStore.formSettings.previewMode === 'editing')"
                    class="preview-element-resizer" draggable="true"
                    @mousedown.prevent="evt => startResize(evt, field)" />
                  <!-- Columns display -->
                  <div
                    v-if="formStore.formSettings.previewMode === 'editing' && !elementBeingDragged.field && !elementBeingDragged.index && activeNameFields.active?.includes(field?.name) || (activeNameFields.hover === field?.name && formStore.formSettings.previewMode === 'editing')"
                    class="preview-element-columns-display">
                    <span>
                      {{
                        formStore.formSettings.columns === 'default' ? field.columns?.container
                          || field.columns?.default?.container || 12
                          : field.columns?.[formStore.formSettings.columns]?.container
                          || 12
                      }}
                    </span>
                  </div>
                </div>
              </div>
            </FormKit>
          </q-card-section>
        </q-card>
      </article>

      <q-tabs vertical dense shrink class="rounded-borders fixed-right q-mr-sm q-mt-md"
        :class="dark.isActive ? 'bg-dark text-grey-11' : 'bg-white text-blue-grey-10'" indicator-color="transparent"
        style="max-height: 4.5rem;">
        <q-tab name="undo">
          <template #default>
            <q-icon name="undo" size="xs">
              <q-tooltip class="bg-grey-10" anchor="center left" self="center right" :offset="[12, 12]">
                Retroceder
              </q-tooltip>
            </q-icon>
          </template>
        </q-tab>
        <q-tab name="redo">
          <template #default>
            <q-icon name="redo" size="xs">
              <q-tooltip class="bg-grey-10" anchor="center left" self="center right" :offset="[12, 12]">
                Avançar
              </q-tooltip>
            </q-icon>
          </template>
        </q-tab>
      </q-tabs>
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

.overlay-preview-element {
  border-color: transparent;
  border-style: solid;
  border-width: 1px;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;

  &.__latest {
    background-color: var(--overlay-accent-color-rgba, rgba(41, 128, 185, .4));
  }

  &.__hover {
    border-color: var(--overlay-accent-color, #2980b9);
    z-index: 1;
  }

  &.__active {

    border-color: var(--overlay-accent-color, #2980b9);
    z-index: 1;
  }

  &.__dragging {
    border-color: var(--overlay-accent-color, #2980b9);
    border-style: dashed;
    z-index: 1;
  }
}

.preview-element-area-top {
  position: absolute;
  bottom: 50%;
  top: -.5rem;
  left: 0;
  right: 0;
}

.preview-element-area-bottom {
  position: absolute;
  top: 50%;
  bottom: -.5rem;
  left: 0;
  right: 0;
}

.preview-element-label-wrapper {
  pointer-events: none;
  position: absolute;
  height: .25rem;
  border-radius: 9999px;
  background-color: #a82454;

  &__bottom {
    left: -.5rem;
    right: -.5rem;
    bottom: -.125rem;
  }

  &__top {
    left: -.5rem;
    right: -.5rem;
    top: -.125rem;
  }

  .preview-element-label {
    color: white;
    position: absolute;
    left: 50%;
    right: 50%;
    border-radius: 9999px;
    background-color: #a82454;
    padding: .125rem .5rem;
    font-size: .875rem;
    line-height: 1rem;
    transform: translate(-2.5rem, -.5rem);
    text-wrap: nowrap;
    width: fit-content;
  }
}

.preview-form-name {
  background-color: var(--overlay-accent-color, #2980b9);
  top: 0;
  left: 0;
  color: white;
  width: fit-content;
  height: fit-content;
  max-width: 100%;
  padding: 4px;
  position: absolute;
  overflow: hidden;
  z-index: 2;
  transform: translateY(-100%);
}

.preview-form-copy-action {
  position: absolute;
  background-color: var(--overlay-accent-color, #2980b9);
  color: white;
  top: -1.4rem;
  right: 1.5rem;
  width: fit-content;
  height: fit-content;
  padding: 4px;
  z-index: 2;
}

.preview-form-remove-action {
  position: absolute;
  background-color: var(--overlay-accent-color, #2980b9);
  color: white;
  top: -1.4rem;
  right: 0;
  width: fit-contet;
  height: fit-content;
  padding: 4px;
  z-index: 2;
}

.preview-element-resizer-icon {
  position: absolute;
  pointer-events: none;
  background-color: white;
  border: 1px solid $blue-grey-6;
  border-radius: .125rem;
  top: 50%;
  bottom: 0;
  right: 0;
  height: .562rem;
  width: .562rem;
  translate: 44% -50%;
  z-index: 1;
}

.preview-element-resizer {
  cursor: col-resize;
  position: absolute;
  top: 0;
  bottom: 0;
  right: -.25rem;
  width: .5rem;
  z-index: 9999;
}

.preview-element-columns-display {
  position: absolute;
  background-color: white;
  border: 1px solid $blue-grey-6;
  border-radius: .125rem;
  bottom: 0;
  color: $grey-10;
  top: 50%;
  left: 0;
  font-size: .875rem;
  pointer-events: none;
  translate: -50% -50%;
  height: 1rem;
  line-height: 1;
  width: auto;
  z-index: 1;
}

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
