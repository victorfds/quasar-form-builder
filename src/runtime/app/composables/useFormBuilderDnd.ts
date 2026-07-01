import type { BuilderDragPlacement, BuilderFieldListKey } from '#qfb/types'
import type { FormKitSchemaDefinition, FormKitSchemaNode } from '@formkit/core'
import { builderDragMime, clearBuilderDragActive, getBuilderDragFormKitType, hasRootOnlyBuilderDrag, isRootOnlyBuilderType, markBuilderDragType } from '#qfb/utils/builderDrag'

export function useFormBuilderDnd(formStore: any) {
  interface DragInIndicator { index?: number, name?: string, placement?: BuilderDragPlacement, listKey?: BuilderFieldListKey }

  const $q = useQuasar()
  const highlightDropArea = ref<boolean>(false)
  const previewFormSectionRef = ref<HTMLElement | null>(null)
  const formDroppableRef = ref<HTMLElement | null>(null)
  const formRefComponent = ref<HTMLElement | null>(null)
  const indexPointer = ref<number | null>(null)
  const elementBeingDragged = ref<{ field?: FormKitSchemaDefinition, index?: number }>({})
  const originalFieldIndex = ref<number | null>(null)
  const originalStepName = ref<string | null>(null)
  const targetStepName = ref<string | null>(null)
  const originalListKey = ref<BuilderFieldListKey | null>(null)
  const targetListKey = ref<BuilderFieldListKey | null>(null)
  const hoverName = ref<string>('')
  const activeNameFields = computed(() => ({
    active: formStore.activeField?.name ? [formStore.activeField.name] : [],
    hover: hoverName.value,
  }))
  const dragInIndicator = ref<DragInIndicator>({})
  const isUserDraggingOver = ref(false)
  const isDragging = ref(true)
  const isDraggingStepper = ref(false)
  const isDraggingRootOnlyStructure = ref(false)
  const startX = ref(0)
  const lastDeltaColumns = ref(0)

  const { setActiveField, setActiveStepConfig, setActiveTabConfig, copyField, updateActiveFieldColumns, updateActiveFieldOnFormFields } = formStore

  const getUserWidthInput = computed(() => {
    if (!formStore.formSettings.preview.width) return 432
    if (Number(formStore.formSettings.preview.width) < 0) return 0
    return Number(formStore.formSettings.preview.width)
  })

  function onDragEnterFormSectionArea() {
    highlightDropArea.value = true
  }

  function onDragLeaveFormSectionArea() {
    highlightDropArea.value = false
    isDraggingStepper.value = false
    isDraggingRootOnlyStructure.value = false
  }

  function resetDragState() {
    clearBuilderDragActive()
    originalFieldIndex.value = null
    originalStepName.value = null
    targetStepName.value = null
    originalListKey.value = null
    targetListKey.value = null
    indexPointer.value = null
    elementBeingDragged.value = {}
    dragInIndicator.value = {}
    isUserDraggingOver.value = false
    highlightDropArea.value = false
    isDraggingStepper.value = false
    isDraggingRootOnlyStructure.value = false
  }

  function clearFieldSelection() {
    setActiveField(null)
  }

  function clearDropTargetState() {
    targetListKey.value = originalListKey.value
    indexPointer.value = null
    dragInIndicator.value = {}
    isUserDraggingOver.value = false
    highlightDropArea.value = false
    isDraggingStepper.value = false
    isDraggingRootOnlyStructure.value = false
  }

  function hasDragState(ev?: DragEvent) {
    const eventTypes = Array.from(ev?.dataTransfer?.types || [])
    return Boolean(
      elementBeingDragged.value.field
      || originalFieldIndex.value !== null
      || isUserDraggingOver.value
      || dragInIndicator.value.placement
      || targetListKey.value
      || eventTypes.includes('text')
      || eventTypes.includes(builderDragMime.fieldName)
      || eventTypes.includes(builderDragMime.fieldType)
      || eventTypes.includes(builderDragMime.rootOnly),
    )
  }

  const explicitDropTargetSelector = [
    '.preview-element-area-top',
    '.preview-element-area-bottom',
    '.preview-element-area-left',
    '.preview-element-area-right',
    '.overlay-preview-element',
    '.overlay-drop-here',
    '.structure-tabs__tab',
    '.q-stepper__tab',
    '.stepper-header-overlay-wrapper',
    '.steps-root-drop-guide',
  ].join(',')
  const structureDropSurfaceSelector = [
    '[data-structure-list-key]',
    '.form-canvas--cell-list',
    '.structure-grid__cell',
    '.structure-table__cell',
  ].join(',')
  const droppableSurfaceSelector = [
    '.form-canvas',
    '.steps-wrapper',
    explicitDropTargetSelector,
    structureDropSurfaceSelector,
  ].join(',')

  function getDragEventTargetElement(ev: Event) {
    const target = ev.target
    if (target instanceof HTMLElement) return target
    if (target instanceof SVGElement) return target.parentElement
    return null
  }

  function isInsideDroppableSurface(ev: Event) {
    return Boolean(getDragEventTargetElement(ev)?.closest(droppableSurfaceSelector))
  }

  function onGlobalDragover(ev: DragEvent) {
    if (!hasDragState(ev)) return
    if (isInsideDroppableSurface(ev)) return
    clearDropTargetState()
  }

  function onGlobalDrop(ev: DragEvent) {
    if (!hasDragState(ev)) return
    if (isInsideDroppableSurface(ev)) return
    resetDragState()
  }

  function onGlobalDragend() {
    resetDragState()
  }

  function onGlobalKeydown(ev: KeyboardEvent) {
    if (ev.key === 'Escape') resetDragState()
  }

  function getDropListKey(ev?: DragEvent, listKey?: BuilderFieldListKey | null) {
    return (ev ? getStructureCanvasListKey(ev) : null) || listKey || targetListKey.value || formStore.getActiveListKey
  }

  function getRootStructureLabel(tool?: FormKitSchemaNode | FormKitSchemaDefinition | null) {
    return tool?.$formkit === 'q-stepper' ? 'Passos' : 'Abas'
  }

  function getRootFieldsList() {
    return formStore.resolveFieldList?.('root') || formStore.formFields || []
  }

  function getRootOnlyStructureChildListKey(): BuilderFieldListKey | null {
    const rootOnlyStructure = formStore.getRootOnlyStructure?.()
    if (!rootOnlyStructure?.name) return null
    return formStore.getDefaultStructureListKey?.(rootOnlyStructure.name) || null
  }

  function resolveDropListKeyForField(dropListKey: BuilderFieldListKey, field?: FormKitSchemaDefinition | FormKitSchemaNode | null) {
    if (dropListKey !== 'root') return dropListKey
    if (!formStore.hasRootOnlyStructure) return dropListKey
    if (formStore.isRootOnlyStructure?.(field)) return dropListKey
    return getRootOnlyStructureChildListKey() || dropListKey
  }

  function clearInsertionTarget() {
    indexPointer.value = null
    dragInIndicator.value = {}
    targetListKey.value = originalListKey.value
  }

  function isExplicitDropTarget(ev: DragEvent) {
    return Boolean(getDragEventTargetElement(ev)?.closest(explicitDropTargetSelector))
  }

  function getStructureCanvasListKey(ev: Event): BuilderFieldListKey | null {
    const target = getDragEventTargetElement(ev)
    const structureCanvas = target?.closest('[data-structure-list-key]')
    const listKey = structureCanvas?.getAttribute('data-structure-list-key')
    return listKey ? listKey as BuilderFieldListKey : null
  }

  function isEmptyStructureList(listKey: BuilderFieldListKey) {
    const fieldsList = formStore.resolveFieldList(listKey) || []
    return fieldsList.length === 0
  }

  function isInternalStructureDropSurface(ev: Event, listKey = getStructureCanvasListKey(ev)) {
    if (!listKey) return false

    const target = getDragEventTargetElement(ev)
    if (!target?.closest(structureDropSurfaceSelector)) return false

    if (listKey.startsWith('children:')) {
      return isStructureBodyEvent(ev, listKey)
    }

    if (listKey.startsWith('cell:')) return true

    if ((listKey.startsWith('tab:') || listKey.startsWith('step:')) && isEmptyStructureList(listKey)) {
      return true
    }

    return false
  }

  function setRootOnlyDropTarget() {
    const firstRootField = getRootFieldsList()[0]
    targetListKey.value = 'root'
    indexPointer.value = 0
    dragInIndicator.value = {
      index: 0,
      name: firstRootField?.name,
      placement: 'top',
      listKey: 'root',
    }
  }

  function activateRootOnlyDropTarget(ev?: DragEvent) {
    if (ev && !isInsideDroppableSurface(ev)) {
      clearInsertionTarget()
      isUserDraggingOver.value = false
      highlightDropArea.value = false
      return false
    }

    setRootOnlyDropTarget()
    isUserDraggingOver.value = true
    return true
  }

  function placeRootOnlyStructure(tool: FormKitSchemaNode) {
    if (formStore.hasRootOnlyStructure) {
      confirmRootStructureReplacement(tool)
    }
    else {
      formStore.replaceRootOnlyStructure(tool)
      clearFieldSelection()
    }
  }

  function confirmRootStructureReplacement(tool: FormKitSchemaNode) {
    const currentStructure = formStore.getRootOnlyStructure?.()
    const currentLabel = getRootStructureLabel(currentStructure)
    const nextLabel = getRootStructureLabel(tool)
    const nextLabelLower = nextLabel.toLowerCase()

    $q.dialog({
      title: currentStructure?.$formkit === tool.$formkit
        ? `Substituir estrutura de ${nextLabelLower}?`
        : `Substituir ${currentLabel} por ${nextLabel}?`,
      message: `A estrutura atual será substituída por ${nextLabel}. Os campos internos serão preservados dentro da nova estrutura.`,
      cancel: { label: 'Cancelar', flat: true },
      ok: { label: 'Substituir', color: 'negative' },
      persistent: true,
    }).onOk(() => {
      formStore.replaceRootOnlyStructure(tool)
      clearFieldSelection()
    })
  }

  function isSidePlacement(placement?: BuilderDragPlacement): placement is Extract<BuilderDragPlacement, 'left' | 'right'> {
    return placement === 'left' || placement === 'right'
  }

  function isInsidePlacement(placement?: BuilderDragPlacement): placement is 'inside' {
    return placement === 'inside'
  }

  function getSideDropTarget() {
    const placement = dragInIndicator.value.placement
    const targetName = dragInIndicator.value.name
    if (!isSidePlacement(placement) || !targetName) return null
    return { placement, targetName }
  }

  function hasActiveInsertionIndicator() {
    return Boolean(dragInIndicator.value.placement)
  }

  function isEmptyListDropTarget(dropListKey: BuilderFieldListKey) {
    if (targetListKey.value !== dropListKey) return false
    const fieldsList = formStore.resolveFieldList(dropListKey) || []
    return fieldsList.length === 0
  }

  function activateExplicitEmptyDropTarget(dropListKey: BuilderFieldListKey) {
    const fieldsList = formStore.resolveFieldList(dropListKey) || []
    if (fieldsList.length) return
    indexPointer.value = null
    targetListKey.value = dropListKey
    dragInIndicator.value = {}
  }

  function isStructureBodyAppendTarget(dropListKey: BuilderFieldListKey) {
    return dropListKey.startsWith('children:') && targetListKey.value === dropListKey
  }

  function getEventFieldName(ev: DragEvent) {
    const target = ev.target
    if (!(target instanceof HTMLElement)) return ''
    return target.closest('[data-field-name]')?.getAttribute('data-field-name') || ''
  }

  function isDraggingOverOriginalField(ev: DragEvent) {
    const draggedFieldName = (elementBeingDragged.value.field as any)?.name || ''
    return Boolean(draggedFieldName && getEventFieldName(ev) === draggedFieldName)
  }

  function isStructureBodyEvent(ev: Event, dropListKey: BuilderFieldListKey) {
    const target = getDragEventTargetElement(ev)
    if (!target) return false

    const structureCanvas = target.closest('[data-structure-list-key]')
    if (structureCanvas?.getAttribute('data-structure-list-key') !== dropListKey) return false

    const nestedField = target.closest('[data-field-name]')
    return !nestedField || !structureCanvas.contains(nestedField)
  }

  function isAppendableStructureBodyEvent(ev: DragEvent, dropListKey: BuilderFieldListKey) {
    return dropListKey.startsWith('children:') && isStructureBodyEvent(ev, dropListKey)
  }

  function activateStructureBodyAppendTarget(dropListKey: BuilderFieldListKey) {
    indexPointer.value = null
    targetListKey.value = dropListKey
    dragInIndicator.value = {}
  }

  function hasOccupiedCellReplacementTarget(dropListKey: BuilderFieldListKey) {
    return dropListKey.startsWith('cell:')
      && dragInIndicator.value.listKey === dropListKey
      && Boolean(dragInIndicator.value.name && dragInIndicator.value.placement)
  }

  function activateDropTargetFromEvent(ev: DragEvent, dropListKey: BuilderFieldListKey) {
    if (hasOccupiedCellReplacementTarget(dropListKey)) return
    if (!isInternalStructureDropSurface(ev, dropListKey)) return

    activateStructureBodyAppendTarget(dropListKey)
  }

  function canUseCurrentDropTarget(dropListKey: BuilderFieldListKey, field?: FormKitSchemaDefinition | FormKitSchemaNode | null) {
    if (formStore.isRootOnlyStructure?.(field)) {
      if (dropListKey !== 'root') return false
      const rootFields = getRootFieldsList()
      if (!rootFields.length) return isEmptyListDropTarget('root')
      return dragInIndicator.value.listKey === 'root'
        && dragInIndicator.value.placement === 'top'
        && dragInIndicator.value.index === 0
    }

    if (hasActiveInsertionIndicator()) return true

    const targetDropListKey = resolveDropListKeyForField(dropListKey, field)
    return isEmptyListDropTarget(targetDropListKey) || isStructureBodyAppendTarget(targetDropListKey)
  }

  function moveInternalField(fieldName: string, dropListKey: BuilderFieldListKey) {
    const field = formStore.getFieldByName?.(fieldName) || elementBeingDragged.value.field as FormKitSchemaDefinition | undefined
    const targetDropListKey = resolveDropListKeyForField(dropListKey, field)
    if (targetDropListKey !== dropListKey) {
      clearInsertionTarget()
    }

    const sideDropTarget = getSideDropTarget()
    if (sideDropTarget && targetDropListKey === dropListKey) {
      return formStore.moveFieldBeside(fieldName, sideDropTarget.targetName, sideDropTarget.placement, targetDropListKey)
    }

    return formStore.moveFieldToList(fieldName, targetDropListKey, indexPointer.value)
  }

  function addCatalogField(tool: FormKitSchemaNode, dropListKey: BuilderFieldListKey) {
    const targetDropListKey = resolveDropListKeyForField(dropListKey, tool)
    if (targetDropListKey !== dropListKey) {
      clearInsertionTarget()
    }

    const sideDropTarget = getSideDropTarget()
    if (sideDropTarget && targetDropListKey === dropListKey) {
      return formStore.addFieldBeside(tool, sideDropTarget.targetName, sideDropTarget.placement, targetDropListKey)
    }

    return formStore.addField(tool, indexPointer.value, targetDropListKey)
  }

  function onDrop(ev: DragEvent, listKey?: BuilderFieldListKey | null) {
    const toolData = ev.dataTransfer?.getData('text')
    const internalFieldName = ev.dataTransfer?.getData(builderDragMime.fieldName) || (elementBeingDragged.value.field as any)?.name
    const dropListKey = getDropListKey(ev, listKey)

    if (!toolData && internalFieldName && dropListKey) {
      const internalField = formStore.getFieldByName?.(internalFieldName) || elementBeingDragged.value.field as FormKitSchemaDefinition | undefined
      if (!formStore.isRootOnlyStructure?.(internalField)) {
        if (listKey) activateExplicitEmptyDropTarget(dropListKey)
        activateDropTargetFromEvent(ev, dropListKey)
      }
      if (isAppendableStructureBodyEvent(ev, dropListKey)) {
        activateStructureBodyAppendTarget(dropListKey)
      }
      if (!canUseCurrentDropTarget(dropListKey, internalField)) {
        resetDragState()
        return
      }
      const moved = moveInternalField(internalFieldName, dropListKey)
      if (moved !== false) {
        clearFieldSelection()
      }
      resetDragState()
      return
    }

    if (toolData) {
      try {
        const tool: FormKitSchemaNode = JSON.parse(toolData)
        if (formStore.isRootOnlyStructure?.(tool)) {
          if (!canUseCurrentDropTarget('root', tool)) return
          placeRootOnlyStructure(tool)
          return
        }
        if (listKey) activateExplicitEmptyDropTarget(dropListKey)
        activateDropTargetFromEvent(ev, dropListKey)
        if (isAppendableStructureBodyEvent(ev, dropListKey)) {
          activateStructureBodyAppendTarget(dropListKey)
        }
        if (!canUseCurrentDropTarget(dropListKey, tool)) return
        addCatalogField(tool, dropListKey)
      }
      catch {
        // silent error
      }
      finally {
        resetDragState()
      }
    }
  }

  function onDragStartField(field: any, index: number, ev?: DragEvent, listKey?: BuilderFieldListKey | null) {
    ev?.dataTransfer?.setData(builderDragMime.fieldName, field?.name || '')
    markBuilderDragType(ev?.dataTransfer, field)
    originalFieldIndex.value = index
    originalStepName.value = formStore.hasStepper ? formStore.activeStepName : null
    targetStepName.value = originalStepName.value
    originalListKey.value = listKey || formStore.getFieldListKeyByName(field?.name) || formStore.getActiveListKey
    targetListKey.value = originalListKey.value
    elementBeingDragged.value = { field, index }
    isDraggingStepper.value = field?.$formkit === 'q-stepper'
    isDraggingRootOnlyStructure.value = Boolean(formStore.isRootOnlyStructure?.(field))
  }

  function updateDraggingFlagsFromEvent(ev: DragEvent) {
    if (hasRootOnlyBuilderDrag(ev.dataTransfer)) {
      const markedType = getBuilderDragFormKitType(ev.dataTransfer)
      isDraggingStepper.value = markedType === 'q-stepper'
      isDraggingRootOnlyStructure.value = true
      return
    }

    const markedType = getBuilderDragFormKitType(ev.dataTransfer)
    if (markedType) {
      isDraggingStepper.value = markedType === 'q-stepper'
      isDraggingRootOnlyStructure.value = isRootOnlyBuilderType(markedType)
      return
    }

    const toolData = ev.dataTransfer?.getData('text')
    if (!toolData) {
      const draggedField = elementBeingDragged.value.field as any
      isDraggingStepper.value = draggedField?.$formkit === 'q-stepper'
      isDraggingRootOnlyStructure.value = Boolean(draggedField && formStore.isRootOnlyStructure?.(draggedField))
      return
    }
    try {
      const tool = JSON.parse(toolData)
      isDraggingStepper.value = tool?.$formkit === 'q-stepper'
      isDraggingRootOnlyStructure.value = ['q-stepper', 'q-tabs'].includes(String(tool?.$formkit || ''))
    }
    catch {
      isDraggingStepper.value = false
      isDraggingRootOnlyStructure.value = false
    }
  }

  function handleDragover(ev: DragEvent) {
    isUserDraggingOver.value = true
    updateDraggingFlagsFromEvent(ev)
    if (isDraggingRootOnlyStructure.value) {
      activateRootOnlyDropTarget(ev)
      return
    }
    if (!isExplicitDropTarget(ev)) {
      if (!isInternalStructureDropSurface(ev)) {
        clearInsertionTarget()
      }
    }
  }

  function onDragEnterInDropArea(e: DragEvent, fieldName: string | undefined, index: number, placement: BuilderDragPlacement = 'top', listKey?: BuilderFieldListKey | null) {
    isUserDraggingOver.value = true
    updateDraggingFlagsFromEvent(e)
    const dropListKey = listKey || targetListKey.value || formStore.getFieldListKeyByName(fieldName || '') || formStore.getActiveListKey
    const fieldsList = formStore.resolveFieldList(dropListKey) || []

    if (isDraggingRootOnlyStructure.value) {
      activateRootOnlyDropTarget(e)
      return
    }

    if (isInsidePlacement(placement)) {
      const childListKey = formStore.getDefaultStructureListKey?.(fieldName)
      if (!childListKey || !fieldName) return

      indexPointer.value = null
      targetListKey.value = childListKey
      dragInIndicator.value = { index, name: fieldName, placement, listKey: dropListKey }
      return
    }

    if (isSidePlacement(placement)) {
      const targetIndex = fieldsList.findIndex((field: any) => field?.name === fieldName)
      if (targetIndex < 0 || !fieldName) return

      const destinationIndex = placement === 'left' ? targetIndex : targetIndex + 1
      const isSameTarget = dragInIndicator.value.index === destinationIndex
        && dragInIndicator.value.name === fieldName
        && dragInIndicator.value.placement === placement
        && dragInIndicator.value.listKey === dropListKey

      indexPointer.value = destinationIndex
      targetListKey.value = dropListKey
      if (isSameTarget) return
      dragInIndicator.value = { index: destinationIndex, name: fieldName, placement, listKey: dropListKey }
      return
    }

    const nextField = placement === 'bottom' ? fieldsList[index] : null
    const indicatorName = nextField?.name || fieldName
    const indicatorPlacement: 'top' | 'bottom' = nextField?.name ? 'top' : placement
    const isSameTarget = dragInIndicator.value.index === index
      && dragInIndicator.value.name === indicatorName
      && dragInIndicator.value.placement === indicatorPlacement
      && dragInIndicator.value.listKey === dropListKey
    indexPointer.value = index
    targetListKey.value = dropListKey
    if (isSameTarget) return
    dragInIndicator.value = { index, name: indicatorName, placement: indicatorPlacement, listKey: dropListKey }
  }

  function onDragOverDropArea(_e: DragEvent, listKey?: BuilderFieldListKey | null) {
    updateDraggingFlagsFromEvent(_e)
    if (isDraggingRootOnlyStructure.value) {
      activateRootOnlyDropTarget(_e)
      return
    }

    if (isDraggingOverOriginalField(_e)) {
      clearInsertionTarget()
      return
    }
    const dropListKey = listKey || targetListKey.value || formStore.getActiveListKey
    if (isAppendableStructureBodyEvent(_e, dropListKey)) {
      activateStructureBodyAppendTarget(dropListKey)
      return
    }
    if (!isExplicitDropTarget(_e) && !isInternalStructureDropSurface(_e, dropListKey)) {
      clearInsertionTarget()
      return
    }
    if (isInsidePlacement(dragInIndicator.value.placement)) return
    targetListKey.value = dropListKey
  }

  function onDragEnd(index: number) {
    if (!elementBeingDragged.value.field && originalFieldIndex.value === null) {
      resetDragState()
      return
    }

    const draggedField = elementBeingDragged.value.field || formStore.activeFields[index]
    const fieldName = (draggedField as any)?.name
    const dropListKey = targetListKey.value || originalListKey.value || formStore.getActiveListKey
    const hasValidDropTarget = hasActiveInsertionIndicator()
      || isEmptyListDropTarget(dropListKey)
      || isStructureBodyAppendTarget(dropListKey)

    if (!hasValidDropTarget) {
      resetDragState()
      return
    }

    if (fieldName && dropListKey && (originalListKey.value !== dropListKey || indexPointer.value !== null)) {
      const moved = moveInternalField(fieldName, dropListKey)
      if (moved !== false) {
        clearFieldSelection()
      }
    }
    else if (originalFieldIndex.value !== null && indexPointer.value !== null && originalFieldIndex.value !== indexPointer.value) {
      formStore.updateFieldIndex({ draggedField, originalPosition: index, destinationIndex: indexPointer.value })
    }

    resetDragState()
  }

  function onClickAtFormElement(index: number, listKey?: BuilderFieldListKey | null) {
    const fieldsList = formStore.resolveFieldList(listKey) || formStore.activeFields
    const field = fieldsList.find((_: any, idx: number) => idx === index) || null
    setActiveStepConfig(null)
    setActiveTabConfig(null)
    setActiveField(field)
  }

  function onMouseOverAtFormElement(field: any) {
    hoverName.value = field?.name || ''
  }

  function onMouseLeaveAtFormElement() {
    hoverName.value = ''
  }

  function onDragEnterStepHeader(stepName: string) {
    if (isDraggingRootOnlyStructure.value) {
      activateRootOnlyDropTarget()
      isUserDraggingOver.value = true
      return
    }
    if (!formStore.hasStepper || !elementBeingDragged.value.field) return
    targetStepName.value = stepName
    targetListKey.value = `step:${stepName}`
    indexPointer.value = null
    dragInIndicator.value = {}
    setActiveTabConfig(null)
    if (formStore.activeStepName !== stepName) {
      formStore.setActiveStep(stepName)
    }
    isUserDraggingOver.value = true
  }

  function onDropOnStepHeader(stepName: string, fallbackFieldName?: string) {
    const fieldName = (elementBeingDragged.value.field as any)?.name || fallbackFieldName
    if (!formStore.hasStepper || !fieldName || originalListKey.value === `step:${stepName}`) {
      resetDragState()
      return
    }
    const moved = formStore.moveFieldToList(fieldName, `step:${stepName}`, null)
    if (moved !== false) {
      clearFieldSelection()
    }
    resetDragState()
  }

  function onDragEnterContainer(listKey: BuilderFieldListKey) {
    if (isDraggingRootOnlyStructure.value) {
      activateRootOnlyDropTarget()
      return
    }
    targetListKey.value = listKey
    indexPointer.value = null
    dragInIndicator.value = {}
    isUserDraggingOver.value = true
  }

  function onDropOnContainer(listKey: BuilderFieldListKey, fallbackFieldName?: string) {
    const fieldName = (elementBeingDragged.value.field as any)?.name || fallbackFieldName
    if (!fieldName || originalListKey.value === listKey) {
      resetDragState()
      return
    }
    const moved = formStore.moveFieldToList(fieldName, listKey, null)
    if (moved !== false) {
      clearFieldSelection()
    }
    resetDragState()
  }

  function handleCopyField(field: any, index: number, listKey?: BuilderFieldListKey | null) {
    copyField(index, field, listKey)
  }

  function removeField(field: any, index: number) {
    formStore.removeField(field, index)
    if (formStore.activeField?.name === field?.name) {
      setActiveField(null)
    }
  }

  function resize(event: MouseEvent) {
    if (!isDragging.value) return

    const wrapperElement = document.querySelector('.my-form-wrapper') as HTMLElement
    const containerWidth = wrapperElement.getBoundingClientRect().width || getUserWidthInput.value
    const columnWidth = containerWidth / 12
    const deltaX = event.clientX - startX.value
    const deltaColumns = Math.round(deltaX / columnWidth)
    const direction = deltaColumns > lastDeltaColumns.value ? 1 : -1

    const columnChange = formStore.getActiveFieldColumns + direction
    const newColumns = Math.max(1, Math.min(12, columnChange))

    if (newColumns !== formStore.getActiveFieldColumns && lastDeltaColumns.value !== deltaColumns) {
      lastDeltaColumns.value = deltaColumns
      updateActiveFieldColumns(newColumns, false)
    }
  }

  function startResize(evt: MouseEvent, field: any) {
    const canonicalField = field?.name ? formStore.getFieldByName?.(field.name) : null
    setActiveStepConfig(null)
    setActiveTabConfig(null)
    setActiveField(canonicalField || field)
    isDragging.value = true
    startX.value = evt.clientX
    document.addEventListener('mousemove', throttleResize)
    document.addEventListener('mouseup', stopResize)
  }

  function throttleResize(event: MouseEvent) {
    requestAnimationFrame(() => resize(event))
  }

  function stopResize() {
    isDragging.value = false
    lastDeltaColumns.value = 0
    updateActiveFieldOnFormFields()
    document.removeEventListener('mousemove', throttleResize)
    document.removeEventListener('mouseup', stopResize)
  }

  onMounted(() => {
    window.addEventListener('dragover', onGlobalDragover)
    window.addEventListener('drop', onGlobalDrop)
    window.addEventListener('dragend', onGlobalDragend)
    window.addEventListener('keydown', onGlobalKeydown)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('dragover', onGlobalDragover)
    window.removeEventListener('drop', onGlobalDrop)
    window.removeEventListener('dragend', onGlobalDragend)
    window.removeEventListener('keydown', onGlobalKeydown)
  })

  return {
    // refs
    highlightDropArea,
    previewFormSectionRef,
    formDroppableRef,
    formRefComponent,
    indexPointer,
    elementBeingDragged,
    originalFieldIndex,
    originalStepName,
    targetStepName,
    originalListKey,
    targetListKey,
    activeNameFields,
    dragInIndicator,
    isUserDraggingOver,
    isDragging,
    isDraggingStepper,
    isDraggingRootOnlyStructure,
    startX,
    lastDeltaColumns,
    // computed
    getUserWidthInput,
    // methods
    onDragEnterFormSectionArea,
    onDragLeaveFormSectionArea,
    resetDragState,
    onDrop,
    onDragStartField,
    handleDragover,
    onDragEnterInDropArea,
    onDragOverDropArea,
    onDragEnd,
    onClickAtFormElement,
    onMouseOverAtFormElement,
    onMouseLeaveAtFormElement,
    onDragEnterStepHeader,
    onDropOnStepHeader,
    onDragEnterContainer,
    onDropOnContainer,
    handleCopyField,
    removeField,
    startResize,
    throttleResize,
    stopResize,
  }
}
