<script setup lang="ts">
import type { FormKitSchemaDefinition } from '@formkit/core'
import type { BuilderFieldListKey, ColumnsType } from '~/types'
import { builderModeKey, formBuilderDndKey, schemaDataKey } from '~/constants/injectionKeys'

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
  return fieldUi.getGridColumnStyle(field as any, formStore.formSettings.columns)
}

const isDraggingRootOnlyStructure = computed(() => Boolean(dndState.value.isDraggingRootOnlyStructure))
const isDropZoneActive = computed(() =>
  canDrag.value
  && !isDraggingRootOnlyStructure.value
  && dndState.value.targetListKey === props.listKey
  && !dndState.value.dragInIndicator?.placement,
)
const showStructureDropZone = computed(() =>
  canDrag.value
  && !isDraggingRootOnlyStructure.value
  && (!displayFields.value.length || dndState.value.isUserDraggingOver || isDropZoneActive.value),
)

function refreshDragState(ev: DragEvent) {
  builderDnd?.handleDragover?.(ev)
}

function canAcceptDrop() {
  return canDrag.value && !unref(builderDnd?.isDraggingRootOnlyStructure)
}

function onDragenter(ev: DragEvent) {
  refreshDragState(ev)
  if (!canAcceptDrop()) return
  builderDnd?.onDragEnterContainer?.(props.listKey)
  builderDnd?.onDragEnterFormSectionArea?.(ev)
}

function onDragover(ev: DragEvent) {
  refreshDragState(ev)
  if (!canAcceptDrop()) return
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
    :empty-text="emptyText"
    @drop="onDrop"
    @dragover="onDragover"
    @dragenter="onDragenter"
    @dragleave="builderDnd?.onDragLeaveFormSectionArea"
  >
    <div
      v-for="(field, index) in displayFields"
      :key="field?.name || index"
      class="form-field"
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
      <div class="structure-drop-zone__label">
        Drag it here
      </div>
    </div>
  </FormCanvas>
</template>

<style scoped>
.structure-drop-zone {
  align-items: center;
  background: rgba(129, 212, 250, .18);
  border: 1px dashed rgba(69, 140, 163, .5);
  border-radius: 6px;
  color: #5a9eb0;
  display: flex;
  grid-column: 1 / -1;
  height: 0;
  justify-content: center;
  margin: 0;
  min-height: 0;
  opacity: 0;
  overflow: hidden;
  padding: 0;
  pointer-events: none;
  position: relative;
  transition: opacity .12s ease, min-height .12s ease, margin .12s ease, padding .12s ease;
  z-index: 4;
}

.structure-drop-zone--visible {
  height: auto;
  margin: .25rem 0;
  min-height: 2.75rem;
  opacity: 1;
  padding: .5rem;
}

.structure-drop-zone--interactive {
  pointer-events: auto;
}

.structure-drop-zone--empty {
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
  color: white;
  font-size: .8125rem;
  line-height: 1rem;
  padding: .125rem .5rem;
  pointer-events: none;
  white-space: nowrap;
}
</style>
