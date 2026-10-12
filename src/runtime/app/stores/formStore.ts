import type { ComputedRef, Ref } from 'vue'
import type { ActiveFieldType, BuilderDragPlacement, BuilderFieldListKey, BuilderSelectionChangeDetail, ColumnsType, FormSettingsType, FormViewportType, StructureCell } from '#qfb/types'
import type { QfbSchemaField } from '../types'
import { defineStore } from 'pinia'
import { useQuasar } from 'quasar'
import { computed, nextTick, reactive, ref } from 'vue'
import { adoptQfbSchema, cloneQfbSchemaAsTemplate, createQfbId, duplicateQfbSchema, QfbSchemaError, renameQfbField, validateQfbConditions, validateQfbSchema, walkQfbSchema } from '#qfb/schema'
import { removeQfbConditionsReferencing, rewriteQfbConditions } from '#qfb/schema/expressions'
import { useFormHistoryStore } from '#qfb/stores/formHistoryStore'
import { isQfbConditionalRule } from '#qfb/types'
import { generateUniqueName, isEmptyObject, nameExists } from '#qfb/utils'
import { getBrowserJsonItem, setBrowserStorageItem } from '#qfb/utils/browserStorage'
import { dispatchBuilderEvent } from '#qfb/utils/builderEvents'
import { getFormBuilderStorageConfig } from '#qfb/utils/storageConfig'

export interface StepDefinition {
  fieldId?: string
  name: string
  label?: string
  showPrevious?: boolean
  prevLabel?: string
  nextLabel?: string
  if?: string
  children?: QfbSchemaField[]
}

export interface TabDefinition {
  fieldId?: string
  name: string
  label?: string
  if?: string
  children?: QfbSchemaField[]
}

export interface FieldLocation {
  listKey: BuilderFieldListKey
  list: QfbSchemaField[]
  index: number
  field: QfbSchemaField
}

export const useFormStore = defineStore('formStore', () => {
  const { notify } = useQuasar()
  const formHistoryStore = useFormHistoryStore()
  const { formFieldsKey: formFieldsStorageKey } = getFormBuilderStorageConfig()

  const formSettings: Ref<FormSettingsType> = ref({
    formName: 'Meu Formulário',
    preview: { width: 432, isFullWidth: false },
    previewMode: 'editing',
    columns: 'default',
  })

  const formFields: Ref<QfbSchemaField[]> = ref([])
  const schemaErrors = computed(() => [...validateQfbSchema(formFields.value), ...validateQfbConditions(formFields.value)])
  const activeField: Ref<ActiveFieldType> = ref(null)
  const activeStepName = ref('')
  const activeStepConfigName = ref<string | null>(null)
  const activeTabsFieldName = ref<string | null>(null)
  const activeTabConfigName = ref<string | null>(null)
  const values = reactive({})
  const stepperType = 'q-stepper'
  const tabsType = 'q-tabs'
  const rootOnlyStructureTypes = [stepperType, tabsType]
  const structureTypes = [
    'q-container',
    tabsType,
    'q-grid',
    'q-table-structure',
    'q-list-structure',
    stepperType,
  ]

  type StepperField = QfbSchemaField & {
    steps?: StepDefinition[]
  }

  type TabsField = QfbSchemaField & {
    tabs?: TabDefinition[]
  }

  interface TableOption {
    label: string
    value: string
  }

  type StructureRegionField = QfbSchemaField & {
    cells?: StructureCell[]
    rows?: TableOption[]
    columnsConfig?: TableOption[]
    rowsCount?: number
    columnsCount?: number
  }

  type FieldWithColumns = QfbSchemaField & {
    columns?: ColumnsType & Record<string, any>
  }

  const liveFalseInputProps = new Set(['fill-mask', 'reverse-fill-mask', 'unmasked-value'])

  function dispatchBuilderSelectionChange(detail: BuilderSelectionChangeDetail) {
    dispatchBuilderEvent('builder:selection-change', detail)
  }

  function isStructureField(field?: QfbSchemaField | null) {
    return Boolean(field?.$formkit && structureTypes.includes(String(field.$formkit)))
  }

  function normalizeColumnSpan(value: unknown): number {
    const span = Number(value)
    if (!Number.isFinite(span)) return 12
    return Math.max(1, Math.min(12, Math.round(span)))
  }

  function getFieldColumnSpan(field?: FieldWithColumns | null, viewport: FormViewportType = formSettings.value.columns) {
    if (!field?.columns) return 12
    const columns = field.columns
    const defaultSpan = columns.default?.container ?? columns.container ?? 12
    const smSpan = columns.sm?.container ?? defaultSpan
    const lgSpan = columns.lg?.container ?? smSpan

    if (viewport === 'lg') return normalizeColumnSpan(lgSpan)
    if (viewport === 'sm') return normalizeColumnSpan(smSpan)
    return normalizeColumnSpan(defaultSpan)
  }

  function setFieldColumnSpan(field: FieldWithColumns, newColumns: number, viewport: FormViewportType = formSettings.value.columns) {
    const nextColumns = normalizeColumnSpan(newColumns)
    const columns = field.columns || {}

    if (viewport === 'default') {
      if (!columns.default && !columns.sm && !columns.lg) {
        columns.container = nextColumns
      }
      else {
        columns.default = { container: nextColumns }
      }
      field.columns = columns
      return
    }

    if (columns.container) {
      columns.default = { container: normalizeColumnSpan(columns.container) }
      delete columns.container
    }
    else if (!columns.default) {
      columns.default = { container: getFieldColumnSpan(field, 'default') }
    }

    columns[viewport] = { container: nextColumns }
    field.columns = columns
  }

  function cloneFieldForInsert(field: QfbSchemaField) {
    return cloneQfbSchemaAsTemplate([field])[0] as QfbSchemaField
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
      activeStepConfigName.value = activeStepName.value || steps[0]!.name
    }
  }

  const activeStepConfig = computed(() => {
    if (!activeStepConfigName.value) return null
    return getStepByName(activeStepConfigName.value) || null
  })

  function isRootOnlyStructure(field?: QfbSchemaField | null) {
    return rootOnlyStructureTypes.includes(String(field?.$formkit || ''))
  }

  const getRootOnlyStructure = () => formFields.value.find(field => isRootOnlyStructure(field)) as StepperField | TabsField | undefined
  const hasRootOnlyStructure = computed(() => Boolean(getRootOnlyStructure()))

  function getRootOnlyStructureLabel(field?: QfbSchemaField | null) {
    return field?.$formkit === stepperType ? 'Passos' : 'Abas'
  }

  const getTabsFieldByName = (tabsFieldName: string) => {
    const field = getFieldByName(tabsFieldName) as TabsField | undefined
    return field?.$formkit === tabsType ? field : null
  }

  const getTabByName = (tabsFieldName: string, tabName: string) => {
    return getTabsFieldByName(tabsFieldName)?.tabs?.find(tab => tab.name === tabName) || null
  }

  const activeTabConfig = computed(() => {
    if (!activeTabsFieldName.value || !activeTabConfigName.value) return null
    return getTabByName(activeTabsFieldName.value, activeTabConfigName.value)
  })

  const ensureChildren = (field: QfbSchemaField) => {
    if (!Array.isArray(field.children)) field.children = []
    return field.children as QfbSchemaField[]
  }

  const ensureStepChildren = (step: StepDefinition) => {
    if (!Array.isArray(step.children)) step.children = []
    return step.children
  }

  const ensureTabChildren = (tab: TabDefinition) => {
    if (!Array.isArray(tab.children)) tab.children = []
    return tab.children
  }

  const ensureCellChildren = (cell: StructureCell) => {
    if (!Array.isArray(cell.children)) cell.children = []
    if (cell.children.length > 1) cell.children = cell.children.slice(0, 1)
    return cell.children
  }

  function isCellListKey(listKey?: BuilderFieldListKey | null) {
    return listKey?.startsWith('cell:') === true
  }

  function getCellListOwnerName(listKey?: BuilderFieldListKey | null) {
    if (!isCellListKey(listKey)) return null
    return listKey?.split(':')[1] || null
  }

  function replaceCellChildren(list: QfbSchemaField[], field: QfbSchemaField) {
    list.splice(0, list.length, field)
  }

  function makeCellName(row: string | number, column: string | number) {
    return `${row}__${column}`
  }

  function getGridRows(field: StructureRegionField) {
    const rowsCount = Math.max(1, Math.min(8, Number(field.rowsCount || 1)))
    return Array.from({ length: rowsCount }, (_, index) => ({
      label: `Linha ${index + 1}`,
      value: `row_${index + 1}`,
    }))
  }

  function getGridColumns(field: StructureRegionField) {
    const columnsCount = Math.max(1, Math.min(4, Number(field.columnsCount || 2)))
    return Array.from({ length: columnsCount }, (_, index) => ({
      label: `Coluna ${index + 1}`,
      value: `column_${index + 1}`,
    }))
  }

  function getTableRows(field: StructureRegionField) {
    return field.rows?.length ? field.rows : [{ label: 'Linha 1', value: 'row_1' }]
  }

  function getTableColumns(field: StructureRegionField) {
    return field.columnsConfig?.length ? field.columnsConfig : [{ label: 'Coluna 1', value: 'column_1' }]
  }

  function getStructureCellDefinitions(field: StructureRegionField) {
    if (field.$formkit === 'q-table-structure') {
      return getTableRows(field).flatMap(row =>
        getTableColumns(field).map(column => ({
          name: makeCellName(row.value, column.value),
          label: `${row.label} / ${column.label}`,
          row: row.value,
          column: column.value,
        })),
      )
    }

    if (field.$formkit === 'q-grid') {
      return getGridRows(field).flatMap(row =>
        getGridColumns(field).map(column => ({
          name: makeCellName(row.value, column.value),
          label: `${row.label} / ${column.label}`,
          row: row.value,
          column: column.value,
        })),
      )
    }

    return []
  }

  function ensureStructureCells(field: StructureRegionField) {
    if (!['q-grid', 'q-table-structure'].includes(String(field.$formkit))) return []

    if (!Array.isArray(field.cells)) field.cells = []

    const legacyChildren = Array.isArray(field.children) ? field.children : []
    const definitions = getStructureCellDefinitions(field)
    const visibleCellNames = new Set(definitions.map(definition => definition.name))
    const orphanedChildren = field.cells
      .filter(cell => !visibleCellNames.has(cell.name))
      .flatMap(cell => cell.children || [])

    field.cells = field.cells.filter(cell => visibleCellNames.has(cell.name))

    definitions.forEach((definition) => {
      let cell = field.cells!.find(item => item.name === definition.name)
      if (!cell) {
        cell = { ...definition, children: [] }
        field.cells!.push(cell)
      }
      else {
        cell.label = definition.label
        cell.row = definition.row
        cell.column = definition.column
        ensureCellChildren(cell)
      }
    })

    const firstCell = field.cells[0]
    if (firstCell && (legacyChildren.length || orphanedChildren.length)) {
      firstCell.children = [
        ...legacyChildren,
        ...orphanedChildren,
        ...(firstCell.children || []),
      ].slice(0, 1)
      field.children = []
    }

    return field.cells
  }

  function normalizeStructureFields(fields: QfbSchemaField[]) {
    fields.forEach((field) => {
      ensureStructureCells(field as StructureRegionField)

      if (Array.isArray(field.children)) {
        normalizeStructureFields(field.children as QfbSchemaField[])
      }

      ;((field as StepperField).steps || []).forEach((step) => {
        if (Array.isArray(step.children)) normalizeStructureFields(step.children)
      })

      ;((field as TabsField).tabs || []).forEach((tab) => {
        if (Array.isArray(tab.children)) normalizeStructureFields(tab.children)
      })

      ;((field as StructureRegionField).cells || []).forEach((cell) => {
        if (Array.isArray(cell.children)) normalizeStructureFields(cell.children)
      })
    })
  }

  function getStructureChildrenForMigration(field: QfbSchemaField): QfbSchemaField[] {
    if (field.$formkit === stepperType) {
      return ((field as StepperField).steps || []).flatMap(step => step.children || [])
    }

    if (field.$formkit === tabsType) {
      return ((field as TabsField).tabs || []).flatMap(tab => tab.children || [])
    }

    if (['q-grid', 'q-table-structure'].includes(String(field.$formkit))) {
      const structureField = field as StructureRegionField
      const cells = ensureStructureCells(structureField)
      const definitions = getStructureCellDefinitions(structureField)
      const orderedCells = definitions
        .map(definition => cells.find(cell => cell.name === definition.name))
        .filter(Boolean) as StructureCell[]
      const orderedNames = new Set(orderedCells.map(cell => cell.name))
      const remainingCells = cells.filter(cell => !orderedNames.has(cell.name))

      return [...orderedCells, ...remainingCells].flatMap(cell => cell.children || [])
    }

    if (Array.isArray(field.children)) {
      return field.children
    }

    return []
  }

  const getActiveListKey = computed<BuilderFieldListKey>(() => {
    return hasStepper.value && activeStepName.value ? `step:${activeStepName.value}` : 'root'
  })

  const resolveFieldList = (listKey?: BuilderFieldListKey | null): QfbSchemaField[] | null => {
    const key = listKey || getActiveListKey.value
    if (key === 'root') return formFields.value

    if (key.startsWith('step:')) {
      const stepName = key.slice('step:'.length)
      const step = getStepByName(stepName)
      return step ? ensureStepChildren(step) : null
    }

    if (key.startsWith('children:')) {
      const fieldName = key.slice('children:'.length)
      const field = getFieldByName(fieldName)
      return field ? ensureChildren(field) : null
    }

    if (key.startsWith('tab:')) {
      const [, tabsName, tabName] = key.split(':')
      const tabsField = getFieldByName(tabsName || '') as TabsField | undefined
      const tab = tabsField?.tabs?.find(item => item.name === tabName)
      return tab ? ensureTabChildren(tab) : null
    }

    if (isCellListKey(key)) {
      const [, fieldName, cellName] = key.split(':')
      const field = getFieldByName(fieldName || '') as StructureRegionField | undefined
      const cell = field ? ensureStructureCells(field).find(item => item.name === cellName) : undefined
      return cell ? ensureCellChildren(cell) : null
    }

    return null
  }

  function getDefaultStructureListKey(fieldName?: string | null): BuilderFieldListKey | null {
    if (!fieldName) return null
    const field = getFieldByName(fieldName) as StructureRegionField | TabsField | StepperField | undefined
    if (!field) return null

    if (['q-container', 'q-list-structure'].includes(String(field.$formkit))) {
      return `children:${fieldName}`
    }

    if (['q-grid', 'q-table-structure'].includes(String(field.$formkit))) {
      const [firstCell] = ensureStructureCells(field as StructureRegionField)
      return firstCell ? `cell:${fieldName}:${firstCell.name}` : null
    }

    if (field.$formkit === tabsType) {
      const tabs = (field as TabsField).tabs || []
      const tab = tabs.find(item => item.name === activeTabConfigName.value) || tabs[0]
      return tab ? `tab:${fieldName}:${tab.name}` : null
    }

    if (field.$formkit === stepperType) {
      const step = getActiveStep() || getSteps()[0]
      return step ? `step:${step.name}` : null
    }

    return null
  }

  const collectNestedFields = (fields: QfbSchemaField[]): QfbSchemaField[] => {
    return fields.flatMap((field) => {
      const nested: QfbSchemaField[] = []

      if (field.$formkit === stepperType) {
        const stepper = field as StepperField
        stepper.steps?.forEach((step) => {
          nested.push(...collectNestedFields(step.children || []))
        })
      }

      if (field.$formkit === tabsType) {
        const tabs = field as TabsField
        tabs.tabs?.forEach((tab) => {
          nested.push(...collectNestedFields(tab.children || []))
        })
      }

      if (Array.isArray(field.children)) {
        nested.push(...collectNestedFields(field.children))
      }

      if (Array.isArray((field as StructureRegionField).cells)) {
        ;(field as StructureRegionField).cells?.forEach((cell) => {
          nested.push(...collectNestedFields(cell.children || []))
        })
      }

      return [field, ...nested]
    })
  }

  const findFieldInList = (
    fields: QfbSchemaField[],
    fieldName: string,
    listKey: BuilderFieldListKey,
    byId = false,
  ): FieldLocation | null => {
    for (let index = 0; index < fields.length; index += 1) {
      const field = fields[index]!
      if ((byId ? field.fieldId : field.name) === fieldName) return { listKey, list: fields, index, field }

      if (field.$formkit === stepperType) {
        const stepper = field as StepperField
        for (const step of stepper.steps || []) {
          const result = findFieldInList(step.children || [], fieldName, `step:${step.name}`, byId)
          if (result) return result
        }
      }

      if (field.$formkit === tabsType) {
        const tabs = field as TabsField
        for (const tab of tabs.tabs || []) {
          const result = findFieldInList(tab.children || [], fieldName, `tab:${field.name}:${tab.name}`, byId)
          if (result) return result
        }
      }

      if (Array.isArray(field.children)) {
        const result = findFieldInList(field.children, fieldName, `children:${field.name}`, byId)
        if (result) return result
      }

      if (Array.isArray((field as StructureRegionField).cells)) {
        const cells = (field as StructureRegionField).cells || []
        for (const cell of cells) {
          const result = findFieldInList(cell.children || [], fieldName, `cell:${field.name}:${cell.name}`, byId)
          if (result) return result
        }
      }
    }

    return null
  }

  const activeFields = computed<QfbSchemaField[]>(() => {
    return resolveFieldList(getActiveListKey.value) || []
  })

  const allFields = computed<QfbSchemaField[]>(() => collectNestedFields(formFields.value))

  const getFieldLocationById = (fieldId: string) => findFieldInList(formFields.value, fieldId, 'root', true)
  const getFieldLocationByName = (fieldName: string) => {
    const field = getFieldByName(fieldName)
    return field?.fieldId ? getFieldLocationById(field.fieldId) : findFieldInList(formFields.value, fieldName, 'root')
  }

  const getFieldListKeyByName = (fieldName: string): BuilderFieldListKey | null => getFieldLocationByName(fieldName)?.listKey || null

  const updateFieldByName = (fieldName: string, updater: (field: QfbSchemaField) => QfbSchemaField) => {
    const location = getFieldLocationByName(fieldName)
    if (!location) return null

    const updatedField = updater(location.field)
    location.list[location.index] = updatedField
    return updatedField
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

  function getRootStructureMigrationFields() {
    return formFields.value.flatMap((field) => {
      if (isRootOnlyStructure(field)) return getStructureChildrenForMigration(field)
      return [field]
    })
  }

  function activateStepper(stepper: StepperField) {
    activeStepName.value = stepper.steps?.[0]?.name || ''
    activeStepConfigName.value = stepper.steps?.[0]?.name || null
    activeTabsFieldName.value = null
    activeTabConfigName.value = null
    setActiveField(null)
  }

  function activateTabs(tabs: TabsField) {
    const firstTabName = tabs.tabs?.[0]?.name || null
    activeStepName.value = ''
    activeStepConfigName.value = null
    activeTabsFieldName.value = firstTabName ? tabs.name || null : null
    activeTabConfigName.value = firstTabName
    setActiveField(null)
  }

  const buildStepper = (fields: QfbSchemaField[], stepperSchema?: QfbSchemaField) => {
    const stepName = generateStepName()
    const sourceSteps = Array.isArray(stepperSchema?.steps)
      ? JSON.parse(JSON.stringify(stepperSchema.steps)) as StepDefinition[]
      : []
    const steps = sourceSteps.length
      ? sourceSteps.map((step, index) => ({
          ...step,
          children: index === 0 ? fields : step.children || [],
        }))
      : [
          {
            name: stepName,
            label: 'Passo 1',
            showPrevious: true,
            prevLabel: '',
            nextLabel: '',
            children: fields,
          },
        ]

    return {
      $formkit: stepperType,
      ...(stepperSchema ? JSON.parse(JSON.stringify(stepperSchema)) : {}),
      name: generateUniqueName(stepperSchema?.name || 'stepper', collectNestedFields(fields)),
      steps,
    } as StepperField
  }

  const buildTabs = (fields: QfbSchemaField[], tabsSchema?: QfbSchemaField) => {
    const sourceTabs = Array.isArray(tabsSchema?.tabs)
      ? JSON.parse(JSON.stringify(tabsSchema.tabs)) as TabDefinition[]
      : []
    const tabs = sourceTabs.length
      ? sourceTabs.map((tab, index) => ({
          ...tab,
          children: index === 0 ? fields : tab.children || [],
        }))
      : [
          {
            name: 'tab_1',
            label: 'Aba 1',
            children: fields,
          },
        ]

    return {
      $formkit: tabsType,
      ...(tabsSchema ? JSON.parse(JSON.stringify(tabsSchema)) : {}),
      name: generateUniqueName(tabsSchema?.name || 'tabs', collectNestedFields(fields)),
      tabs,
    } as TabsField
  }

  function replaceRootOnlyStructure(structureSchema: QfbSchemaField) {
    if (!isRootOnlyStructure(structureSchema)) return false

    const migratedFields = getRootStructureMigrationFields()
    const nextStructure = structureSchema.$formkit === stepperType
      ? buildStepper(migratedFields, structureSchema)
      : buildTabs(migratedFields, structureSchema)

    formFields.value = [nextStructure]

    if (nextStructure.$formkit === stepperType) {
      activateStepper(nextStructure as StepperField)
    }
    else {
      activateTabs(nextStructure as TabsField)
    }

    cacheFormFields()
    return true
  }

  const getSchema = computed(() => {
    if (schemaErrors.value.length) throw new QfbSchemaError(schemaErrors.value)
    return formFields.value.reduce<Record<string, Omit<QfbSchemaField, 'name'>>>((acc, { name, ...rest }) => {
      if (name) acc[name] = rest
      return acc
    }, {})
  })

  if (hasStepper.value) {
    ensureActiveStep()
    ensureActiveStepConfig()
  }

  const getFields: ComputedRef<QfbSchemaField[]> = computed(() => {
    return formFields.value.map((formField) => {
      if (formSettings.value.previewMode === 'editing' && formField && Object.keys(formField).some(objKey => objKey.includes('if'))) {
        const { if: _condition, ...rest } = formField
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

  function cacheFormFields() {
    walkQfbSchema(formFields.value, (field) => {
      if ((field.name || field.$formkit) && !field.fieldId) field.fieldId = createQfbId()
    })
    if (schemaErrors.value.length) {
      notify({ color: 'negative', message: schemaErrors.value[0]!.message })
      return false
    }
    formHistoryStore.addToMemory(formFields.value)
    setBrowserStorageItem(formFieldsStorageKey, JSON.stringify(formFields.value))
    return true
  }

  const setFormFields = (newFields: QfbSchemaField[]) => {
    const selectedId = activeField.value?.fieldId
    const nextFields = JSON.parse(JSON.stringify(newFields)) as QfbSchemaField[]
    normalizeStructureFields(nextFields)
    formFields.value = adoptQfbSchema(nextFields).fields
    if (selectedId) activeField.value = getFieldById(selectedId) as ActiveFieldType
    if (hasStepper.value) {
      ensureActiveStep()
      ensureActiveStepConfig()
    }
    else {
      activeStepConfigName.value = null
    }
    if (!activeTabsFieldName.value || !getTabsFieldByName(activeTabsFieldName.value)) {
      activeTabsFieldName.value = null
      activeTabConfigName.value = null
    }
    if (!schemaErrors.value.length) setBrowserStorageItem(formFieldsStorageKey, JSON.stringify(formFields.value))
  }

  function hydrateFromStorage() {
    const cachedFields = getBrowserJsonItem<QfbSchemaField[]>(formFieldsStorageKey, [])
    if (!Array.isArray(cachedFields)) return
    setFormFields(cachedFields)
  }

  function getFieldByName(fieldName: string) {
    return allFields.value.find(formField => formField.name === fieldName)
  }

  function getFieldById(fieldId: string): QfbSchemaField | null {
    let result: QfbSchemaField | null = null
    walkQfbSchema(formFields.value, (field) => {
      if (field.fieldId === fieldId) result = field as QfbSchemaField
    })
    return result
  }

  function exportSchema() {
    if (schemaErrors.value.length) throw new QfbSchemaError(schemaErrors.value)
    return JSON.parse(JSON.stringify(formFields.value)) as QfbSchemaField[]
  }

  function replaceFieldIdentity(fieldId: string) {
    const field = getFieldById(fieldId)
    if (!field) return
    field.fieldId = createQfbId()
    cacheFormFields()
    return field.fieldId
  }

  function getCellListOwnerField(listKey?: BuilderFieldListKey | null) {
    const ownerName = getCellListOwnerName(listKey)
    return ownerName ? getFieldByName(ownerName) : null
  }

  function isGridField(field?: QfbSchemaField | null) {
    return field?.$formkit === 'q-grid'
  }

  function isGridNestedInGridCell(fieldName?: string | null) {
    if (!fieldName) return false
    const location = getFieldLocationByName(fieldName)
    if (!isCellListKey(location?.listKey)) return false
    return isGridField(getCellListOwnerField(location?.listKey))
  }

  function canPlaceFieldInList(field: QfbSchemaField, targetListKey?: BuilderFieldListKey | null) {
    if (!isGridField(field) || !isCellListKey(targetListKey)) return true

    const ownerField = getCellListOwnerField(targetListKey)
    if (!isGridField(ownerField)) return true
    if (!isGridNestedInGridCell(ownerField?.name || null)) return true

    notify({ color: 'dark', message: 'Um sub grid não pode receber outro grid' })
    return false
  }

  function canPlaceRootOnlyStructure(field: QfbSchemaField, _pos?: number | null, listKey?: BuilderFieldListKey | null) {
    if (!isRootOnlyStructure(field)) return true

    const label = getRootOnlyStructureLabel(field)
    const targetListKey = listKey || getActiveListKey.value

    if (targetListKey !== 'root') {
      notify({ color: 'dark', message: `${label} só pode ser adicionado no início do formulário` })
      return false
    }

    return true
  }

  function getRootOnlyStructureContentListKey(): BuilderFieldListKey | null {
    const rootOnlyStructure = getRootOnlyStructure()
    if (!rootOnlyStructure?.name) return null
    return getDefaultStructureListKey(rootOnlyStructure.name)
  }

  function resolveRootInsertionListKey(
    field: QfbSchemaField,
    targetListKey: BuilderFieldListKey,
  ): BuilderFieldListKey {
    if (targetListKey !== 'root') return targetListKey
    if (!hasRootOnlyStructure.value) return targetListKey
    if (isRootOnlyStructure(field)) return targetListKey
    return getRootOnlyStructureContentListKey() || targetListKey
  }

  const addField = (field: QfbSchemaField, pos?: number | null, listKey?: BuilderFieldListKey | null) => {
    field = cloneFieldForInsert(field)
    if (!canPlaceRootOnlyStructure(field, pos, listKey)) return false

    if (isRootOnlyStructure(field)) {
      return replaceRootOnlyStructure(field)
    }

    const targetListKey = resolveRootInsertionListKey(field, listKey || getActiveListKey.value)
    if (!canPlaceFieldInList(field, targetListKey)) return false

    const fieldsList = resolveFieldList(targetListKey) || activeFields.value
    const formLength = fieldsList.length
    const destinationIndex = pos === undefined || pos === null ? formLength : Number(pos)

    field.name = generateUniqueName(field.name || 'field', allFields.value)
    ensureStructureCells(field as StructureRegionField)

    if (isCellListKey(targetListKey)) {
      replaceCellChildren(fieldsList, field)
      notify({ color: 'dark', message: `${field?.name} adicionado` })
      cacheFormFields()
      return true
    }

    if (destinationIndex <= 0) {
      fieldsList.unshift(field)
    }
    else if (destinationIndex >= formLength) {
      fieldsList.push(field)
    }
    else {
      fieldsList.splice(destinationIndex, 0, field)
    }

    notify({ color: 'dark', message: `${field?.name} adicionado` })
    cacheFormFields()
    return true
  }

  const updateFieldIndex = ({ draggedField, originalPosition, destinationIndex }: {
    draggedField: QfbSchemaField
    originalPosition: number
    destinationIndex: number
  }) => {
    if (draggedField?.name) {
      moveFieldToList(draggedField.name, getActiveListKey.value, destinationIndex)
      return
    }

    const fieldsList = activeFields.value
    fieldsList.splice(originalPosition, 1)
    fieldsList.splice(destinationIndex, 0, draggedField!)
    cacheFormFields()
  }

  function getListOwnerName(listKey?: BuilderFieldListKey | null) {
    if (!listKey || listKey === 'root') return null
    if (listKey.startsWith('children:')) return listKey.slice('children:'.length)
    if (listKey.startsWith('tab:')) return listKey.split(':')[1] || null
    if (isCellListKey(listKey)) return listKey.split(':')[1] || null
    if (listKey.startsWith('step:')) return getStepper()?.name || null
    return null
  }

  function canMoveFieldToList(fieldName: string, targetListKey?: BuilderFieldListKey | null) {
    const sourceLocation = getFieldLocationByName(fieldName)
    if (!sourceLocation) return false

    if (isRootOnlyStructure(sourceLocation.field) && targetListKey !== 'root') {
      const label = getRootOnlyStructureLabel(sourceLocation.field)
      notify({ color: 'dark', message: `${label} só pode ficar no início do formulário` })
      return false
    }

    const ownerName = getListOwnerName(targetListKey)
    if (!ownerName) return true
    if (ownerName === fieldName) {
      notify({ color: 'dark', message: 'Uma estrutura não pode receber ela mesma' })
      return false
    }

    const nestedNames = collectNestedFields([sourceLocation.field]).map(field => field.name).filter(Boolean)
    if (nestedNames.includes(ownerName)) {
      notify({ color: 'dark', message: 'Não é possível mover uma estrutura para dentro de um dos seus próprios filhos' })
      return false
    }

    return true
  }

  function moveFieldToList(fieldName: string, targetListKey?: BuilderFieldListKey | null, destinationIndex?: number | null) {
    const requestedDestinationListKey = targetListKey || getActiveListKey.value
    const sourceLocation = getFieldLocationByName(fieldName)
    const destinationListKey = sourceLocation
      ? resolveRootInsertionListKey(sourceLocation.field, requestedDestinationListKey)
      : requestedDestinationListKey
    const targetList = resolveFieldList(destinationListKey)
    if (!sourceLocation || !targetList) return
    if (!canMoveFieldToList(fieldName, destinationListKey)) return false
    if (!canPlaceFieldInList(sourceLocation.field, destinationListKey)) return false

    if (sourceLocation.list === targetList && (destinationIndex === undefined || destinationIndex === null)) return

    if (isCellListKey(destinationListKey)) {
      const [field] = sourceLocation.list.splice(sourceLocation.index, 1)
      if (!field) return false

      replaceCellChildren(targetList, field)

      if (field.name === activeField.value?.name) {
        activeField.value = field as ActiveFieldType
      }

      cacheFormFields()
      return true
    }

    const isSameList = sourceLocation.list === targetList
    const requestedIndex = destinationIndex ?? targetList.length
    const adjustedIndex = isSameList && sourceLocation.index < requestedIndex ? requestedIndex - 1 : requestedIndex
    let boundedIndex = Math.max(0, Math.min(adjustedIndex, targetList.length))

    if (isRootOnlyStructure(sourceLocation.field) && boundedIndex !== 0) {
      boundedIndex = 0
    }

    const [field] = sourceLocation.list.splice(sourceLocation.index, 1)
    if (!field) return

    targetList.splice(boundedIndex, 0, field)

    if (destinationListKey?.startsWith('step:')) {
      activeStepName.value = destinationListKey.slice('step:'.length)
    }

    if (field.name === activeField.value?.name) {
      activeField.value = field as ActiveFieldType
    }

    cacheFormFields()
    return true
  }

  function getFieldRowRange(list: QfbSchemaField[], targetIndex: number) {
    let rowStart = 0
    let rowSpan = 0

    for (let index = 0; index < list.length; index++) {
      const currentSpan = getFieldColumnSpan(list[index] as FieldWithColumns)

      if (rowSpan > 0 && rowSpan + currentSpan > 12) {
        rowStart = index
        rowSpan = 0
      }

      rowSpan += currentSpan

      if (index === targetIndex) {
        let rowEnd = index + 1
        let nextSpan = rowSpan

        while (rowEnd < list.length) {
          const nextFieldSpan = getFieldColumnSpan(list[rowEnd] as FieldWithColumns)
          if (nextSpan + nextFieldSpan > 12) break
          nextSpan += nextFieldSpan
          rowEnd++
          if (nextSpan >= 12) break
        }

        return { start: rowStart, end: rowEnd }
      }

      if (rowSpan >= 12) {
        rowStart = index + 1
        rowSpan = 0
      }
    }

    return { start: targetIndex, end: targetIndex + 1 }
  }

  function distributeFieldsAcrossRow(fields: QfbSchemaField[]) {
    const fieldsToResize = fields.slice(0, 12)
    const baseSpan = Math.max(1, Math.floor(12 / fieldsToResize.length))
    const remainder = 12 % fieldsToResize.length

    fieldsToResize.forEach((field, index) => {
      setFieldColumnSpan(field as FieldWithColumns, baseSpan + (index < remainder ? 1 : 0))
    })
  }

  function getBesideInsertIndex(
    list: QfbSchemaField[],
    targetIndex: number,
    placement: Extract<BuilderDragPlacement, 'left' | 'right'>,
  ) {
    const rowRange = getFieldRowRange(list, targetIndex)
    const rowLength = rowRange.end - rowRange.start

    if (rowLength >= 12) {
      return placement === 'left' ? rowRange.start : rowRange.end
    }

    return placement === 'left' ? targetIndex : targetIndex + 1
  }

  function applyBesideRowColumnLayout(
    list: QfbSchemaField[],
    rowRangeBeforeInsert: { start: number, end: number },
    insertedField: QfbSchemaField,
  ) {
    const rowFieldsCountBeforeInsert = rowRangeBeforeInsert.end - rowRangeBeforeInsert.start

    if (rowFieldsCountBeforeInsert >= 12) {
      setFieldColumnSpan(insertedField as FieldWithColumns, 12)
      return
    }

    const rowFields = list.slice(rowRangeBeforeInsert.start, rowRangeBeforeInsert.end + 1)

    if (!rowFields.some(field => field.name === insertedField.name)) return
    distributeFieldsAcrossRow(rowFields)
  }

  function getBesideInsertionContext(targetFieldName: string, targetListKey?: BuilderFieldListKey | null) {
    const targetLocation = getFieldLocationByName(targetFieldName)
    if (!targetLocation) return null

    const listKey = targetListKey || targetLocation.listKey
    const list = resolveFieldList(listKey)
    if (!list) return null

    const targetIndex = list.findIndex(field => field.name === targetFieldName)
    if (targetIndex < 0) return null

    return {
      listKey,
      list,
      targetIndex,
      targetField: list[targetIndex]!,
    }
  }

  function addFieldBeside(
    field: QfbSchemaField,
    targetFieldName: string,
    placement: Extract<BuilderDragPlacement, 'left' | 'right'>,
    targetListKey?: BuilderFieldListKey | null,
  ) {
    if (isRootOnlyStructure(field)) {
      notify({ color: 'dark', message: `${getRootOnlyStructureLabel(field)} só pode ser adicionado no início do formulário` })
      return false
    }

    const context = getBesideInsertionContext(targetFieldName, targetListKey)
    if (!context) return false
    if (!canPlaceFieldInList(field, context.listKey)) return false

    const nextField = cloneFieldForInsert(field)
    nextField.name = generateUniqueName(nextField.name || 'field', allFields.value)
    ensureStructureCells(nextField as StructureRegionField)

    if (isCellListKey(context.listKey)) {
      replaceCellChildren(context.list, nextField)
      notify({ color: 'dark', message: `${nextField?.name} adicionado` })
      cacheFormFields()
      return true
    }

    const rowRange = getFieldRowRange(context.list, context.targetIndex)
    const insertIndex = getBesideInsertIndex(context.list, context.targetIndex, placement)
    context.list.splice(insertIndex, 0, nextField)
    applyBesideRowColumnLayout(context.list, rowRange, nextField)

    notify({ color: 'dark', message: `${nextField?.name} adicionado` })
    cacheFormFields()
    return true
  }

  function moveFieldBeside(
    fieldName: string,
    targetFieldName: string,
    placement: Extract<BuilderDragPlacement, 'left' | 'right'>,
    targetListKey?: BuilderFieldListKey | null,
  ) {
    if (fieldName === targetFieldName) return false

    const sourceLocation = getFieldLocationByName(fieldName)
    const context = getBesideInsertionContext(targetFieldName, targetListKey)
    if (!sourceLocation || !context) return false
    if (isRootOnlyStructure(sourceLocation.field)) {
      notify({ color: 'dark', message: `${getRootOnlyStructureLabel(sourceLocation.field)} só pode ficar no início do formulário` })
      return false
    }
    if (!canMoveFieldToList(fieldName, context.listKey)) return false
    if (!canPlaceFieldInList(sourceLocation.field, context.listKey)) return false

    if (isCellListKey(context.listKey)) {
      const [field] = sourceLocation.list.splice(sourceLocation.index, 1)
      if (!field) return false

      replaceCellChildren(context.list, field)

      if (field.name === activeField.value?.name) {
        activeField.value = field as ActiveFieldType
      }

      cacheFormFields()
      return true
    }

    const [field] = sourceLocation.list.splice(sourceLocation.index, 1)
    if (!field) return false

    const targetIndex = context.list.findIndex(item => item.name === targetFieldName)
    if (targetIndex < 0) {
      sourceLocation.list.splice(sourceLocation.index, 0, field)
      return false
    }

    const insertIndex = getBesideInsertIndex(context.list, targetIndex, placement)
    context.list.splice(insertIndex, 0, field)

    if (context.listKey.startsWith('step:')) {
      activeStepName.value = context.listKey.slice('step:'.length)
    }

    if (field.name === activeField.value?.name) {
      activeField.value = field as ActiveFieldType
    }

    cacheFormFields()
    return true
  }

  const moveFieldToStep = (fieldName: string, targetStepName: string, destinationIndex?: number | null) => {
    moveFieldToList(fieldName, `step:${targetStepName}`, destinationIndex)
  }

  const replaceStepper = (stepperSchema?: QfbSchemaField) => {
    return replaceRootOnlyStructure(stepperSchema || { $formkit: stepperType, name: 'stepper' })
  }

  const removeField = (field: QfbSchemaField | null, index?: number) => {
    if (!field) return

    const location = getFieldLocationByName(field?.name || '')
    const fieldsList = location?.list || activeFields.value
    const fieldIndex = location?.index ?? index ?? fieldsList.findIndex(ff => ff.name === field?.name)
    if (fieldIndex < 0) return

    removeAllConditionsUses(field)

    const migratedChildren = isStructureField(field)
      ? getStructureChildrenForMigration(field as QfbSchemaField)
      : []
    fieldsList.splice(fieldIndex, 1, ...migratedChildren)
    const removedNames = collectNestedFields([field as QfbSchemaField]).map(item => item.name).filter(Boolean)

    if (activeField.value?.name && removedNames.includes(activeField.value.name)) {
      setActiveField(null)
    }

    if (field?.name === activeTabsFieldName.value || removedNames.includes(activeTabsFieldName.value || '')) {
      activeTabsFieldName.value = null
      activeTabConfigName.value = null
    }

    if (field?.$formkit === stepperType) {
      activeStepName.value = ''
      activeStepConfigName.value = null
    }

    cacheFormFields()
  }

  const cloneFieldWithUniqueNames = (field: QfbSchemaField, usedFields: QfbSchemaField[]) => {
    return duplicateQfbSchema([field], usedFields.map(item => String(item.name || ''))).fields[0] as QfbSchemaField
  }

  const copyField = (index: number | null, fieldElement?: QfbSchemaField, listKey?: BuilderFieldListKey | null) => {
    const sourceLocation = fieldElement?.name ? getFieldLocationByName(fieldElement.name) : null
    const targetListKey = listKey || sourceLocation?.listKey || getActiveListKey.value
    const fieldsList = resolveFieldList(targetListKey) || activeFields.value
    if (isCellListKey(targetListKey) || isCellListKey(sourceLocation?.listKey)) return false
    const field = fieldElement || fieldsList.find((_, i) => i === index)
    if (!field) return
    if (!index && index !== 0) {
      index = fieldsList.findIndex(formField => formField.name === field.name)
    }
    const newElemPosition = index + 1
    const newField = cloneFieldWithUniqueNames(field, [...allFields.value])
    fieldsList.splice(newElemPosition, 0, newField)
    setActiveField(newField)
    cacheFormFields()
  }

  function setActiveField(newField: ActiveFieldType) {
    activeField.value = newField
    dispatchBuilderSelectionChange({
      fieldName: newField?.name || null,
      fieldId: newField?.fieldId || null,
    })
  }

  const updateNameField = (oldName?: string, newName?: string) => {
    if (!oldName) return

    if (!newName) return new Error('name cannot be empty', { cause: 500 })

    if (/\s/.test(newName)) return new Error('name cannot contain spaces', { cause: 500 })

    if (nameExists(newName, allFields.value)) return new Error('name already exists', { cause: 500 })

    const target = getFieldByName(oldName)
    if (!target?.fieldId) return new Error('field identity not found')
    const selectedId = activeField.value?.fieldId
    try {
      formFields.value = renameQfbField(formFields.value, target.fieldId, newName)
      if (selectedId) activeField.value = getFieldById(selectedId) as ActiveFieldType
    }
    catch (error) {
      return error instanceof Error ? error : new Error(String(error))
    }

    if (activeTabsFieldName.value === oldName) {
      activeTabsFieldName.value = newName
    }

    cacheFormFields()
  }

  const insertValidationRule = (
    validation: unknown,
    newRule: string | boolean,
  ): string => {
    const current = isQfbConditionalRule(validation) ? validation.then : validation
    const rules: Array<string | boolean> = typeof current === 'string' ? current.split('|') : []
    const ruleName = typeof newRule === 'string' ? newRule.split(':')[0] : newRule

    const updatedRules = rules.map(rule =>
      typeof rule === 'string' && rule.startsWith(`${ruleName}:`) ? newRule : rule,
    )

    if (!updatedRules.includes(newRule)) {
      updatedRules.push(newRule)
    }

    return updatedRules.filter(updateRule => updateRule).join('|')
  }

  const removeValidationRule = (
    validation: unknown,
    ruleToRemove: string,
  ): string => {
    const current = isQfbConditionalRule(validation) ? validation.then : validation
    const rules = typeof current === 'string' ? current.split('|') : []

    const updatedRules = rules.filter(rule => !rule.includes(ruleToRemove))
    return updatedRules.join('|')
  }

  const updatePropFromActiveField = async (fieldElement: QfbSchemaField | null, propName?: string, newPropValue?: any) => {
    if (!propName || !fieldElement?.name) return

    if (!activeField.value) return

    const updatedPropValue = (propName === 'validation' && newPropValue) || (propName === 'disable' && Object.keys(newPropValue).length)
      ? handleValidationUpdate(fieldElement, propName, newPropValue)
      : propName === 'attrs' && newPropValue
        ? typeof newPropValue === 'string'
          ? {
              ...fieldElement.attrs,
              ...Object.fromEntries([newPropValue.split(':').map(part => part.trim())]),
            }
          : newPropValue
        : newPropValue

    updateFieldProperties(propName, updatedPropValue, fieldElement.name)

    await nextTick()

    if (shouldDeleteProperty(updatedPropValue, propName)) {
      deleteFieldProperty(propName, fieldElement.name)
    }
    cacheFormFields()
  }

  function handleValidationUpdate(fieldElement: QfbSchemaField, propName: string, newPropValue: any) {
    const current = fieldElement[propName]
    if (!isQfbConditionalRule(current) && newPropValue.if) {
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
  function updateValidationElement(fieldElement: QfbSchemaField, propName: string, newPropValue: any) {
    const current = fieldElement[propName]
    const condition = isQfbConditionalRule(current) ? current : undefined
    if (newPropValue?.if === '') {
      // If the new property has an empty 'if', return the 'then' part of the validation
      return condition?.then
    }

    if (newPropValue?.if) {
      // If the new property has 'if', merge it with the current validation
      return { ...condition, ...newPropValue }
    }

    // Get the appropriate validation element based on the new property and current validation
    const validationElement = getValidationElement(
      fieldElement,
      propName,
      newPropValue,
    )

    if (newPropValue?.if) {
      // If the new property has 'if', return a new validation object with 'then' and 'else'
      return {
        ...newPropValue,
        then: validationElement,
        else: convertToBoolean(toggleToFalse(removeRequiredRule(validationElement))),
      }
    }

    if (condition?.if) {
      // If the current validation has 'if', return a new validation object with 'then' and 'else'
      return {
        ...condition,
        then: validationElement,
        else: convertToBoolean(toggleToFalse(removeRequiredRule(validationElement))),
      }
    }

    // Otherwise, return the validation element as is
    return validationElement
  }

  function getValidationElement(fieldElement: QfbSchemaField, propName: string, newPropValue: any): string {
    return newPropValue && newPropValue?.startsWith?.('-')
      ? removeValidationRule(fieldElement[propName], newPropValue.substring(1))
      : insertValidationRule(fieldElement[propName] || '', newPropValue)
  }

  function removeRequiredRule(validation: unknown) {
    return String(validation).replace(/(^required\||\|required$|^required$|\|required\|)/, '')
  }

  function toggleToFalse(validation: any) {
    if (typeof validation === 'string') return validation?.replace?.('true', 'false')

    return validation
  }

  function convertToBoolean(validation: string) {
    if (validation?.match?.('true')?.length) return true
    if (validation?.match?.('false')?.length) return false

    return validation
  }

  function updateFieldProperties(propName: string, newPropValue: any, fieldName: string) {
    if (activeField.value) {
      activeField.value = { ...activeField.value, [propName]: newPropValue }
      ensureStructureCells(activeField.value as StructureRegionField)
    }
    updateFieldByName(fieldName, (field) => {
      const updatedField = { ...field, [propName]: newPropValue }
      ensureStructureCells(updatedField as StructureRegionField)
      return updatedField
    })
  }

  function deleteFieldProperty(propName: string, fieldName: string) {
    if (activeField.value?.name === fieldName) {
      const { [propName]: _, ...restActiveField } = activeField.value
      activeField.value = restActiveField as ActiveFieldType
    }

    updateFieldByName(fieldName, (field) => {
      const restField = { ...field }
      delete restField[propName]
      return restField
    })
  }

  function removeAllConditionsUses(field: QfbSchemaField) {
    if (!field.name) return
    removeQfbConditionsReferencing(formFields.value, field.name)
  }

  function shouldDeleteProperty(newPropValue: any, propName?: string) {
    if (propName && liveFalseInputProps.has(propName) && newPropValue === false) return false
    if (propName === 'format24h' && newPropValue === false) return false
    return newPropValue === false || newPropValue === '' || isEmptyObject(newPropValue)
  }

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

  const changePreviewMode = (mode: FormSettingsType['previewMode']) => {
    if (!['editing', 'previewing'].includes(mode)) return
    if (formSettings.value.previewMode === mode) return
    formSettings.value.previewMode = mode
    dispatchBuilderEvent('builder:preview-mode-change', { mode })
  }

  const setActiveStep = (stepName: string) => {
    activeStepName.value = stepName
  }

  const setActiveStepConfig = (stepName: string | null) => {
    activeStepConfigName.value = stepName
    if (stepName) {
      activeTabsFieldName.value = null
      activeTabConfigName.value = null
    }
    dispatchBuilderSelectionChange({ stepName })
  }

  const requestStepLabelFocus = () => {
    dispatchBuilderEvent('builder:focus-step-label')
  }

  const setActiveTabConfig = (tabsFieldName: string | null, tabName: string | null = null) => {
    if (!tabsFieldName || !tabName || !getTabByName(tabsFieldName, tabName)) {
      activeTabsFieldName.value = null
      activeTabConfigName.value = null
      dispatchBuilderSelectionChange({})
      return
    }

    activeTabsFieldName.value = tabsFieldName
    activeTabConfigName.value = tabName
    activeStepConfigName.value = null
    activeField.value = null
    dispatchBuilderSelectionChange({ tabsFieldName, tabName })
  }

  const setActiveTab = (tabsFieldName: string | null, tabName: string | null = null) => {
    if (!tabsFieldName || !tabName || !getTabByName(tabsFieldName, tabName)) {
      activeTabsFieldName.value = null
      activeTabConfigName.value = null
      return
    }

    activeTabsFieldName.value = tabsFieldName
    activeTabConfigName.value = tabName
    activeStepConfigName.value = null
  }

  const requestTabLabelFocus = () => {
    dispatchBuilderEvent('builder:focus-tab-label')
  }

  const generateTabName = (tabsField: TabsField) => {
    const tabs = tabsField.tabs || []
    let counter = tabs.length + 1
    let candidate = `tab_${counter}`
    while (tabs.some(tab => tab.name === candidate)) {
      counter += 1
      candidate = `tab_${counter}`
    }
    return candidate
  }

  const updateTab = (tabsFieldName: string, tabName: string, updater: (tab: TabDefinition) => TabDefinition) => {
    const tabsField = getTabsFieldByName(tabsFieldName)
    if (!tabsField?.tabs) return
    const index = tabsField.tabs.findIndex(tab => tab.name === tabName)
    if (index === -1) return
    tabsField.tabs[index] = updater(tabsField.tabs[index]!)
    cacheFormFields()
  }

  const updateTabProp = (tabsFieldName: string, tabName: string, prop: keyof TabDefinition, value: any) => {
    updateTab(tabsFieldName, tabName, tab => ({ ...tab, [prop]: value }))
  }

  const updateTabLabel = (tabsFieldName: string, tabName: string, label: string) => {
    updateTabProp(tabsFieldName, tabName, 'label', label)
  }

  const addTab = (tabsFieldName: string) => {
    const tabsField = getTabsFieldByName(tabsFieldName)
    if (!tabsField) return

    tabsField.tabs = tabsField.tabs || []
    const tabName = generateTabName(tabsField)
    const newTab: TabDefinition = {
      name: tabName,
      label: `Aba ${tabsField.tabs.length + 1}`,
      children: [],
    }

    tabsField.tabs.push(newTab)
    setActiveTabConfig(tabsFieldName, tabName)
    cacheFormFields()
  }

  const duplicateTab = (tabsFieldName: string, tabName: string) => {
    const tabsField = getTabsFieldByName(tabsFieldName)
    if (!tabsField?.tabs) return
    const index = tabsField.tabs.findIndex(tab => tab.name === tabName)
    if (index === -1) return

    const source = tabsField.tabs[index]
    const clone = duplicateQfbSchema([source], allFields.value.map(field => String(field.name || ''))).fields[0] as TabDefinition
    clone.name = generateTabName(tabsField)
    clone.label = `${source?.label || source?.name || 'Aba'} cópia`

    tabsField.tabs.splice(index + 1, 0, clone)
    setActiveTabConfig(tabsFieldName, clone.name)
    cacheFormFields()
  }

  const removeTab = (tabsFieldName: string, tabName: string) => {
    const tabsField = getTabsFieldByName(tabsFieldName)
    if (!tabsField?.tabs || tabsField.tabs.length <= 1) return

    const index = tabsField.tabs.findIndex(tab => tab.name === tabName)
    if (index === -1) return

    const [removedTab] = tabsField.tabs.splice(index, 1)
    const nextTab = tabsField.tabs[index] || tabsField.tabs[index - 1] || tabsField.tabs[0]
    if (nextTab && removedTab?.children?.length) {
      nextTab.children = [
        ...(removedTab.children || []),
        ...(nextTab.children || []),
      ]
    }

    if (activeTabsFieldName.value === tabsFieldName && activeTabConfigName.value === tabName) {
      setActiveTabConfig(tabsFieldName, nextTab?.name || null)
    }

    cacheFormFields()
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
    const clone = duplicateQfbSchema([source], allFields.value.map(field => String(field.name || ''))).fields[0] as StepDefinition
    clone.name = generateStepName()
    if (source) rewriteQfbConditions([clone], { [source.name]: clone.name }, formFields.value)

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

    const [removedStep] = stepper.steps.splice(index, 1)
    const nextStep = stepper.steps[index] || stepper.steps[index - 1] || stepper.steps[0]
    if (nextStep && removedStep?.children?.length) {
      nextStep.children = [
        ...(removedStep.children || []),
        ...(nextStep.children || []),
      ]
    }

    if (activeStepName.value === stepName) {
      activeStepName.value = nextStep?.name || ''
    }
    if (activeStepConfigName.value === stepName) {
      activeStepConfigName.value = nextStep?.name || null
    }

    cacheFormFields()
  }

  const removeStepper = () => {
    const stepper = getStepper()
    if (!stepper) return
    removeField(stepper as QfbSchemaField)
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

  const updateActiveFieldColumns = (newColumns: number, shouldCache = true) => {
    if (!activeField.value) return

    const activeFieldName = activeField.value.name
    if (!activeFieldName) {
      setFieldColumnSpan(activeField.value as FieldWithColumns, newColumns)
      if (shouldCache) cacheFormFields()
      return
    }

    const updatedField = updateFieldByName(activeFieldName, (field) => {
      const nextField = { ...field, columns: { ...((field as FieldWithColumns).columns || {}) } } as FieldWithColumns
      if ((field as FieldWithColumns).columns?.default) nextField.columns!.default = { ...(field as FieldWithColumns).columns!.default! }
      if ((field as FieldWithColumns).columns?.sm) nextField.columns!.sm = { ...(field as FieldWithColumns).columns!.sm! }
      if ((field as FieldWithColumns).columns?.lg) nextField.columns!.lg = { ...(field as FieldWithColumns).columns!.lg! }
      setFieldColumnSpan(nextField, newColumns)
      return nextField
    })

    if (updatedField) {
      activeField.value = updatedField as ActiveFieldType
      if (shouldCache) cacheFormFields()
    }
  }

  const updateActiveFieldOnFormFields = () => {
    if (!activeField.value?.name) return
    const field = activeField.value
    updateFieldByName(field.name!, () => ({ ...field }))
    cacheFormFields()
  }

  const onEnteredProp = (propName: string, propValue?: unknown,
  ) => {
    if (!propName) return
    if (propName === 'fieldId') return

    updatePropFromActiveField(activeField.value, propName, propValue)
  }
  return {
    values,
    formSettings,
    formFields,
    schemaErrors,
    activeFields,
    allFields,
    activeStepName,
    activeStepConfigName,
    activeStepConfig,
    activeTabsFieldName,
    activeTabConfigName,
    activeTabConfig,
    hasStepper,
    hasRootOnlyStructure,
    activeField,
    getActiveListKey,
    getSchema,
    getFields,
    getActiveFieldColumns,
    resolveFieldList,
    getDefaultStructureListKey,
    getFieldListKeyByName,
    isStructureField,
    isRootOnlyStructure,
    getRootOnlyStructure,
    canMoveFieldToList,
    hydrateFromStorage,
    setFormFields,
    getFieldByName,
    getFieldById,
    getFieldLocationById,
    exportSchema,
    replaceFieldIdentity,
    addField,
    replaceStepper,
    replaceRootOnlyStructure,
    updateFieldIndex,
    addFieldBeside,
    moveFieldToList,
    moveFieldBeside,
    moveFieldToStep,
    removeField,
    copyField,
    setActiveField,
    setActiveStep,
    setActiveStepConfig,
    requestStepLabelFocus,
    setActiveTabConfig,
    setActiveTab,
    requestTabLabelFocus,
    addTab,
    duplicateTab,
    removeTab,
    updateTabProp,
    updateTabLabel,
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
    changePreviewMode,
    changeViewport,
    updateActiveFieldColumns,
    updateActiveFieldOnFormFields,
    onEnteredProp,
  }
})

export type FormStoreApi = ReturnType<typeof useFormStore>
