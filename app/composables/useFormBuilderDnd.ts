import type { FormKitSchemaDefinition, FormKitSchemaNode } from '@formkit/core'

export function useFormBuilderDnd(formStore: any) {
  const highlightDropArea = ref<boolean>(false)
  const previewFormSectionRef = ref<HTMLElement | null>(null)
  const formDroppableRef = ref<HTMLElement | null>(null)
  const formRefComponent = ref<HTMLElement | null>(null)
  const indexPointer = ref<number | null>(null)
  const elementBeingDragged = ref<{ field?: FormKitSchemaDefinition, index?: number }>({})
  const originalFieldIndex = ref<number | null>(null)
  const activeNameFields = ref<{ active: string[], hover?: string }>({ active: [] })
  const dragInIndicator = ref<{ index?: number, name?: string }>({})
  const isUserDraggingOver = ref(false)
  const isDragging = ref(true)
  const startX = ref(0)
  const lastDeltaColumns = ref(0)

  const { setActiveField, copyField, updateActiveFieldColumns, updateActiveFieldOnFormFields } = formStore

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
  }

  function onDrop(ev: DragEvent) {
    const toolData = ev.dataTransfer?.getData('text')
    if (toolData) {
      try {
        const tool: FormKitSchemaNode = JSON.parse(toolData)
        formStore.addField(tool, indexPointer.value)
      } catch {
        // silent error
      } finally {
        originalFieldIndex.value = null
        indexPointer.value = null
        elementBeingDragged.value = {}
        dragInIndicator.value = {}
        isUserDraggingOver.value = false
        highlightDropArea.value = false
      }
    }
  }

  function onDragStartField(field: any, index: number) {
    originalFieldIndex.value = index
    elementBeingDragged.value = { field, index }
  }

  function handleDragover(_ev: DragEvent) {
    isUserDraggingOver.value = true
  }

  function onDragEnterInDropArea(_e: DragEvent, fieldName: string | undefined, index: number) {
    const isSameIndex = dragInIndicator.value.index === index
    dragInIndicator.value.index = index
    indexPointer.value = index
    if (!isSameIndex || !dragInIndicator.value.name) {
      dragInIndicator.value.name = fieldName
    }
  }

  function onDragOverDropArea(_e: DragEvent) {
    if (!originalFieldIndex.value && !elementBeingDragged.value.field && !elementBeingDragged.value.index) {
      elementBeingDragged.value.index = formStore.formFields.length
      // keep last element name for UI purposes
      elementBeingDragged.value.field = formStore.formFields.at(-1)?.name as unknown as FormKitSchemaDefinition
    }
  }

  function onDragEnd(index: number) {
    if (originalFieldIndex.value !== null && indexPointer.value !== null && originalFieldIndex.value !== indexPointer.value) {
      const draggedField = formStore.formFields[index]!
      formStore.updateFieldIndex({ draggedField, originalPosition: index, destinationIndex: indexPointer.value })
    }

    originalFieldIndex.value = null
    indexPointer.value = null
    elementBeingDragged.value = {}
    dragInIndicator.value = {}
    isUserDraggingOver.value = false
  }

  function onClickAtFormElement(index: number) {
    const field = formStore.formFields.find((_: any, idx: number) => idx === index) || null
    activeNameFields.value.active[0] = field?.name
    activeNameFields.value.active[1] = field?.name
    setActiveField(field)
  }

  function onMouseOverAtFormElement(field: any) {
    activeNameFields.value.hover = field?.name
  }

  function onMouseLeaveAtFormElement() {
    activeNameFields.value.hover = ''
  }

  function handleCopyField(field: any, index: number) {
    copyField(index)
    activeNameFields.value.active[0] = field?.name
    activeNameFields.value.active[1] = formStore.formFields.at(index + 1)?.name
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
      updateActiveFieldColumns(newColumns)
    }
  }

  function startResize(evt: MouseEvent, field: any) {
    setActiveField(field)
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

  return {
    // refs
    highlightDropArea,
    previewFormSectionRef,
    formDroppableRef,
    formRefComponent,
    indexPointer,
    elementBeingDragged,
    originalFieldIndex,
    activeNameFields,
    dragInIndicator,
    isUserDraggingOver,
    isDragging,
    startX,
    lastDeltaColumns,
    // computed
    getUserWidthInput,
    // methods
    onDragEnterFormSectionArea,
    onDragLeaveFormSectionArea,
    onDrop,
    onDragStartField,
    handleDragover,
    onDragEnterInDropArea,
    onDragOverDropArea,
    onDragEnd,
    onClickAtFormElement,
    onMouseOverAtFormElement,
    onMouseLeaveAtFormElement,
    handleCopyField,
    removeField,
    startResize,
    throttleResize,
    stopResize,
  }
}

