<script setup lang="ts">
import type { BuilderFieldListKey, ColumnsType } from '#qfb/types'
import type { FormKitSchemaDefinition } from '@formkit/core'
import { builderModeKey, formBuilderDndKey, schemaDataKey } from '#qfb/constants/injectionKeys'

type BuilderStructureField = FormKitSchemaDefinition & {
  name?: string
  columns?: ColumnsType & Record<string, any>
  align?: 'left' | 'center' | 'right'
  $el?: string
  label?: string
  info?: string
  description?: string
  hasCondition?: boolean
}

const props = withDefaults(defineProps<{
  fields?: BuilderStructureField[]
  listKey: BuilderFieldListKey
  emptyText?: string
}>(), {
  fields: () => [],
  emptyText: '',
})

const formStore = useFormStore()
const fieldUi = useFieldUi()
const schemaData = inject(schemaDataKey, computed(() => ({})))
const builderMode = inject(builderModeKey, false)
const builderDnd = inject(formBuilderDndKey, null) as Record<string, any> | null
const isLocalDragOver = shallowRef(false)

const isPreviewEditing = computed(() => builderMode && formStore.formSettings.previewMode === 'editing')
const canDrag = computed(() => Boolean(isPreviewEditing.value && builderDnd))
const dndState = computed(() => ({
  activeNames: unref(builderDnd?.activeNameFields)?.active || [],
  hoverName: unref(builderDnd?.activeNameFields)?.hover,
  elementBeingDragged: unref(builderDnd?.elementBeingDragged),
  isUserDraggingOver: unref(builderDnd?.isUserDraggingOver),
  dragInIndicator: unref(builderDnd?.dragInIndicator),
  targetListKey: unref(builderDnd?.targetListKey),
  listKey: props.listKey,
  isDraggingStepper: unref(builderDnd?.isDraggingStepper),
  isDraggingRootOnlyStructure: unref(builderDnd?.isDraggingRootOnlyStructure),
  hasStepper: formStore.hasStepper,
}))

const displayFields = computed(() => {
  if (!isPreviewEditing.value) return withStructureChildrenListForRender(props.fields)

  return props.fields.map((field) => {
    if (field && Object.keys(field).some(key => key.includes('if'))) {
      const { if: _if, ...rest } = field
      return withStructureChildrenForRender({ ...rest, hasCondition: true } as BuilderStructureField)
    }
    return withStructureChildrenForRender(field)
  })
})

function hasCondition(field: BuilderStructureField) {
  return Boolean(field?.hasCondition)
}

function isHiddenInputField(field: BuilderStructureField) {
  return field?.$formkit === 'q-input' && field.inputType === 'hidden'
}

function getFieldClasses(field: BuilderStructureField) {
  return [
    fieldUi.getAlignClass(field as any),
    hasCondition(field) && isPreviewEditing.value ? 'opacity-50' : '',
    isHiddenInputField(field) && !isPreviewEditing.value ? 'form-field--hidden-preview' : '',
  ]
}

function getFieldStyle(field: BuilderStructureField) {
  return fieldUi.getGridColumnStyle(field as any)
}

const isDraggingRootOnlyStructure = computed(() => Boolean(dndState.value.isDraggingRootOnlyStructure))
const isCellList = computed(() => props.listKey.startsWith('cell:'))
const hasFields = computed(() => displayFields.value.length > 0)
const isOccupiedCell = computed(() => isCellList.value && hasFields.value)
const isEmptySurfaceActive = computed(() =>
  canDrag.value
  && !isDraggingRootOnlyStructure.value
  && !isOccupiedCell.value
  && !hasFields.value
  && (dndState.value.targetListKey === props.listKey || isLocalDragOver.value)
  && !dndState.value.dragInIndicator?.placement,
)
const showEmptySurface = computed(() =>
  canDrag.value
  && !isOccupiedCell.value
  && !hasFields.value,
)
const highlightEmptySurface = computed(() => isEmptySurfaceActive.value)

watch(() => dndState.value.isUserDraggingOver, (isDraggingOver) => {
  if (!isDraggingOver) {
    isLocalDragOver.value = false
  }
})

function refreshDragState(ev: DragEvent) {
  builderDnd?.handleDragover?.(ev)
}

function canAcceptDrop() {
  return canDrag.value
}

function activateOccupiedCellReplacement(ev: DragEvent) {
  if (!isOccupiedCell.value || isDraggingRootOnlyStructure.value) return false

  const [field] = displayFields.value
  if (!field?.name) return false

  builderDnd?.onDragEnterInDropArea?.(ev, field.name, 0, 'bottom', props.listKey)
  return true
}

function hasOccupiedCellReplacementIndicator() {
  return isOccupiedCell.value
    && dndState.value.dragInIndicator?.listKey === props.listKey
    && Boolean(dndState.value.dragInIndicator?.name && dndState.value.dragInIndicator?.placement)
}

function hasExplicitInsertionIndicator() {
  return dndState.value.dragInIndicator?.listKey === props.listKey
    && Boolean(dndState.value.dragInIndicator?.name && dndState.value.dragInIndicator?.placement)
}

function onDragenter(ev: DragEvent) {
  refreshDragState(ev)
  if (!canAcceptDrop()) return
  if (isDraggingRootOnlyStructure.value) {
    isLocalDragOver.value = false
    return
  }
  isLocalDragOver.value = true
  builderDnd?.onDragEnterContainer?.(props.listKey)
  if (activateOccupiedCellReplacement(ev)) return
  builderDnd?.onDragEnterFormSectionArea?.(ev)
}

function onDragover(ev: DragEvent) {
  refreshDragState(ev)
  if (!canAcceptDrop()) return
  if (isDraggingRootOnlyStructure.value) {
    isLocalDragOver.value = false
    return
  }
  isLocalDragOver.value = true
  if (activateOccupiedCellReplacement(ev)) return
  builderDnd?.onDragOverDropArea?.(ev, props.listKey)
}

function onDragleave(ev: DragEvent) {
  const target = ev.currentTarget
  if (target instanceof HTMLElement) {
    const rect = target.getBoundingClientRect()
    const isStillInside = ev.clientX >= rect.left
      && ev.clientX <= rect.right
      && ev.clientY >= rect.top
      && ev.clientY <= rect.bottom
    if (isStillInside) return
  }

  isLocalDragOver.value = false
  builderDnd?.onDragLeaveFormSectionArea?.()
}

function onDrop(ev: DragEvent) {
  refreshDragState(ev)
  isLocalDragOver.value = false
  if (!canAcceptDrop()) {
    builderDnd?.resetDragState?.()
    return
  }
  if (!hasOccupiedCellReplacementIndicator() && !hasExplicitInsertionIndicator()) {
    builderDnd?.onDragEnterContainer?.(props.listKey)
  }
  builderDnd?.onDrop?.(ev, props.listKey)
}
</script>

<template>
  <FormCanvas
    :droppable="canDrag"
    :empty="showEmptySurface"
    :compact-empty="isCellList"
    :highlight-empty="highlightEmptySurface"
    :data-structure-list-key="listKey"
    :class="{ 'form-canvas--cell-list': isCellList }"
    :empty-text="emptyText"
    @drop="onDrop"
    @dragover="onDragover"
    @dragenter="onDragenter"
    @dragleave="onDragleave"
  >
    <div
      v-for="(field, index) in displayFields"
      :key="field?.name || index"
      class="form-field form-field--responsive"
      :data-field-name="field?.name"
      :class="getFieldClasses(field)"
      :style="getFieldStyle(field)"
      @mouseover.prevent="canDrag ? builderDnd?.onMouseOverAtFormElement(field) : undefined"
      @mouseleave.prevent="canDrag ? builderDnd?.onMouseLeaveAtFormElement() : undefined"
    >
      <WithLabelAndDescription
        v-if="field.$el"
        :label="field.label"
        :info="field.info"
        :description="field.description"
      >
        <FormKitSchema :schema="field" :data="schemaData" />
      </WithLabelAndDescription>

      <FormKitSchema v-else :schema="field" :data="schemaData" />

      <BuilderFieldOverlay
        v-if="canDrag"
        :field="field"
        :index="index"
        :state="dndState"
        :preview-mode-editing="isPreviewEditing"
        @click="idx => builderDnd?.onClickAtFormElement?.(idx, listKey)"
        @dragstart="({ field: f, index: i, ev }) => builderDnd?.onDragStartField?.(f, i, ev, listKey)"
        @dragend="builderDnd?.onDragEnd"
        @dragover="ev => builderDnd?.onDragOverDropArea?.(ev, listKey)"
        @drag-enter-top="({ ev, name, index: idx, placement }) => builderDnd?.onDragEnterInDropArea?.(ev, name || '', idx, placement, listKey)"
        @drag-enter-bottom="({ ev, name, index: idx, placement }) => builderDnd?.onDragEnterInDropArea?.(ev, name || '', idx, placement, listKey)"
        @drag-enter-left="({ ev, name, index: idx, placement }) => builderDnd?.onDragEnterInDropArea?.(ev, name || '', idx, placement, listKey)"
        @drag-enter-right="({ ev, name, index: idx, placement }) => builderDnd?.onDragEnterInDropArea?.(ev, name || '', idx, placement, listKey)"
        @copy="({ field: f, index: i }) => builderDnd?.handleCopyField?.(f, i, listKey)"
        @remove="({ field: f, index: i }) => builderDnd?.removeField?.(f, i)"
        @resize-start="({ ev, field: f }) => builderDnd?.startResize?.(ev, f)"
      />
    </div>
  </FormCanvas>
</template>
