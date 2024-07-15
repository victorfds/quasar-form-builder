<template>
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

  <FormKit type="form" @submit="onSubmit" v-model="values">
    <div class="form-canvas" @drop.prevent="onDrop" @dragover.prevent="handleDragover">
      <div v-for="(field, index) in formFields" :key="field.name" class="form-field q-my-md"
        @click="onClickAtFormElement" @dragstart="onDragStartField(index)" @dragenter="evt => onDragEnter(evt, index)"
        @dragend="onDragEnd" draggable="true">
        <FormKitSchema :schema="field" />
      </div>
    </div>
  </FormKit>
  <pre wrap>{{ values }}</pre>
</template>
<script setup lang="ts">
import type { FormKitSchemaDefinition, FormKitSchemaNode } from '@formkit/core';
import { FormKitSchema, reset } from '@formkit/vue';

const values = ref({})
const indexPointer = ref(0)
const formStore = useFormStore()
const formFields: FormKitSchemaDefinition[] = formStore.formFields

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
  formStore.setDraggedFieldIndex(index)
}

const handleDragover = (ev: DragEvent) => {
  // console.log(ev.detail)
}

const onDragEnter = (ev: DragEvent, index: number) => {
  indexPointer.value = index

  if (formStore.draggedFieldIndex !== null && formStore.draggedFieldIndex !== index) {
    const draggedField = formFields[formStore.draggedFieldIndex]
    formStore.formFields.splice(formStore.draggedFieldIndex, 1)
    formStore.formFields.splice(index, 0, draggedField!)
    formStore.setDraggedFieldIndex(index)
  }
}

const onDragEnd = (e: DragEvent) => {
  formStore.setDraggedFieldIndex(null)
}

const onClickAtFormElement = () => {

}
</script>
<style lang="scss">
.form-canvas {
  width: 1000px;
  min-height: 1000px;
}

.form-field {
  &:active {
    border: 1px solid green;

  }
}
</style>
