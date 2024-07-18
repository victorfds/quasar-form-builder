import type { FormKitSchemaDefinition, FormKitSchemaNode } from "@formkit/core"

export const useFormStore = defineStore('formStore', () => {
  const tools = ref<FormKitSchemaDefinition>([
    {
      $formkit: 'q-input',
      name: 'input',
      label: 'Entrada de texto',
      help: 'Enter your first name',
      validation: 'required',
    },
    {
      $formkit: 'q-select',
      name: 'select',
      label: 'Selecione as opções',
      help: 'opções',
      options: [{ label: 'Opção 1', value: 'option1' }],
      validation: 'required',
    }
  ])

  const formFields = ref<FormKitSchemaDefinition[]>([])
  const draggedTool = ref<null | FormKitSchemaDefinition>(null)

  const { notify } = useQuasar()

  const setDraggedTool = (tool: FormKitSchemaDefinition | null) => {
    draggedTool.value = tool;
  }

  const addField = (field: FormKitSchemaNode, pos: number) => {
    const nameExists = (name: string) => formFields.value.some(el => el.name === name)
    const formLength = formFields.value.length

    const generateUniqueName = (name: string): string => {
      return [...Array(formLength + 1).keys()]
        .map(counter => (counter === 0 ? name : `${name}_${counter}`))
        .find(uniqueName => !nameExists(uniqueName)) || name
    }

    field.name = generateUniqueName(field?.name)

    if (pos >= formLength || pos >= formLength - 1) {
      formFields.value.push(field)
    } else if (pos <= 0) {
      formFields.value.unshift(field)
    } else {
      formFields.value.splice(pos, 0, field)
    }

    notify({ message: `${field?.name} added` })
  }

  const updateFieldIndex = ({ draggedField, originalPosition, destinationIndex }: { draggedField: FormKitSchemaDefinition, originalPosition: number, destinationIndex: number }) => {
    formFields.value.splice(originalPosition, 1)
    formFields.value.splice(destinationIndex, 0, draggedField!)
  }


  return {
    tools,
    formFields,
    draggedTool,
    setDraggedTool,
    addField,
    updateFieldIndex
  }
})
