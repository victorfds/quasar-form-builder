<template>
  <form class="form-canvas" @dragover.prevent="handleDragover" @drop.prevent="onDrop">
    <div v-for="(field, index) in formFields" :key="index" class="form-field" @dragstart="onDragStartField(index)"
      @dragenter="onDragEnter(index)" @dragend="onDragEnd" draggable="true">
      <Element :elem="field" />
    </div>
  </form>
</template>
<script setup lang="ts">
import type { ElementType } from '~/types';

const formStore = useFormStore()
const formFields = formStore.formFields

const onDrop = (ev: DragEvent) => {
  const toolData = ev.dataTransfer?.getData("text")
  if (toolData) {
    try {
      const tool: ElementType = JSON.parse(toolData)
      formStore.addField(tool)
    } catch {
      // silent error
    }
  }
}

const onDragStartField = (index: number) => {
  formStore.setDraggedFieldIndex(index)
}

const handleDragover = (e: DragEvent) => {
  // console.log(e.x, e.y)
}

const onDragEnter = (index: number) => {
  if (formStore.draggedFieldIndex !== null && formStore.draggedFieldIndex !== index) {
    const draggedField = formFields[formStore.draggedFieldIndex]
    formFields.splice(formStore.draggedFieldIndex, 1)
    formFields.splice(index, 0, draggedField!)
    formStore.setDraggedFieldIndex(index)
  }
}

const onDragEnd = () => {
  formStore.setDraggedFieldIndex(null)
}

const schema = reactive({
  text: {
    type: 'text',
    label: 'Text',
  },
  number: {
    type: 'text',
    inputType: 'number',
    rules: ['nullable', 'numeric'],
    autocomplete: 'off',
    label: 'Number',
  },
  email: {
    type: 'text',
    inputType: 'email',
    rules: ['nullable', 'email'],
    label: 'Email',
  },
  phone: {
    type: 'phone',
    label: 'Phone',
    allowIncomplete: true,
    unmask: true,
  },
  password: {
    type: 'text',
    inputType: 'password',
    label: 'Password',
  },
  url: {
    type: 'text',
    inputType: 'url',
    rules: ['nullable', 'url'],
    placeholder: 'eg. http(s)://domain.com',
    floating: false,
    label: 'URL',
  },
  location: {
    type: 'location',
    label: 'Location',
  },
  textarea: {
    type: 'textarea',
    label: 'Textarea',
  },
  editor: {
    type: 'editor',
    label: 'Editor',
  },
  checkbox: {
    type: 'checkbox',
    text: 'Checkbox',
  },
  checkboxgroup: {
    type: 'checkboxgroup',
    items: [
      {
        value: 0,
        label: 'Label',
      },
    ],
    label: 'Checkbox group',
  },
  checkboxBlocks: {
    type: 'checkboxgroup',
    view: 'blocks',
    items: [
      {
        value: 0,
        label: 'Label',
        description: 'Description',
      },
      {
        value: 1,
        label: 'Label 2',
        description: 'Description 2',
      },
    ],
    label: 'Checkbox blocks',
  },
  checkboxTabs: {
    type: 'checkboxgroup',
    view: 'tabs',
    items: [
      {
        value: 0,
        label: 'Label',
        description: 'Description',
      },
      {
        value: 1,
        label: 'Label 2',
        description: 'Description 2',
      },
    ],
    label: 'Checkbox tabs',
  },
  radio: {
    type: 'radio',
    text: 'Radio',
  },
  radiogroup: {
    type: 'radiogroup',
    items: [
      {
        value: 'Value',
        label: 'Label',
      },
    ],
    label: 'Radio group',
  },
  radioBlocks: {
    type: 'radiogroup',
    view: 'blocks',
    items: [
      {
        value: 0,
        label: 'Label',
        description: 'Description',
      },
      {
        value: 1,
        label: 'Label 2',
        description: 'Description 2',
      },
    ],
    label: 'Radio blocks',
  },
  radioTabs: {
    type: 'radiogroup',
    view: 'tabs',
    items: [
      {
        value: 0,
        label: 'Label',
        description: 'Description',
      },
      {
        value: 1,
        label: 'Label 2',
        description: 'Description 2',
      },
    ],
    label: 'Radio tabs',
  },
  toggle: {
    type: 'toggle',
    text: 'Toggle',
  },
  select: {
    type: 'select',
    items: [
      {
        value: 0,
        label: 'Label',
      },
    ],
    search: true,
    native: false,
    label: 'Select',
    inputType: 'search',
    autocomplete: 'off',
  },
  multiselect: {
    type: 'multiselect',
    closeOnSelect: false,
    items: [
      {
        value: 0,
        label: 'Label',
      },
    ],
    search: true,
    native: false,
    label: 'Multiselect',
    inputType: 'search',
    autocomplete: 'off',
  },
  tags: {
    type: 'tags',
    closeOnSelect: false,
    search: true,
    items: [
      {
        value: 0,
        label: 'Label',
      },
    ],
    label: 'Tags',
    inputType: 'search',
    autocomplete: 'off',
  },
  date: {
    type: 'date',
    label: 'Date',
  },
  datetime: {
    type: 'date',
    label: 'Datetime',
    time: true,
  },
  time: {
    type: 'date',
    label: 'Time',
    time: true,
    date: false,
  },
  dates: {
    type: 'dates',
    label: 'Dates',
  },
  dateRange: {
    type: 'dates',
    label: 'Date range',
    mode: 'range',
  },
  slider: {
    type: 'slider',
    label: 'Slider',
    default: 30,
  },
  rangeSlider: {
    type: 'slider',
    default: [30, 70],
    label: 'Range slider',
  },
  verticalSlider: {
    type: 'slider',
    orientation: 'vertical',
    label: 'Vertical slider',
  },
  file: {
    type: 'file',
    label: 'File',
  },
  multifile: {
    type: 'multifile',
    label: 'Multi-file',
  },
  image: {
    type: 'file',
    label: 'Image',
    accept: 'image/*',
    view: 'image',
    rules: ['mimetypes:image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/tiff'],
  },
  multiImage: {
    type: 'multifile',
    label: 'Multi-image',
    view: 'image',
    accept: 'image/*',
    file: {
      rules: ['mimetypes:image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/tiff'],
    },
  },
  gallery: {
    type: 'multifile',
    label: 'Gallery',
    view: 'gallery',
    accept: 'image/*',
    file: {
      rules: ['mimetypes:image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/tiff'],
    },
  },
  hidden: {
    type: 'hidden',
    default: 'close that door',
  },
});

function addNewBtn() {


}
</script>
<style lang="scss">
.form-canvas {
  width: 1000px;
  height: 1000px;
}

.form-field {
  background-color: #7fa678;
}
</style>
