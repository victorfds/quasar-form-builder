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
  emptyText: 'Arraste e solte aqui',
})

const formStore = useFormStore()
const fieldUi = useFieldUi()
const schemaData = inject(schemaDataKey, computed(() => ({})))
const builderMode = inject(builderModeKey, false)
const builderDnd = inject(formBuilderDndKey, null) as Record<string, any> | null

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

function getFieldClasses(field: BuilderStructureField) {
  return [
    fieldUi.getAlignClass(field as any),
    hasCondition(field) && isPreviewEditing.value ? 'opacity-50' : '',
  ]
}

function getFieldStyle(field: BuilderStructureField) {
  return fieldUi.getGridColumnStyle(field as any)
}

const isDraggingRootOnlyStructure = computed(() => Boolean(dndState.value.isDraggingRootOnlyStructure))
const isCellList = computed(() => props.listKey.startsWith('cell:'))
const isOccupiedCell = computed(() => isCellList.value && displayFields.value.length > 0)
const isDropZoneActive = computed(() =>
  canDrag.value
  && !isDraggingRootOnlyStructure.value
  && !isOccupiedCell.value
  && dndState.value.targetListKey === props.listKey
  && !dndState.value.dragInIndicator?.placement,
)
const showStructureDropZone = computed(() =>
  canDrag.value
  && !isDraggingRootOnlyStructure.value
  && !isOccupiedCell.value
  && (dndState.value.isUserDraggingOver || isDropZoneActive.value),
)

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

function onDragenter(ev: DragEvent) {
  refreshDragState(ev)
  if (!canAcceptDrop()) return
  builderDnd?.onDragEnterContainer?.(props.listKey)
  if (activateOccupiedCellReplacement(ev)) return
  builderDnd?.onDragEnterFormSectionArea?.(ev)
}

function onDragover(ev: DragEvent) {
  refreshDragState(ev)
  if (!canAcceptDrop()) return
  if (activateOccupiedCellReplacement(ev)) return
  builderDnd?.onDragOverDropArea?.(ev, props.listKey)
}

function onDrop(ev: DragEvent) {
  refreshDragState(ev)
  if (!canAcceptDrop()) {
    builderDnd?.resetDragState?.()
    return
  }
  builderDnd?.onDrop?.(ev, props.listKey)
}
</script>

<template>
  <FormCanvas
    :droppable="canDrag"
    :empty="false"
    :data-structure-list-key="listKey"
    :class="{ 'form-canvas--cell-list': isCellList }"
    :empty-text="emptyText"
    @drop="onDrop"
    @dragover="onDragover"
    @dragenter="onDragenter"
    @dragleave="builderDnd?.onDragLeaveFormSectionArea"
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

    <div
      v-if="canDrag"
      class="structure-drop-zone span-12"
      :class="{
        'structure-drop-zone--visible': showStructureDropZone,
        'structure-drop-zone--interactive': dndState.isUserDraggingOver || isDropZoneActive,
        'structure-drop-zone--empty': !displayFields.length,
        'structure-drop-zone--active': isDropZoneActive,
      }"
      @dragenter.prevent.stop="onDragenter"
      @dragover.prevent.stop="onDragover"
      @drop.prevent.stop="onDrop"
    >
      <div class="structure-drop-zone__label" aria-hidden="true" />
    </div>
  </FormCanvas>
</template>

<style scoped>
.structure-drop-zone {
  align-items: center;
  background: rgba(129, 212, 250, .18);
  border: 1px dashed rgba(69, 140, 163, .5);
  border-radius: 6px;
  box-sizing: border-box;
  color: #5a9eb0;
  display: flex;
  grid-column: 1 / -1;
  height: 0;
  justify-content: center;
  margin: 0;
  max-width: 100%;
  min-height: 0;
  min-width: 0;
  opacity: 0;
  overflow: visible;
  padding: 0;
  pointer-events: none;
  position: relative;
  transition: opacity .12s ease, min-height .12s ease, margin .12s ease, padding .12s ease;
  visibility: hidden;
  z-index: 8;
}

.structure-drop-zone--visible {
  height: auto;
  margin: .25rem 0;
  min-height: 2.75rem;
  opacity: 1;
  padding: .5rem;
  visibility: visible;
}

.structure-drop-zone--interactive {
  pointer-events: auto;
}

.structure-drop-zone--visible.structure-drop-zone--empty {
  min-height: 5rem;
}

.structure-drop-zone--active {
  background: rgba(168, 36, 84, .1);
  border-color: #a82454;
  color: #a82454;
}

.structure-drop-zone__label {
  background: #a82454;
  border-radius: 9999px;
  box-sizing: border-box;
  height: .1875rem;
  width: 2.5rem;
  max-width: 100%;
  overflow: hidden;
  padding: 0;
  pointer-events: none;
}
</style>
