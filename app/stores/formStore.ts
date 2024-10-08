import type { FormKitSchemaDefinition, FormKitSchemaNode } from '@formkit/core'

type FormSettingsType = {
  formName?: string,
  preview: { width?: string | number | null, isFullWidth: boolean },
  previewMode: 'editing' | 'previewing',
}

export const useFormStore = defineStore('formStore', () => {
  const formSettings = ref<FormSettingsType>({ formName: 'Meu Formulário', preview: { width: 432, isFullWidth: false }, previewMode: 'editing' })
  const formFields = ref<FormKitSchemaDefinition[]>([])
  const activeField = ref<FormKitSchemaNode | null>(null)
  const values = ref({})

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

  const removeField = (field: FormKitSchemaNode, index?: number) => {
    if (!index) {
      index = formFields.value.findIndex(ff => ff.name === field?.name)
    }

    if (index < 0) return

    formFields.value.splice(index, 1)

    if (field?.name === activeField.value?.name) {
      setActiveField(null)
    }
  }

  const copyField = (field: FormKitSchemaNode, index?: number) => {
    if (!index) {
      index = formFields.value.findIndex(ff => ff.name === field?.name)
    }
    const newElemPosition = index + 1
    const newField = { ...field, name: field?.name.split('_').at(0) }
    addField(newField, newElemPosition)
    setActiveField(newField)
  }

  const setActiveField = (newField: FormKitSchemaNode | null) => {
    activeField.value = newField
  }

  const updateNameField = (oldName?: string, newName?: string) => {
    if (!oldName || !newName) return

    const indexToUpdate = formFields.value.findIndex(field => field.name === oldName)
    if (indexToUpdate === -1)
      return

    if (!newName)
      return new Error('name cannot be empty', { cause: 500 })

    if (nameExists(newName, formFields.value))
      return new Error('name already exists', { cause: 500 })

    formFields.value[indexToUpdate].name = newName

    // TODO: cache form state values from this point
  }

  const changePreviewWidth = (newWidth: string | number | null) => {
    formSettings.value.preview.width = newWidth

    // TODO: cache form preview width
  }

  const togglePreviewFullWidth = (isFull: boolean) => {
    formSettings.value.preview.isFullWidth = isFull

    // TODO: cache form preview is full width
  }

  return {
    values,
    formSettings,
    formFields,
    activeField,
    addField,
    updateFieldIndex,
    removeField,
    copyField,
    setActiveField,
    updateNameField,
    changePreviewWidth,
    togglePreviewFullWidth,
  }
})
