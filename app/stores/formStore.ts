import type { FormKitSchemaDefinition, FormKitSchemaNode } from '@formkit/core'

export const useFormStore = defineStore('formStore', () => {
  const formData = ref<{ formName?: string }>({})
  const formFields = ref<FormKitSchemaDefinition[]>([])
  const activeField = ref<FormKitSchemaNode | null>(null)

  const { notify } = useQuasar()

  const addField = (field: FormKitSchemaNode, pos?: number | null) => {
    pos = Number(pos)
    const formLength = formFields.value.length

    field.name = generateUniqueName(field?.name, formFields.value)

    if (pos <= 0) {
      formFields.value.unshift(field)
    }
    else if (pos >= formLength) {
      formFields.value.push(field)
    }
    else {
      formFields.value.splice(pos, 0, field)
    }

    notify({ color: 'dark', message: `${field?.name} added` })
  }

  const updateFieldIndex = ({ draggedField, originalPosition, destinationIndex }: { draggedField: FormKitSchemaDefinition, originalPosition: number, destinationIndex: number }) => {
    formFields.value.splice(originalPosition, 1)
    formFields.value.splice(destinationIndex, 0, draggedField!)
  }

  const removeField = ({ field, index }: { field?: FormKitSchemaNode, index: number }) => {
    formFields.value.splice(index, 1)
  }

  const copyField = (field: FormKitSchemaNode, index: number) => {
    const newElemPosition = index + 1
    const newField = { ...field, name: field?.name.split('_').at(0) }
    addField(newField, newElemPosition)
    setActiveField(newField)
  }

  const setActiveField = (newField: FormKitSchemaNode | null) => {
    activeField.value = newField
  }

  const updateNameField = (oldName: string, newName: string) => {
    const indexToUpdate = formFields.value.findIndex(field => field.name === oldName)
    if (indexToUpdate === -1)
      return

    if (!newName)
      return new Error('name cannot be empty', { cause: 500 })

    if (nameExists(newName, formFields.value))
      return new Error('name already exists', { cause: 500 })

    formFields.value[indexToUpdate].name = newName
  }

  return {
    formData,
    formFields,
    activeField,
    addField,
    updateFieldIndex,
    removeField,
    copyField,
    setActiveField,
    updateNameField,
  }
})
