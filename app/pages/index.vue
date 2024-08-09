<template>
  <section class=" row items-start justify-center full-width" :class="dark.isActive ? 'bg-grey-10' : 'bg-blue-grey-1'"
    ref="previewFormSectionRef">
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
                Pre-visualizar
              </q-tooltip>
            </q-icon>
          </template>
        </q-tab>
      </q-tabs>
      <!-- <q-btn-group unelevated class="fixed-left column q-ml-sm q-mt-md" -->
      <!--   :class="dark.isActive ? 'bg-dark' : 'bg-white'" style="max-height: 4rem;"> -->
      <!--   <q-btn icon="edit" size="sm" padding="sm" :color="dark.isActive ? 'grey' : 'blue-grey-10'"> -->
      <!--     <q-tooltip anchor="center right" self="center left" :offset="[2, 2]"> -->
      <!--       Editar -->
      <!--     </q-tooltip> -->
      <!--   </q-btn> -->
      <!--   <q-btn icon="visibility" size="sm" padding="sm" :color="dark.isActive ? 'grey' : 'blue-grey-10'"> -->
      <!--     <q-tooltip anchor="center right" self="center left" :offset="[2, 2]"> -->
      <!--       Pre-visualizar -->
      <!--     </q-tooltip> -->
      <!--   </q-btn> -->
      <!-- </q-btn-group> -->


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



      <!-- <q-scroll-area class="bg-yellow-9 full-width fit" :content-style="scrollAreaContentStyle" -->
      <!--   :content-active-style="scrollAreaContentStyle"> -->
      <q-card flat class="preview-form-container q-px-lg q-my-md full-width full-height"
        :class="dark.isActive ? 'bg-grey-10' : 'white'">
        <q-card-section :class="{ 'bg-green-4': !formFields.length }">
          <FormKit type="form" @submit="onSubmit" v-model="values" :actions="false">
            <div class="form-canvas full-height q-py-xl" ref="formDroppableRef" @drop.prevent="onDrop"
              @dragover.prevent="handleDragover">
              <div v-for="(field, index) in formFields" :key="field.name" class="form-field q-my-md"
                @mouseover.prevent="onMouseOverAtFormElement(field)" @mouseleave.prevent="onMouseLeaveAtFormElement">
                <FormKitSchema :schema="field" />
                <!-- Overlay preview -->
                <div class="overlay-preview-element cursor-pointer" @click="onClickAtFormElement(field)"
                  @dragstart="onDragStartField(field, index)" @dragend="onDragEnd(index)" :class="{
                    '__active': !elementBeingDragged.field && !elementBeingDragged.index && activeNameFields.active?.includes(field?.name),
                    '__dragging': elementBeingDragged.field?.name === field?.name,
                    '__hover': activeNameFields.hover === field?.name
                  }" draggable="true" />
                <!-- Top are drop  -->
                <div class="preview-element-area-top"
                  @dragenter.prevent="(ev) => onDragEnterInDropArea(ev, field?.name, Number(elementBeingDragged?.index) < index ? index - 1 : index)"
                  @dragover.prevent="onDragOverDropArea"
                  :class="{ 'hidden': elementBeingDragged.field?.name === field?.name }">
                  <div class="preview-element-label-wrapper preview-element-label-wrapper__top"
                    :class="{ 'hidden': dragInIndicator.name !== field?.name || (Number(elementBeingDragged?.index) > index && dragInIndicator.index !== index) || (Number(elementBeingDragged?.index) < index && dragInIndicator.index !== index - 1) }">
                    <div class="preview-element-label">Drag it here</div>
                  </div>
                </div>
                <!-- Bottom area drop -->
                <div class="preview-element-area-bottom"
                  @dragenter.prevent="(ev) => onDragEnterInDropArea(ev, field?.name, Number(elementBeingDragged?.index) > index ? index + 1 : index)"
                  @dragover.prevent="onDragOverDropArea"
                  :class="{ 'hidden': elementBeingDragged.field?.name === field?.name }">
                  <div class="preview-element-label-wrapper preview-element-label-wrapper__bottom"
                    :class="{ 'hidden': dragInIndicator.name !== field?.name || (Number(elementBeingDragged?.index) > index && dragInIndicator.index !== index + 1) || (Number(elementBeingDragged?.index) < index && dragInIndicator?.index !== index) }">
                    <div class="preview-element-label">Drag it here</div>
                  </div>
                </div>
                <div
                  v-if="!elementBeingDragged.field && !elementBeingDragged.index && activeNameFields.active?.includes(field?.name) || activeNameFields.hover === field?.name"
                  class="preview-form-name" :name="field?.name" @click="onClickAtFormElement(field)" />
                <q-icon name="content_copy"
                  v-if="!elementBeingDragged.field && !elementBeingDragged.index && activeNameFields.active?.includes(field?.name) || activeNameFields.hover === field?.name"
                  class="preview-form-copy-action cursor-pointer" @click="copyField(field, index)">
                  <q-tooltip class="bg-dark" transition-show="fade" transition-hide="fade" anchor="top middle"
                    self="bottom middle" :offset="[4, 4]">
                    Clone
                  </q-tooltip>
                </q-icon>
                <q-icon name="o_delete"
                  v-if="!elementBeingDragged.field && !elementBeingDragged.index && activeNameFields.active?.includes(field?.name) || activeNameFields.hover === field?.name"
                  class="preview-form-remove-action cursor-pointer" @click="removeField(index)">
                  <q-tooltip class="bg-dark" transition-show="fade" transition-hide="fade" anchor="top middle"
                    self="bottom middle" :offset="[4, 4]">
                    Remove
                  </q-tooltip>
                </q-icon>

              </div>
            </div>
          </FormKit>
          <!-- <pre wrap>{{ values }}</pre> -->

        </q-card-section>
      </q-card>
      <!-- </q-scroll-area> -->


      <q-btn-group flat unelevated class="column fixed-right q-mr-sm q-mt-md"
        :class="dark.isActive ? 'bg-dark text-grey-11' : 'bg-white text-blue-grey-10'" style="max-height: 4rem;">
        <q-btn icon="undo" size="sm" padding="sm">
          <q-tooltip anchor="center left" self="center right" :offset="[2, 2]">
            Retroceder
          </q-tooltip>
        </q-btn>
        <q-btn icon="redo" size="sm" padding="sm">
          <q-tooltip anchor="center left" self="center right" :offset="[2, 2]">
            Avançar
          </q-tooltip>
        </q-btn>
      </q-btn-group>
    </q-scroll-area>

  </section>
</template>
<script setup lang="ts">
import type { FormKitSchemaDefinition, FormKitSchemaNode } from '@formkit/core';
import { FormKitSchema, reset } from '@formkit/vue';

// local variables
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

const scrollAreaContentStyle = { display: 'flex', justifyContent: 'center' }


// Global state
const offset = useState('offset')

// unsubscribe from listener
let stopListening: () => void;

onMounted(() => {
  stopListening = useClickOutside(previewFormSectionRef, formDroppableRef, () => {
    activeNameFields.value.active = []
  })

  useEventOutside(previewFormSectionRef, formDroppableRef, 'dragover', e => {
    indexPointer.value = null
    dragInIndicator.value = {}
  })

})

onUnmounted(() => {
  if (stopListening) stopListening()
})

const onSubmit = (data, form) => {
  reset(form, data);
}

const onDrop = (ev: DragEvent) => {
  const toolData = ev.dataTransfer?.getData("text")
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
    }
  }
}

const onDragStartField = (field: FormKitSchemaDefinition, index: number) => {
  originalFieldIndex.value = index
  elementBeingDragged.value = { field, index }
}

const handleDragover = (ev: DragEvent) => {
  // this fn is needed in order to drop work in from area
}

const onDragEnterInDropArea = (e: DragEvent, fieldName: string, index: number) => {
  dragInIndicator.value.index = index
  dragInIndicator.value.name = fieldName
  indexPointer.value = index
}

const onDragOverDropArea = (e: DragEvent) => {
  if (!originalFieldIndex.value && !elementBeingDragged.value.field && !elementBeingDragged.value.index) {
    elementBeingDragged.value.index = formFields.length
    elementBeingDragged.value.field = formFields.at(-1)?.name
  }
}

const onDragEnd = (index: number) => {

  if (originalFieldIndex.value !== null && indexPointer.value !== null && originalFieldIndex.value !== indexPointer.value) {
    const draggedField = formFields[index]!
    formStore.updateFieldIndex({ draggedField, originalPosition: index, destinationIndex: indexPointer.value })
  }


  originalFieldIndex.value = null
  indexPointer.value = null
  elementBeingDragged.value = {}
  dragInIndicator.value = {}
}

const onClickAtFormElement = (field: FormKitSchemaDefinition) => {
  activeNameFields.value.active[0] = field?.name
  activeNameFields.value.active[1] = field?.name
}

const onMouseOverAtFormElement = (field: FormKitSchemaDefinition) => {
  activeNameFields.value.hover = field?.name
}

const onMouseLeaveAtFormElement = () => {
  activeNameFields.value.hover = ""
}

const copyField = (field: FormKitSchemaNode, index: number) => {
  const newElemPosition = index + 1
  activeNameFields.value.active[0] = (field?.name)
  formStore.addField({ ...field, name: field?.name.split("_").at(0) }, newElemPosition)
  activeNameFields.value.active[1] = formFields.at(newElemPosition)?.name
}

const removeField = (index: number) => {
  formStore.removeField({ index })
}
</script>
<style lang="scss">
:root {
  --overlay-accent-color: #2980b9;
}

.preview-form-container {
  max-width: 580px;
  min-height: 100px;
}

.form-canvas {
  min-height: 100px;
}

.form-field {
  position: relative;
  pointer-events: auto;
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
  position: absolute;
  top: -1.8rem;
  left: 0;

  &:before {
    background-color: var(--overlay-accent-color, #2980b9);
    content: attr(name);
    color: white;
    top: 0;
    left: 0;
    width: fit-content;
    height: fit-content;
    padding: 4px;
    position: absolute;
    z-index: 2;
  }
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
}
</style>
