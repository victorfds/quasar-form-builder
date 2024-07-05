import type { ElementType } from "~/types"

export const useFormStore = defineStore('formStore', () => {
  const tools = ref([
    {
      name: 'text',
      type: 'text',
      label: 'Text',
    },
    {
      name: 'number',
      type: 'text',
      inputType: 'number',
      rules: ['nullable', 'numeric'],
      autocomplete: 'off',
      label: 'Number',
    },
    {
      name: 'email',
      type: 'text',
      inputType: 'email',
      rules: ['nullable', 'email'],
      label: 'Email',
    },
    {
      name: 'phone',
      type: 'phone',
      label: 'Phone',
      allowIncomplete: true,
      unmask: true,
    },
    {
      name: 'password',
      type: 'text',
      inputType: 'password',
      label: 'Password',
    },
    {
      name: 'url',
      type: 'text',
      inputType: 'url',
      rules: ['nullable', 'url'],
      placeholder: 'eg. http(s)://domain.com',
      floating: false,
      label: 'URL',
    },

  ])

  const formFields = ref<ElementType[]>([])
  const draggedTool = ref<null | ElementType>(null)
  const draggedFieldIndex = ref<null | number>(null)

  const setDraggedTool = (tool: ElementType | null) => {
    draggedTool.value = tool;
  }

  const addField = (field: ElementType) => {
    formFields.value.push(field)
  }

  const setDraggedFieldIndex = (index: number | null) => {
    draggedFieldIndex.value = index
  }

  return {
    tools,
    formFields,
    draggedTool,
    draggedFieldIndex,
    setDraggedTool,
    addField,
    setDraggedFieldIndex,
  }
})
