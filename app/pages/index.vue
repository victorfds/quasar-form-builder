<script setup lang="ts">
import type { FormKitSchemaDefinition, FormKitSchemaNode } from '@formkit/core'
import { FormKitSchema, reset } from '@formkit/vue'

// local variables
const highlightDropArea = ref<boolean>(false)
const previewFormSectionRef = ref<HTMLElement | null>(null)
const formDroppableRef = ref<HTMLElement | null>(null)
const values = ref({})
const indexPointer = ref<number | null>(null)
const elementBeingDragged = ref<{ field?: FormKitSchemaDefinition, index?: number }>({})
const originalFieldIndex = ref<number | null>(null)
const activeNameFields = ref<{ active: string[], hover?: string }>({ active: [] })
const dragInIndicator = ref<{ index?: number, name?: string }>({})

const { dark } = useQuasar()
const formStore = useFormStore()
const formFields: FormKitSchemaDefinition[] = formStore.formFields
const { setActiveField, copyField } = formStore

const scrollAreaContentStyle = { display: 'flex', justifyContent: 'center' }

// Global state
const offset = useState('offset')

// unsubscribe from listener
let stopListening: () => void

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

function onDragEnterFormSectionArea() {
  highlightDropArea.value = true
}

function onDragLeaveFormSectionArea() {
  highlightDropArea.value = false
}

function onSubmit(data, form) {
  reset(form, data)
}

function onDrop(ev: DragEvent) {
  const toolData = ev.dataTransfer?.getData('text')
  if (toolData) {
    try {
      const tool: FormKitSchemaNode = JSON.parse(toolData)
      formStore.addField(tool, indexPointer.value)
    }
    catch {
      // silent error
    }
    finally {
      originalFieldIndex.value = null
      indexPointer.value = null
      elementBeingDragged.value = {}
      dragInIndicator.value = {}
    }
  }
}

function onDragStartField(field: FormKitSchemaDefinition, index: number) {
  originalFieldIndex.value = index
  elementBeingDragged.value = { field, index }
}

function handleDragover(ev: DragEvent) {
  // this fn is needed in order to drop work in from area
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
}

function onClickAtFormElement(field: FormKitSchemaNode) {
  activeNameFields.value.active[0] = field?.name
  activeNameFields.value.active[1] = field?.name
  setActiveField(field)
}

function onMouseOverAtFormElement(field: FormKitSchemaNode) {
  activeNameFields.value.hover = field?.name
}

function onMouseLeaveAtFormElement() {
  activeNameFields.value.hover = ''
}

function handleCopyField(field: FormKitSchemaNode, index: number) {
  copyField(field, index)
  activeNameFields.value.active[0] = field?.name
  activeNameFields.value.active[1] = formFields.at(index + 1)?.name
}

function removeField(field: FormKitSchemaNode, index: number) {
  formStore.removeField({ index })
  if (formStore.activeField?.name === field?.name) {
    setActiveField(null)
  }
}
</script>

<template>
  <section ref="previewFormSectionRef" class=" row items-start justify-center full-width"
    :class="dark.isActive ? 'bg-grey-10' : 'bg-blue-grey-1'">
    <!-- :style="`height: calc(100vh - ${offset}px);`" -->
    <q-scroll-area class="full-width relative-position" :content-style="scrollAreaContentStyle"
      :content-active-style="scrollAreaContentStyle" :style="`height: calc(100vh - ${offset}px);`">
      <q-tabs vertical dense shrink class="rounded-borders fixed-left q-ml-sm q-mt-md"
        :class="dark.isActive ? 'bg-dark text-grey-11' : 'bg-white text-blue-grey-10'" indicator-color="transparent"
        active-bg-color="secondary" active-color="blue-grey-1" style="max-height: 4.5rem;">
        <q-tab name="edit">
          <template #default>
            <q-icon name="edit" size="xs">
              <q-tooltip anchor="center right" self="center left" :offset="[12, 12]">
                Editar
              </q-tooltip>
            </q-icon>
          </template>
        </q-tab>
        <q-tab name="alarms">
          <template #default>
            <q-icon name="visibility" size="xs">
              <q-tooltip anchor="center right" self="center left" :offset="[12, 12]">
                Pré-visualizar
              </q-tooltip>
            </q-icon>
          </template>
        </q-tab>
      </q-tabs>

      <!-- <FormKit type="q-input" label="Text label" name="text1" input-type="text" validation="required:trim" -->
      <!--     help="O que é isso?" /> -->
      <!--   <FormKit type="q-input" label="Number label" name="number1" input-type="number" -->
      <!--     validation="required:trim|number|min:1" /> -->
      <!--   <FormKit type="q-input" label="Email" name="email" input-type="email" validation="required:trim|email" /> -->
      <!--   <FormKit type="q-select" label="Select options" name="select1" -->
      <!--     :options="[{ label: 'This is an option 1', value: 'option1' }, { label: 'This is an option 2', value: 'option2' }]" -->
      <!--     help="Select one of the two options" /> -->
      <!--   <FormKit type="q-btn-toggle" label="Select options" name="toggle" -->
      <!--     :options="[{ label: 'This is an option 1', value: 'option1' }, { label: 'This is an option 2', value: 'option2' }]" /> -->
      <!--   <FormKit type="q-checkbox" label="Concordo com os termos" name="check1" /> -->
      <!--   <FormKit type="q-editor" name="editor" label="Edite seu texto aqui" /> -->
      <!--   <FormKit type="q-date" name="date1" /> -->
      <!--   <FormKit type="q-datetime" name="date" /> -->

      <q-card flat class="preview-form-container q-px-lg q-my-md full-width full-height"
        :class="dark.isActive ? 'bg-dark' : 'white'">
        <q-card-section>
          <FormKit v-model="values" type="form" :actions="false" @submit="onSubmit">
            <div ref="formDroppableRef" class="form-canvas q-py-xl rounded-borders" @drop.prevent="onDrop"
              @dragover.prevent="handleDragover">
              <!-- No elements display message -->
              <div v-if="!formFields.length" class="overlay-drop-here row items-center justify-center rounded-borders"
                :class="{ 'bg-green-8': !formFields.length && highlightDropArea }"
                @dragenter.prevent="onDragEnterFormSectionArea" @dragleave.prevent="onDragLeaveFormSectionArea">
                Arraste e solte aqui os elementos
                da coluna esquerda
              </div>

              <div v-for="(field, index) in formFields" :key="field.name" class="form-field q-my-md"
                @mouseover.prevent="onMouseOverAtFormElement(field)" @mouseleave.prevent="onMouseLeaveAtFormElement">
                <FormKitSchema :schema="field" />
                <!-- Overlay preview -->
                <div class="overlay-preview-element cursor-pointer" :class="{
                  __latest: !elementBeingDragged.field && !elementBeingDragged.index && activeNameFields.active.at(-1) === field?.name,
                  __active: !elementBeingDragged.field && !elementBeingDragged.index && activeNameFields.active?.includes(field?.name),
                  __dragging: elementBeingDragged.field?.name === field?.name,
                  __hover: activeNameFields.hover === field?.name,
                }" draggable="true" @click="onClickAtFormElement(field)" @dragstart="onDragStartField(field, index)"
                  @dragend="onDragEnd(index)" />
                <!-- Top are drop  -->
                <div class="preview-element-area-top"
                  :class="{ hidden: elementBeingDragged.field?.name === field?.name }"
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
                  :class="{ hidden: elementBeingDragged.field?.name === field?.name }"
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
                  v-if="!elementBeingDragged.field && !elementBeingDragged.index && activeNameFields.active?.includes(field?.name) || activeNameFields.hover === field?.name"
                  class="preview-form-name" @click="onClickAtFormElement(field)">
                  {{ field?.name }}
                </div>
                <q-icon
                  v-if="!elementBeingDragged.field && !elementBeingDragged.index && activeNameFields.active?.includes(field?.name) || activeNameFields.hover === field?.name"
                  name="content_copy" class="preview-form-copy-action cursor-pointer"
                  @click="handleCopyField(field, index)">
                  <q-tooltip class="bg-dark" transition-show="fade" transition-hide="fade" anchor="top middle"
                    self="bottom middle" :offset="[4, 4]">
                    Clone
                  </q-tooltip>
                </q-icon>
                <q-icon
                  v-if="!elementBeingDragged.field && !elementBeingDragged.index && activeNameFields.active?.includes(field?.name) || activeNameFields.hover === field?.name"
                  name="o_delete" class="preview-form-remove-action cursor-pointer" @click="removeField(field, index)">
                  <q-tooltip class="bg-dark" transition-show="fade" transition-hide="fade" anchor="top middle"
                    self="bottom middle" :offset="[4, 4]">
                    Remove
                  </q-tooltip>
                </q-icon>
              </div>
            </div>
          </FormKit>
        </q-card-section>
      </q-card>

      <q-tabs vertical dense shrink class="rounded-borders fixed-right q-mr-sm q-mt-md"
        :class="dark.isActive ? 'bg-dark text-grey-11' : 'bg-white text-blue-grey-10'" indicator-color="transparent"
        style="max-height: 4.5rem;">
        <q-tab name="undo">
          <template #default>
            <q-icon name="undo" size="xs">
              <q-tooltip anchor="center left" self="center right" :offset="[12, 12]">
                Retroceder
              </q-tooltip>
            </q-icon>
          </template>
        </q-tab>
        <q-tab name="redo">
          <template #default>
            <q-icon name="redo" size="xs">
              <q-tooltip anchor="center left" self="center right" :offset="[12, 12]">
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
  max-width: 580px;
  min-height: 100px;
}

.form-canvas {
  min-height: 100px;
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
</style>
