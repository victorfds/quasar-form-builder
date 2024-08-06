import type { FormKitSchemaDefinition, FormKitSchemaNode } from "@formkit/core"

export const useFormStore = defineStore('formStore', () => {

  const formFields = ref<FormKitSchemaDefinition[]>([])

  const { notify } = useQuasar()

  const addField = (field: FormKitSchemaNode, pos?: number | null) => {
    pos = Number(pos)
    const nameExists = (name: string) => formFields.value.some(el => el?.name === name)
    const formLength = formFields.value.length

    const generateUniqueName = (name: string): string => {
      return [...Array(formLength + 1).keys()]
        .map(counter => (counter === 0 ? name : `${name}_${counter}`))
        .find(uniqueName => !nameExists(uniqueName)) || name
    }

    field.name = generateUniqueName(field?.name)

    if (pos <= 0) {
      formFields.value.unshift(field)
    }
    else if (pos >= formLength) {
      formFields.value.push(field)
    } else {
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


  return {
    formFields,
    addField,
    updateFieldIndex,
    removeField
  }
})
