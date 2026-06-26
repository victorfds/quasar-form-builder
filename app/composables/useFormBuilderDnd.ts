import type { FormKitSchemaDefinition, FormKitSchemaNode } from '@formkit/core'
import type { BuilderDragPlacement, BuilderFieldListKey } from '~/types'

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
      || eventTypes.includes('text')
      || eventTypes.includes('application/x-builder-field'),
    )
  }

  function isInsideBuilderSurface(ev: Event) {
    const target = ev.target
    if (!(target instanceof Node)) return false
    const builderRoot = previewFormSectionRef.value
    if (builderRoot?.contains(target)) return true
    if (target instanceof HTMLElement && target.closest('[data-keep-active]')) return true
    return false
  }

  function onGlobalDragover(ev: DragEvent) {
    if (!hasDragState(ev)) return
    if (isInsideBuilderSurface(ev)) return
    clearDropTargetState()
  }

  function onGlobalDrop(ev: DragEvent) {
    if (!hasDragState(ev)) return
    if (isInsideBuilderSurface(ev)) return
    resetDragState()
  }

  function onGlobalDragend() {
    resetDragState()
  }

  function onGlobalKeydown(ev: KeyboardEvent) {
    if (ev.key === 'Escape') resetDragState()
  }

  function getDropListKey(listKey?: BuilderFieldListKey | null) {
    return targetListKey.value || listKey || formStore.getActiveListKey
  }

  function getRootStructureLabel(tool?: FormKitSchemaNode | FormKitSchemaDefinition | null) {
    return tool?.$formkit === 'q-stepper' ? 'Passos' : 'Abas'
  }

  function getRootFieldsList() {
    return formStore.resolveFieldList?.('root') || formStore.formFields || []
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

  function moveInternalField(fieldName: string, dropListKey: BuilderFieldListKey) {
    const sideDropTarget = getSideDropTarget()
    if (sideDropTarget) {
      return formStore.moveFieldBeside(fieldName, sideDropTarget.targetName, sideDropTarget.placement, dropListKey)
    }

    return formStore.moveFieldToList(fieldName, dropListKey, indexPointer.value)
  }

  function addCatalogField(tool: FormKitSchemaNode, dropListKey: BuilderFieldListKey) {
    const sideDropTarget = getSideDropTarget()
    if (sideDropTarget) {
      return formStore.addFieldBeside(tool, sideDropTarget.targetName, sideDropTarget.placement, dropListKey)
    }

    return formStore.addField(tool, indexPointer.value, dropListKey)
  }

  function onDrop(ev: DragEvent, listKey?: BuilderFieldListKey | null) {
    const toolData = ev.dataTransfer?.getData('text')
    const internalFieldName = ev.dataTransfer?.getData('application/x-builder-field') || (elementBeingDragged.value.field as any)?.name
    const dropListKey = getDropListKey(listKey)

    if (!toolData && internalFieldName && dropListKey) {
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
          setRootOnlyDropTarget()
          placeRootOnlyStructure(tool)
          return
        }
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
    ev?.dataTransfer?.setData('application/x-builder-field', field?.name || '')
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
  }

  function onDragEnterInDropArea(e: DragEvent, fieldName: string | undefined, index: number, placement: BuilderDragPlacement = 'top', listKey?: BuilderFieldListKey | null) {
    isUserDraggingOver.value = true
    updateDraggingFlagsFromEvent(e)
    const dropListKey = listKey || targetListKey.value || formStore.getFieldListKeyByName(fieldName || '') || formStore.getActiveListKey
    const fieldsList = formStore.resolveFieldList(dropListKey) || []

    if (isDraggingRootOnlyStructure.value) {
      setRootOnlyDropTarget()
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
    if (isDraggingRootOnlyStructure.value) {
      setRootOnlyDropTarget()
      return
    }
    if (isInsidePlacement(dragInIndicator.value.placement)) return
    targetListKey.value = listKey || targetListKey.value || formStore.getActiveListKey
    if (originalFieldIndex.value === null && !elementBeingDragged.value.field && elementBeingDragged.value.index === undefined) {
      const fieldsList = formStore.resolveFieldList(targetListKey.value) || formStore.activeFields
      elementBeingDragged.value.index = fieldsList.length
      // keep last element name for UI purposes
      elementBeingDragged.value.field = fieldsList.at(-1)?.name as unknown as FormKitSchemaDefinition
    }
  }

  function onDragEnd(index: number) {
    if (!elementBeingDragged.value.field && originalFieldIndex.value === null) {
      resetDragState()
      return
    }

    const draggedField = elementBeingDragged.value.field || formStore.activeFields[index]
    const fieldName = (draggedField as any)?.name
    const dropListKey = targetListKey.value || originalListKey.value || formStore.getActiveListKey

    if (fieldName && dropListKey && (originalListKey.value !== dropListKey || indexPointer.value !== null)) {
      const sideDropTarget = getSideDropTarget()
      const moved = sideDropTarget
        ? formStore.moveFieldBeside(fieldName, sideDropTarget.targetName, sideDropTarget.placement, dropListKey)
        : formStore.moveFieldToList(fieldName, dropListKey, indexPointer.value)
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
    setActiveField(field)
    setActiveStepConfig(null)
    setActiveTabConfig(null)
  }

  function onMouseOverAtFormElement(field: any) {
    hoverName.value = field?.name || ''
  }

  function onMouseLeaveAtFormElement() {
    hoverName.value = ''
  }

  function onDragEnterStepHeader(stepName: string) {
    if (isDraggingRootOnlyStructure.value) {
      setRootOnlyDropTarget()
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
      setRootOnlyDropTarget()
      isUserDraggingOver.value = true
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
    setActiveField(canonicalField || field)
    setActiveStepConfig(null)
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
