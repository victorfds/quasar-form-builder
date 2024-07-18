<template>

  <section class="page-section bg-dark column items-center justify-start full-width" ref="previewFormSectionRef"
    :style="`height: calc(100vh - ${offset}px);`">

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



    <q-scroll-area class="full-width fit" :content-style="scrollAreaContentStyle"
      :content-active-style="scrollAreaContentStyle">
      <q-card flat class="preview-form-container bg-grey-10 q-pa-lg q-my-md full-width full-height">
        <q-card-section>
          <FormKit type="form" @submit="onSubmit" v-model="values">
            <div class="form-canvas" ref="formDropableRef" @drop.prevent="onDrop" @dragover.prevent="handleDragover">
              <div v-for="(field, index) in formFields" :key="field.name" class="form-field q-my-md"
                :class="{ 'active': activeNameFields.active?.includes(field?.name) || activeNameFields.hover === field?.name }"
                @dragstart="onDragStartField(index)" @dragenter="evt => onDragEnter(evt, index)" @dragend="onDragEnd"
                @mouseover="onMouseOverAtFormElement(field)" @mouseleave="onMouseLeaveAtFormElement" draggable="true">
                <FormKitSchema :schema="field" disable />
                <div class="overlay-preview-element" @click="onClickAtFormElement(field)" />
                <div v-if="activeNameFields.active?.includes(field?.name) || activeNameFields.hover === field?.name"
                  class="preview-form-name" :name="field?.name" @click="onClickAtFormElement(field)" />
                <q-icon name="content_copy"
                  v-if="activeNameFields.active?.includes(field?.name) || activeNameFields.hover === field?.name"
                  class="preview-form-copy-action" @click="copyField(field, index)">
                  <q-tooltip class="bg-dark" transition-show="fade" transition-hide="fade" anchor="top middle"
                    self="bottom middle" :offset="[4, 4]">
                    Clone
                  </q-tooltip>
                </q-icon>
                <q-icon name="o_delete"
                  v-if="activeNameFields.active?.includes(field?.name) || activeNameFields.hover === field?.name"
                  class="preview-form-remove-action" @click="removeField(index)">
                  <q-tooltip class="bg-dark" transition-show="fade" transition-hide="fade" anchor="top middle"
                    self="bottom middle" :offset="[4, 4]">
                    Remove
                  </q-tooltip>
                </q-icon>

              </div>
            </div>
          </FormKit>
          <pre wrap>{{ values }}</pre>

        </q-card-section>
      </q-card>
    </q-scroll-area>


  </section>
</template>
<script setup lang="ts">
import type { FormKitSchemaDefinition, FormKitSchemaNode } from '@formkit/core';
import { FormKitSchema, reset } from '@formkit/vue';

// local variables
const previewFormSectionRef = ref<HTMLElement | null>(null)
const formDropableRef = ref<HTMLElement | null>(null)
const values = ref({})
const indexPointer = ref(0)
const draggedFieldIndex = ref<number | null>(null)
const activeNameFields = ref<{ active: string[], hover?: string }>({ active: [] })

const formStore = useFormStore()
const formFields: FormKitSchemaDefinition[] = formStore.formFields

const scrollAreaContentStyle = { display: 'flex', justifyContent: 'center' }


// Global state
const offset = useState('offset')

// unsubscribe from listener
let stopListening: () => void;

onMounted(() => {
  stopListening = useClickOutside(previewFormSectionRef, formDropableRef, () => {
    activeNameFields.value.active = []
  })
})

onUnmounted(() => {
  if (stopListening) stopListening()
})

const onSubmit = (data, form) => {
  console.log(data)
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
    }
  }
}

const onDragStartField = (index: number) => {
  draggedFieldIndex.value = index
}

const handleDragover = (ev: DragEvent) => {
  // console.log(ev.detail)
}

const onDragEnter = (ev: DragEvent, index: number) => {
  indexPointer.value = index

  if (draggedFieldIndex.value !== null && draggedFieldIndex.value !== index) {
    const draggedField = formFields[draggedFieldIndex.value]!
    formStore.updateFieldIndex({ draggedField: draggedField, originalPosition: draggedFieldIndex.value, destinationIndex: index })
    draggedFieldIndex.value = index
  }
}

const onDragEnd = (e: DragEvent) => {
  draggedFieldIndex.value = null
}

const onClickAtFormElement = (field: FormKitSchemaDefinition) => {
  activeNameFields.value.active[0] = (field?.name)
  activeNameFields.value.active[1] = (field?.name)
}

const onMouseOverAtFormElement = (field: FormKitSchemaDefinition) => {
  activeNameFields.value.hover = (field?.name)
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
  cursor: pointer;
  border-color: transparent;
  border-style: solid;
  border-width: 1px;
  position: relative;

  &.active {
    border-color: #2980b9;
  }
}

.overlay-preview-element {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1;
}

.preview-form-name {
  position: absolute;
  top: -1.8rem;
  left: 0;

  &:before {
    background-color: #2980b9;
    content: attr(name);
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
  background-color: #2980b9;
  top: -1.4rem;
  right: 1.5rem;
  width: fit-content;
  height: fit-content;
  padding: 4px;
  z-index: 2;
}

.preview-form-remove-action {
  position: absolute;
  background-color: #2980b9;
  top: -1.4rem;
  right: 0;
  width: fit-contet;
  height: fit-content;
  padding: 4px;
  z-index: 2;
}
</style>
