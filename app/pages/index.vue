<template>

  <section class="bg-dark" ref="previewFormSectionRef">

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


    <article class="preview-form-container bg-grey-10 q-pa-lg q-mx-auto">
      <FormKit type="form" @submit="onSubmit" v-model="values">

        <div class="form-canvas" ref="formDropableRef" @drop.prevent="onDrop" @dragover.prevent="handleDragover">
          <div v-for="(field, index) in formFields" :key="field.name" class="overlay-preview-element q-my-md"
            :class="{ 'active': activeNameFields.active === field?.name || activeNameFields.hover === field?.name }"
            @dragstart="onDragStartField(index)" @dragenter="evt => onDragEnter(evt, index)" @dragend="onDragEnd"
            @click="onClickAtFormElement(field)" @mouseover="onMouseOverAtFormElement(field)"
            @mouseleave="onMouseLeaveAtFormElement" draggable="true">
            <FormKitSchema :schema="field" disable />
            <div v-if="activeNameFields.active === field?.name || activeNameFields.hover === field?.name"
              class="preview-form-name" :name="field?.name">
            </div>
          </div>
        </div>

      </FormKit>
      <pre wrap>{{ values }}</pre>
    </article>

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
const activeNameFields = ref<{ active?: string, hover?: string }>({})
const formStore = useFormStore()
const formFields: FormKitSchemaDefinition[] = formStore.formFields

// unsubscribe from listener
let stopListening: () => void;

onMounted(() => {
  stopListening = useClickOutside(previewFormSectionRef, formDropableRef, () => {
    activeNameFields.value.active = ""
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
  activeNameFields.value.active = (field?.name)
}

const onMouseOverAtFormElement = (field: FormKitSchemaDefinition) => {
  activeNameFields.value.hover = (field?.name)
}

const onMouseLeaveAtFormElement = () => {
  activeNameFields.value.hover = ""
}
</script>
<style lang="scss">
.preview-form-container {
  max-width: 580px;
}

.form-canvas {
  height: 327px;
}

.overlay-preview-element {
  cursor: pointer;
  border-color: transparent;
  border-style: solid;
  border-width: 1px;
  position: relative;

  &.active {
    border-color: #2980b9;
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

}
</style>
