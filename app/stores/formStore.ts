import type { FormKitSchemaDefinition, FormKitSchemaNode } from '@formkit/core'
import type { ActiveFieldType, ColumnsType, FormSettingsType, FormViewportType } from '~/types'

export const useFormStore = defineStore('formStore', () => {
  const { notify, localStorage } = useQuasar()
  const formHistoryStore = useFormHistoryStore()

  const cachedFormFields: string | null = localStorage.getItem('form-fields')

  const formSettings = ref<FormSettingsType>({
    formName: 'Meu Formulário',
    preview: { width: 432, isFullWidth: false },
    previewMode: 'editing',
    columns: 'default'
  })

  const formFields = ref<FormKitSchemaDefinition[]>(cachedFormFields ? JSON.parse(cachedFormFields) : [])
  const activeField = ref<ActiveFieldType>(null)
  const activeStepName = ref('')
  const activeStepConfigName = ref<string | null>(null)
  const stepLabelFocusToken = ref(0)
  const values = reactive({})
  const stepperType = 'q-stepper'

  type StepDefinition = {
    name: string
    label?: string
    showPrevious?: boolean
    prevLabel?: string
    nextLabel?: string
    if?: string
    children?: FormKitSchemaDefinition[]
  }

  type StepperField = FormKitSchemaDefinition & {
    steps?: StepDefinition[]
  }

  const getStepper = () => formFields.value.find(field => field.$formkit === stepperType) as StepperField | undefined
  const hasStepper = computed(() => Boolean(getStepper()))

  const getSteps = () => getStepper()?.steps || []
  const getStepByName = (stepName: string) => getSteps().find(step => step.name === stepName)

  const getActiveStep = () => {
    const steps = getSteps()
    if (!steps.length) return null
    return steps.find(step => step.name === activeStepName.value) || steps[0]
  }

  const ensureActiveStep = () => {
    const activeStep = getActiveStep()
    if (activeStep) activeStepName.value = activeStep.name
  }

  const ensureActiveStepConfig = () => {
    if (!hasStepper.value) {
      activeStepConfigName.value = null
      return
    }
    const steps = getSteps()
    if (!steps.length) {
      activeStepConfigName.value = null
      return
    }
    if (!activeStepConfigName.value || !steps.some(step => step.name === activeStepConfigName.value)) {
      activeStepConfigName.value = activeStepName.value || steps[0].name
    }
  }

  const activeStepConfig = computed(() => {
    if (!activeStepConfigName.value) return null
    return getStepByName(activeStepConfigName.value) || null
  })

  const activeFields = computed<FormKitSchemaDefinition[]>(() => {
    if (!hasStepper.value) return formFields.value
    const step = getActiveStep()
    if (!step) return []
    if (!Array.isArray(step.children)) step.children = []
    return step.children
  })

  const allFields = computed<FormKitSchemaDefinition[]>(() => {
    if (!hasStepper.value) return formFields.value
    return getSteps().flatMap(step => Array.isArray(step.children) ? step.children : [])
  })

  const getFieldLocationByName = (fieldName: string) => {
    const rootIndex = formFields.value.findIndex(field => field.name === fieldName)
    if (rootIndex !== -1) return { scope: 'root' as const, index: rootIndex }

    const steps = getSteps()
    for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
      const children = steps[stepIndex]?.children || []
      const fieldIndex = children.findIndex(child => child.name === fieldName)
      if (fieldIndex !== -1) return { scope: 'step' as const, stepIndex, fieldIndex }
    }

    return null
  }

  const updateFieldByName = (fieldName: string, updater: (field: FormKitSchemaDefinition) => FormKitSchemaDefinition) => {
    const location = getFieldLocationByName(fieldName)
    if (!location) return

    if (location.scope === 'root') {
      formFields.value[location.index] = updater(formFields.value[location.index]!)
      return
    }

    const stepper = getStepper()
    if (!stepper?.steps?.[location.stepIndex]) return
    const children = stepper.steps[location.stepIndex].children || []
    children[location.fieldIndex] = updater(children[location.fieldIndex]!)
    stepper.steps[location.stepIndex].children = children
  }

  const generateStepName = () => {
    const steps = getSteps()
    let counter = steps.length + 1
    let candidate = `step_${counter}`
    while (steps.some(step => step.name === candidate)) {
      counter += 1
      candidate = `step_${counter}`
    }
    return candidate
  }

  const buildStepper = (fields: FormKitSchemaDefinition[]) => {
    const stepName = generateStepName()
    return {
      $formkit: stepperType,
      name: generateUniqueName('stepper', formFields.value),
      steps: [
        {
          name: stepName,
          label: 'Passo 1',
          showPrevious: true,
          prevLabel: '',
          nextLabel: '',
          children: fields,
        },
      ],
    } as StepperField
  }

  const getSchema = computed(() => {
    // @ts-expect-error the following lines is envolved in differents types, but certainly they should not fail
    return formFields.value.reduce((acc, { name, ...rest }) => {
      // @ts-expect-error this is fine since we know our node schema always have object style definition
      acc[name] = rest
      return acc
    }, {})
  })

  if (hasStepper.value) {
    ensureActiveStep()
    ensureActiveStepConfig()
  }

  const getFields = computed(() => {
    return formFields.value.map(formField => {
      if (formSettings.value.previewMode === 'editing' && formField && Object.keys(formField).some(objKey => objKey.includes('if'))) {
        // @ts-expect-error clone is an object
        const { if: [], ...rest } = formField
        return { ...rest, hasCondition: true }
      }

      return formField
    })
  })

  const getActiveFieldColumns = computed(() => {
    if (!activeField.value?.columns?.default && !activeField.value?.columns?.sm && !activeField.value?.columns?.lg) {
      return activeField.value?.columns?.container || 12
    }

    return activeField.value?.columns?.[formSettings.value.columns]?.container || 12
  })

  const cacheFormFields = () => {
    formHistoryStore.addToMemory(formFields.value)
    localStorage.setItem('form-fields', JSON.stringify(formFields.value))
  }

  const setFormFields = (newFields: FormKitSchemaDefinition[]) => {
    formFields.value = newFields
    if (hasStepper.value) {
      ensureActiveStep()
      ensureActiveStepConfig()
    }
    else {
      activeStepConfigName.value = null
    }
    localStorage.setItem('form-fields', JSON.stringify(newFields))
  }

  const getFieldByName = (fieldName: string) => {
    return allFields.value.find(formField => formField.name === fieldName)
  }

  const addField = (field: FormKitSchemaNode, pos?: number | null) => {
    if (field?.$formkit === stepperType) {
      if (hasStepper.value) {
        notify({ color: 'dark', message: 'Passos já está ativo no formulário' })
        return
      }

      const stepper = buildStepper(formFields.value)
      formFields.value = [stepper]
      activeStepName.value = stepper.steps?.[0]?.name || ''
      activeStepConfigName.value = stepper.steps?.[0]?.name || null
      cacheFormFields()
      return
    }

    pos = Number(pos)
    const fieldsList = activeFields.value
    const formLength = fieldsList.length

    field.name = generateUniqueName(field?.name, allFields.value)

    if (pos <= 0) {
      fieldsList.unshift(field)
    } else if (pos >= formLength) {
      fieldsList.push(field)
    } else {
      fieldsList.splice(pos, 0, field)
    }

    notify({ color: 'dark', message: `${field?.name} adicionado` })
    cacheFormFields()
  }

  const updateFieldIndex = ({ draggedField, originalPosition, destinationIndex }: {
    draggedField: FormKitSchemaDefinition,
    originalPosition: number,
    destinationIndex: number
  }) => {
    const fieldsList = activeFields.value
    fieldsList.splice(originalPosition, 1)
    fieldsList.splice(destinationIndex, 0, draggedField!)

    cacheFormFields()
  }

  const removeField = (field: FormKitSchemaNode | null, index?: number) => {
    if (!field) return

    const fieldsList = activeFields.value

    if (index === undefined || index === null) {
      index = fieldsList.findIndex(ff => ff.name === field?.name)
    }

    if (index < 0) {
      const location = getFieldLocationByName(field?.name || '')
      if (!location || location.scope !== 'step') return
      const stepper = getStepper()
      if (!stepper?.steps?.[location.stepIndex]?.children) return
      stepper.steps[location.stepIndex].children?.splice(location.fieldIndex, 1)
      if (field?.name === activeField.value?.name) {
        setActiveField(null)
      }
      cacheFormFields()
      return
    }

    removeAllConditionsUses(field)

    fieldsList.splice(index, 1)

    if (field?.name === activeField.value?.name) {
      setActiveField(null)
    }

    cacheFormFields()
  }

  const copyField = (index: number | null, fieldElement?: FormKitSchemaNode) => {
    const fieldsList = activeFields.value
    const field = fieldElement || fieldsList.find((_, i) => i === index)
    if (!field) return
    if (!index && index !== 0) {
      index = fieldsList.findIndex(formField => formField.name === field.name)
    }
    const newElemPosition = index + 1
    const newField = { ...field, name: field?.name.split('_').at(0) }
    addField(newField, newElemPosition)
    setActiveField(newField)
  }

  const setActiveField = (newField: ActiveFieldType) => {
    activeField.value = newField
  }

  const updateNameField = (oldName?: string, newName?: string) => {
    if (!oldName) return

    if (!newName) return new Error('name cannot be empty', { cause: 500 })

    if (/\s/.test(newName)) return new Error('name cannot contain spaces', { cause: 500 })

    if (nameExists(newName, allFields.value)) return new Error('name already exists', { cause: 500 })

    updateFieldByName(oldName, field => ({ ...field, name: newName }))

    cacheFormFields()
  }

  const insertValidationRule = (
    validation: boolean | string | { if: string, then: string, else: string },
    newRule: string | boolean
  ): string => {
    const rules = typeof validation === 'string' ? validation.split("|") : typeof validation !== 'string' && typeof validation !== 'boolean' ? validation.then.split("|") : []
    const ruleName = typeof newRule === 'string' ? newRule.split(":")[0] : newRule

    const updatedRules = rules.map((rule) =>
      rule.startsWith(ruleName + ":") ? newRule : rule
    )

    if (!updatedRules.includes(newRule)) {
      updatedRules.push(newRule)
    }

    return updatedRules.filter(updateRule => updateRule).join("|")
  }

  const removeValidationRule = (
    validation: string | { if: string, then: string, else: string },
    ruleToRemove: string
  ): string => {
    const rules = validation && typeof validation === 'string' ? validation.split("|") : validation && typeof validation !== 'string' ? validation.then.split("|") : []

    const updatedRules = rules.filter((rule) => !rule.includes(ruleToRemove))
    return updatedRules.join("|")
  }

  const updatePropFromActiveField = async (fieldElement: FormKitSchemaNode | null, propName?: string, newPropValue?: any) => {
    if (!propName || !fieldElement) return

    if (!activeField.value) return

    const updatedPropValue = (propName === 'validation' && newPropValue) || (propName === 'disable' && Object.keys(newPropValue).length)
      ? handleValidationUpdate(fieldElement, propName, newPropValue)
      : propName === 'attrs' && newPropValue
        ? {
          ...fieldElement[propName],
          ...Object.fromEntries([newPropValue.split(':').map((part) => part.trim())]),
        }
        : newPropValue

    updateFieldProperties(propName, updatedPropValue, fieldElement.name)

    await nextTick()

    if (shouldDeleteProperty(updatedPropValue)) {
      deleteFieldProperty(propName, fieldElement.name)
    }
    cacheFormFields()
  }

  const handleValidationUpdate = (fieldElement: FormKitSchemaNode, propName: string, newPropValue: any) => {

    if (!fieldElement[propName]?.if && newPropValue.if) {
      // If the current validation doesn't have 'if' and the new property has 'if'
      return {
        ...newPropValue,
        then: fieldElement[propName],
        else: convertToBoolean(toggleToFalse(removeRequiredRule(newPropValue?.else || fieldElement[propName]))),
      }
    }
    // Otherwise, update the validation element
    return updateValidationElement(fieldElement, propName, newPropValue)
  }

  // Function to update the validation element of a form element
  const updateValidationElement = (fieldElement: FormKitSchemaNode, propName: string, newPropValue: any) => {
    if (newPropValue?.if === '') {
      // If the new property has an empty 'if', return the 'then' part of the validation
      return fieldElement[propName]?.then
    }

    if (newPropValue?.if) {
      // If the new property has 'if', merge it with the current validation
      return { ...fieldElement[propName], ...newPropValue }
    }

    // Get the appropriate validation element based on the new property and current validation
    const validationElement = getValidationElement(
      fieldElement,
      propName,
      newPropValue
    )


    if (newPropValue?.if) {
      // If the new property has 'if', return a new validation object with 'then' and 'else'
      return {
        ...newPropValue,
        then: validationElement,
        else: convertToBoolean(toggleToFalse(removeRequiredRule(validationElement))),
      }
    }

    if (fieldElement[propName]?.if) {
      // If the current validation has 'if', return a new validation object with 'then' and 'else'
      return {
        ...fieldElement[propName],
        then: validationElement,
        else: convertToBoolean(toggleToFalse(removeRequiredRule(validationElement))),
      }
    }

    // Otherwise, return the validation element as is
    return validationElement
  }

  const getValidationElement = (fieldElement: FormKitSchemaNode, propName: string, newPropValue: any): string => {
    return newPropValue && newPropValue?.startsWith?.('-')
      ? removeValidationRule(fieldElement[propName], newPropValue.substring(1))
      : insertValidationRule(fieldElement[propName] || '', newPropValue)
  }

  const removeRequiredRule = (validation: string) => String(validation)?.match?.('required')?.length ? validation?.replace?.(/(^required\||\|required$|^required$|\|required\|)/, "") : String(validation)

  const toggleToFalse = (validation: any) => {
    if (typeof validation === 'string') return validation?.replace?.("true", "false")

    return validation
  }

  const convertToBoolean = (validation: string) => {
    if (validation?.match?.('true')?.length) return true
    if (validation?.match?.('false')?.length) return false

    return validation
  }

  const updateFieldProperties = (propName: string, newPropValue: any, fieldName: string) => {
    if (activeField.value) {
      activeField.value = { ...activeField.value, [propName]: newPropValue }
    }
    updateFieldByName(fieldName, field => ({ ...field, [propName]: newPropValue }))
  }

  const deleteFieldProperty = (propName: string, fieldName: string) => {
    if (activeField.value?.name === fieldName) {
      const { [propName]: _, ...restActiveField } = activeField.value
      activeField.value = restActiveField as ActiveFieldType
    }

    updateFieldByName(fieldName, (field) => {
      const { [propName]: __, ...restField } = field
      return restField
    })
  }

  const deleteFieldPropertyByName = (prop: string, fieldName: string) => {
    const field = getFieldByName(fieldName)

    if (!field) return

    if (activeField.value?.name === fieldName) {
      const { [prop]: activeProp, ...restActive } = activeField.value
      activeField.value = activeProp?.else
        ? ({ [prop]: activeProp.else, ...restActive } as ActiveFieldType)
        : restActive
    }

    const { [prop]: fieldProp, ...restField } = field
    const updatedField = fieldProp?.else
      ? { [prop]: fieldProp.else, ...restField }
      : restField

    updateFieldByName(fieldName, () => updatedField)
  }

  const removeAllConditionsUses = (field: FormKitSchemaNode) => {
    const ifConditionNames = allFields.value
      .filter(formField => formField.if && formField.if.includes(field.name))
      .map(fieldForm => fieldForm.name)
    const validationConditionNames = allFields.value
      .filter(formField => formField.validation && formField.validation.if && formField.validation.if.includes(field.name))
      .map(fieldForm => fieldForm.name)

    ifConditionNames.forEach(name => deleteFieldPropertyByName('if', name))
    validationConditionNames.forEach(name => deleteFieldPropertyByName('validation', name))
  }

  const shouldDeleteProperty = (newPropValue: any) => newPropValue === false || newPropValue === '' || isEmptyObject(newPropValue)

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

  const setActiveStep = (stepName: string) => {
    activeStepName.value = stepName
  }

  const setActiveStepConfig = (stepName: string | null) => {
    activeStepConfigName.value = stepName
  }

  const requestStepLabelFocus = () => {
    stepLabelFocusToken.value += 1
  }

  const updateStep = (stepName: string, updater: (step: StepDefinition) => StepDefinition) => {
    const stepper = getStepper()
    if (!stepper?.steps) return
    const index = stepper.steps.findIndex(step => step.name === stepName)
    if (index === -1) return
    stepper.steps[index] = updater(stepper.steps[index]!)
    cacheFormFields()
  }

  const updateStepProp = (stepName: string, prop: keyof StepDefinition, value: any) => {
    updateStep(stepName, step => ({ ...step, [prop]: value }))
  }

  const updateStepLabel = (stepName: string, label: string) => {
    updateStepProp(stepName, 'label', label)
  }

  const updateStepLayout = (stepName: string, updates: Partial<Pick<StepDefinition, 'showPrevious' | 'prevLabel' | 'nextLabel'>>) => {
    updateStep(stepName, step => ({ ...step, ...updates }))
  }

  const addStep = () => {
    const stepper = getStepper()
    if (!stepper) return

    stepper.steps = stepper.steps || []
    const stepName = generateStepName()
    const newStep: StepDefinition = {
      name: stepName,
      label: `Passo ${stepper.steps.length + 1}`,
      showPrevious: true,
      prevLabel: '',
      nextLabel: '',
      children: [],
    }

    stepper.steps.push(newStep)
    activeStepName.value = stepName
    activeStepConfigName.value = stepName
    cacheFormFields()
  }

  const duplicateStep = (stepName: string) => {
    const stepper = getStepper()
    if (!stepper?.steps) return
    const index = stepper.steps.findIndex(step => step.name === stepName)
    if (index === -1) return

    const source = stepper.steps[index]
    const clone: StepDefinition = JSON.parse(JSON.stringify(source))
    const usedFields = [...allFields.value]
    clone.name = generateStepName()
    clone.children = (clone.children || []).map((child) => {
      const baseName = child.name?.split('_').at(0) || child.name || 'field'
      const newName = generateUniqueName(baseName, usedFields)
      usedFields.push({ ...child, name: newName })
      return { ...child, name: newName }
    })

    stepper.steps.splice(index + 1, 0, clone)
    activeStepName.value = clone.name
    activeStepConfigName.value = clone.name
    cacheFormFields()
  }

  const removeStep = (stepName: string) => {
    const stepper = getStepper()
    if (!stepper?.steps || stepper.steps.length <= 1) return

    const index = stepper.steps.findIndex(step => step.name === stepName)
    if (index === -1) return

    stepper.steps.splice(index, 1)

    if (activeStepName.value === stepName) {
      const nextStep = stepper.steps[index - 1] || stepper.steps[0]
      activeStepName.value = nextStep?.name || ''
    }
    if (activeStepConfigName.value === stepName) {
      const nextStep = stepper.steps[index - 1] || stepper.steps[0]
      activeStepConfigName.value = nextStep?.name || null
    }

    cacheFormFields()
  }

  const removeStepper = () => {
    const stepper = getStepper()
    if (!stepper?.steps) return
    const mergedFields = stepper.steps.flatMap(step => Array.isArray(step.children) ? step.children : [])
    formFields.value = mergedFields
    activeStepName.value = ''
    activeStepConfigName.value = null
    setActiveField(null)
    cacheFormFields()
  }

  const renameStep = (stepName: string, label: string) => {
    const stepper = getStepper()
    if (!stepper?.steps) return
    const step = stepper.steps.find(item => item.name === stepName)
    if (!step) return
    const trimmed = label.trim()
    if (!trimmed) return
    step.label = trimmed
    cacheFormFields()
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
    if (!activeField.value?.name) return
    updateFieldByName(activeField.value.name, () => ({ ...activeField.value }))
    cacheFormFields()
  }

  const onEnteredProp = (propName: string, propValue?: string | number | boolean | null | ColumnsType | { if: string }
  ) => {
    if (!propName) return

    updatePropFromActiveField(activeField.value, propName, propValue)
  }
  return {
    values,
    formSettings,
    formFields,
    activeFields,
    allFields,
    activeStepName,
    activeStepConfigName,
    activeStepConfig,
    stepLabelFocusToken,
    hasStepper,
    activeField,
    getSchema,
    getFields,
    getActiveFieldColumns,
    setFormFields,
    getFieldByName,
    addField,
    updateFieldIndex,
    removeField,
    copyField,
    setActiveField,
    setActiveStep,
    setActiveStepConfig,
    requestStepLabelFocus,
    addStep,
    duplicateStep,
    removeStep,
    removeStepper,
    renameStep,
    updateStepProp,
    updateStepLabel,
    updateStepLayout,
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
