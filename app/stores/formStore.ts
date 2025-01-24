import type { FormKitSchemaDefinition, FormKitSchemaNode } from '@formkit/core'
import type { ActiveFieldType, ColumnsType, FormSettingsType, FormViewportType } from '~/types'

export const useFormStore = defineStore('formStore', () => {
  const formSettings = ref<FormSettingsType>({
    formName: 'Meu Formulário',
    preview: { width: 432, isFullWidth: false },
    previewMode: 'editing',
    columns: 'default'
  })
  const formFields = ref<FormKitSchemaDefinition[]>([])
  const activeField = ref<ActiveFieldType>(null)
  const values = reactive({})

  const { notify } = useQuasar()

  const getSchema = computed(() => {
    // @ts-expect-error the following lines is envolved in differents types, but certainly they should not fail
    return formFields.value.reduce((acc, { name, ...rest }) => {
      // @ts-expect-error this is fine since we know our node schema always have object style definition
      acc[name] = rest
      return acc
    }, {})
  })

  const getFields = computed(() => {
    const cloned: FormKitSchemaDefinition[] = JSON.parse(JSON.stringify(formFields.value))
    return cloned.map(clone => {
      if (formSettings.value.previewMode === 'editing' && Object.keys(clone).some(objKey => objKey.includes('if'))) {
        // @ts-expect-error clone is an object
        const { if: [], ...rest } = clone
        return { ...rest, hasCondition: true }
      }

      return clone
    })
  })

  const getActiveFieldColumns = computed(() => {
    if (!activeField.value?.columns?.default && !activeField.value?.columns?.sm && !activeField.value?.columns?.lg) {
      return activeField.value?.columns?.container || 12
    }

    return activeField.value?.columns?.[formSettings.value.columns]?.container || 12
  })

  const addField = (field: FormKitSchemaNode, pos?: number | null) => {
    pos = Number(pos)
    const formLength = formFields.value.length

    field.name = generateUniqueName(field?.name, formFields.value)

    if (pos <= 0) {
      formFields.value.unshift(field)
    } else if (pos >= formLength) {
      formFields.value.push(field)
    } else {
      formFields.value.splice(pos, 0, field)
    }

    notify({ color: 'dark', message: `${field?.name} added` })
  }

  const updateFieldIndex = ({ draggedField, originalPosition, destinationIndex }: {
    draggedField: FormKitSchemaDefinition,
    originalPosition: number,
    destinationIndex: number
  }) => {
    formFields.value.splice(originalPosition, 1)
    formFields.value.splice(destinationIndex, 0, draggedField!)
  }

  const removeField = (field: FormKitSchemaNode | null, index?: number) => {
    if (!field) return

    if (!index) {
      index = formFields.value.findIndex(ff => ff.name === field?.name)
    }

    if (index < 0) return

    formFields.value.splice(index, 1)

    if (field?.name === activeField.value?.name) {
      setActiveField(null)
    }
  }

  const copyField = (index: number) => {
    const field = formFields.value.find((_, i) => i === index)
    if (!field) return
    const newElemPosition = index + 1
    const newField = { ...field, name: field?.name.split('_').at(0) }
    addField(newField, newElemPosition)
    setActiveField(newField)
  }

  const setActiveField = (newField: ActiveFieldType) => {
    activeField.value = newField
  }

  const updateNameField = (oldName?: string, newName?: string) => {
    if (!oldName)
      return

    const indexToUpdate = formFields.value.findIndex(field => field.name === oldName)
    if (indexToUpdate === -1)
      return

    if (!newName)
      return new Error('name cannot be empty', { cause: 500 })

    if (nameExists(newName, formFields.value))
      return new Error('name already exists', { cause: 500 })

    formFields.value[indexToUpdate].name = newName

    // TODO: cache form state values from this point
    // INFO: suggestion: https://unstorage.unjs.io/guide/utils#snapshots
  }

  const insertValidationRule = (
    validation: string | { if: string, then: string, else: string },
    newRule: string
  ): string => {
    const rules = validation && typeof validation === 'string' ? validation.split("|") : typeof validation !== 'string' ? validation.then.split("|") : []
    const ruleName = newRule.split(":")[0]

    const updatedRules = rules.map((rule) =>
      rule.startsWith(ruleName + ":") ? newRule : rule
    )

    if (!updatedRules.includes(newRule)) {
      updatedRules.push(newRule)
    }

    return updatedRules.join("|")
  }

  const removeValidationRule = (
    validation: string | { if: string, then: string, else: string },
    ruleToRemove: string
  ): string => {
    const rules = validation && typeof validation === 'string' ? validation.split("|") : typeof validation !== 'string' ? validation.then.split("|") : []

    const updatedRules = rules.filter((rule) => !rule.includes(ruleToRemove))
    return updatedRules.join("|")
  }

  const updatePropFromActiveField = async (fieldElement: FormKitSchemaNode | null, propName?: string, newPropValue?: any) => {
    if (!propName || !fieldElement) return

    const indexToUpdate = formFields.value.findIndex(field => field.name === fieldElement.name)
    if (indexToUpdate === -1 || !activeField.value) return

    const updatedPropValue = (propName === 'validation' && newPropValue)
      ? handleValidationUpdate(fieldElement, newPropValue)
      : newPropValue

    updateFieldProperties(propName, updatedPropValue, indexToUpdate)

    await nextTick()

    if (shouldDeleteProperty(updatedPropValue)) {
      deleteFieldProperties(propName, indexToUpdate)
    }
    // TODO: cache form preview width
    // INFO: suggestion: https://unstorage.unjs.io/guide/utils#snapshots
  }

  const handleValidationUpdate = (fieldElement: FormKitSchemaNode, newPropValue: any) =>
    !fieldElement.validation?.if && newPropValue.if
      ? ({
        ...newPropValue,
        then: fieldElement.validation,
        else: removeRequiredRule(fieldElement.validation)
      })
      : updateValidationElement(fieldElement, newPropValue)

  const updateValidationElement = (fieldElement: FormKitSchemaNode, newPropValue: any) => {
    const validationElement = getValidationElement(fieldElement, newPropValue)
    return newPropValue.if
      ? { ...newPropValue, then: validationElement, else: removeRequiredRule(validationElement) }
      : validationElement
  }

  const getValidationElement = (fieldElement: FormKitSchemaNode, newPropValue: any) =>
    typeof newPropValue === 'string' && newPropValue.startsWith('-')
      ? removeValidationRule(fieldElement.validation, newPropValue.substring(1))
      : fieldElement.validation?.then || insertValidationRule(fieldElement.validation, newPropValue)

  const removeRequiredRule = (validation: any) =>
    validation?.replace(/(^required\||\|required$|^required$|\|required\|)/, "")

  const updateFieldProperties = (propName: string, newPropValue: any, indexToUpdate: number) => {
    activeField.value = { ...activeField.value, [propName]: newPropValue }
    formFields.value = formFields.value.map((field, index) =>
      index === indexToUpdate ? { ...field, [propName]: newPropValue } : field
    )
  }

  const deleteFieldProperties = (propName: string, indexToUpdate: number) => {
    const { [propName]: _, ...restActiveField } = activeField.value
    const { [propName]: __, ...restFormField } = formFields.value[indexToUpdate]
    activeField.value = restActiveField
    formFields.value = formFields.value.map((field, index) =>
      index === indexToUpdate ? restFormField : field
    )
  }

  const shouldDeleteProperty = (newPropValue: any) =>
    newPropValue === false || newPropValue === '' || isEmptyObject(newPropValue)
  const changePreviewWidth = (newWidth: string | number | null) => {
    formSettings.value.preview.width = newWidth

    // TODO: cache form preview width
    // INFO: suggestion: https://unstorage.unjs.io/guide/utils#snapshots
  }

  const togglePreviewFullWidth = (isFull: boolean) => {
    formSettings.value.preview.isFullWidth = isFull

    // TODO: cache form preview is full width
    // INFO: suggestion: https://unstorage.unjs.io/guide/utils#snapshots
  }

  const changeViewport = (viewportToChange: FormViewportType) => {
    formSettings.value.columns = viewportToChange
  }

  const updateActiveFieldColumns = (newColumns: number) => {
    if (activeField.value) {
      if (!activeField.value?.columns) {
        activeField.value.columns = { container: newColumns }
        return
      }

      if (!activeField.value.columns?.default && !activeField.value?.columns.sm && !activeField.value.columns?.lg && formSettings.value.columns === 'default') {
        activeField.value.columns.container = newColumns
        return
      }

      activeField.value.columns[formSettings.value.columns] = { container: newColumns }

      // If has container value save it inside default scope
      if (formSettings.value.columns !== 'default' && activeField.value.columns.container) {
        activeField.value.columns.default = { container: activeField.value.columns.container }
        delete activeField.value.columns.container
      }
    }
  }

  const updateActiveFieldOnFormFields = () => {
    const indexToUpdate = formFields.value.findIndex(field => field.name === activeField.value.name)
    formFields.value[indexToUpdate] = { ...activeField.value }
  }

  const onEnteredProp = (propName: string, propValue?: string | number | boolean | null | ColumnsType
  ) => {
    if (!propName) return

    updatePropFromActiveField(activeField.value, propName, propValue)
  }
  return {
    values,
    formSettings,
    formFields,
    activeField,
    getSchema,
    getFields,
    getActiveFieldColumns,
    addField,
    updateFieldIndex,
    removeField,
    copyField,
    setActiveField,
    updateNameField,
    updatePropFromActiveField,
    changePreviewWidth,
    togglePreviewFullWidth,
    changeViewport,
    updateActiveFieldColumns,
    updateActiveFieldOnFormFields,
    onEnteredProp
  }
})
