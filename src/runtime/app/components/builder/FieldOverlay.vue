<script setup lang="ts">
import type { BuilderDragPlacement } from '#qfb/types'
import type { FormKitSchemaDefinition } from '@formkit/core'
import { builderDragMime, hasRootOnlyBuilderDrag, markBuilderDragType } from '#qfb/utils/builderDrag'

interface OverlayState {
  // active and hover are based on field names for simplicity
  activeNames: string[]
  hoverName?: string
  elementBeingDragged?: { field?: FormKitSchemaDefinition, index?: number }
  isUserDraggingOver?: boolean
  dragInIndicator?: { index?: number, name?: string, placement?: BuilderDragPlacement, listKey?: string }
  listKey?: string
  isDraggingStepper?: boolean
  isDraggingRootOnlyStructure?: boolean
  hasStepper?: boolean
}

const props = defineProps<{
  field: FormKitSchemaDefinition & { name?: string }
  index: number
  state: OverlayState
  previewModeEditing: boolean
  selectionOnly?: boolean
}>()

const emit = defineEmits<{
  (e: 'click', index: number): void
  (e: 'dragstart', payload: { field: any, index: number, ev: DragEvent }): void
  (e: 'dragend', index: number): void
  (e: 'dragEnterTop', payload: { name?: string, index: number, ev: DragEvent, placement: 'top' }): void
  (e: 'dragEnterBottom', payload: { name?: string, index: number, ev: DragEvent, placement: 'bottom' }): void
  (e: 'dragEnterLeft', payload: { name?: string, index: number, ev: DragEvent, placement: 'left' }): void
  (e: 'dragEnterRight', payload: { name?: string, index: number, ev: DragEvent, placement: 'right' }): void
  (e: 'dragover', ev: DragEvent): void
  (e: 'copy', payload: { field: any, index: number }): void
  (e: 'remove', payload: { field: any, index: number }): void
  (e: 'resizeStart', payload: { ev: MouseEvent, field: any }): void
}>()

const isLatest = computed(() => !props.selectionOnly && !props.state.elementBeingDragged?.field && !props.state.elementBeingDragged?.index && props.state.activeNames.at(-1) === (props.field?.name || ''))
const isActive = computed(() => !props.state.elementBeingDragged?.field && !props.state.elementBeingDragged?.index && props.state.activeNames?.includes(props.field?.name || ''))
const isDragging = computed(() => (props.state.elementBeingDragged?.field as any)?.name === (props.field?.name || ''))
const isHover = computed(() => !isActive.value && props.state.hoverName === (props.field?.name || ''))
const isTabsHost = computed(() => props.field?.$formkit === 'q-tabs')
const isRootOnlyHost = computed(() => ['q-tabs', 'q-stepper'].includes(String(props.field?.$formkit || '')))
const isCellField = computed(() => props.state.listKey?.startsWith('cell:') === true)
const isRootList = computed(() => props.state.listKey === 'root')
const showControls = computed(() => !props.selectionOnly && !isTabsHost.value && props.previewModeEditing && (!props.state.elementBeingDragged?.field && !props.state.elementBeingDragged?.index) && (isActive.value || isHover.value))
const formStore = useFormStore()
const fieldUi = useFieldUi()
const columnSpan = computed(() => fieldUi.getColumnSpan(props.field, formStore.formSettings.columns))
const showColumnSpan = computed(() => !props.selectionOnly && !isTabsHost.value && props.previewModeEditing && (isActive.value || isHover.value))
const showCopyAction = computed(() => showControls.value && !isCellField.value)
const ignoreDropAreas = computed(() =>
  props.selectionOnly
  || (props.state.elementBeingDragged?.field as any)?.name === (props.field?.name || '')
  || (props.state.isDraggingRootOnlyStructure && props.state.listKey !== 'root'),
)
const hideDropAreas = computed(() => ignoreDropAreas.value || !props.state.isUserDraggingOver)
const isStructureHost = computed(() => ['q-container', 'q-tabs', 'q-grid', 'q-table-structure', 'q-list-structure'].includes(String(props.field?.$formkit || '')))
const showRootOnlyTop = computed(() =>
  props.state.isDraggingRootOnlyStructure === true
  && props.state.dragInIndicator?.listKey === 'root'
  && props.state.dragInIndicator?.placement === 'top'
  && props.state.dragInIndicator?.index === 0,
)
const blocksRootOnlyHostDropAreas = computed(() =>
  isRootList.value
  && isRootOnlyHost.value
  && !showRootOnlyTop.value,
)
const showTopDropArea = computed(() => {
  if (isCellField.value) return false
  if (showRootOnlyTop.value) {
    return props.index === 0 && props.state.listKey === 'root' && props.state.isUserDraggingOver
  }
  if (blocksRootOnlyHostDropAreas.value) return false
  return !hideDropAreas.value
})
const showBottomDropArea = computed(() => {
  if (isCellField.value) return false
  if (showRootOnlyTop.value) return false
  if (blocksRootOnlyHostDropAreas.value) return false
  return !hideDropAreas.value
})
const canRouteSideDrop = computed(() => !showRootOnlyTop.value && !ignoreDropAreas.value && !isRootOnlyHost.value && !isCellField.value)
const showSideDropAreas = computed(() => canRouteSideDrop.value && !hideDropAreas.value)
const matchesIndicatorList = computed(() => {
  if (!props.state.dragInIndicator?.listKey) return true
  return props.state.dragInIndicator.listKey === props.state.listKey
})
const showTopIndicator = computed(() => matchesIndicatorList.value && props.state.dragInIndicator?.name === (props.field?.name || '') && props.state.dragInIndicator?.placement === 'top')
const showBottomIndicator = computed(() => matchesIndicatorList.value && props.state.dragInIndicator?.name === (props.field?.name || '') && props.state.dragInIndicator?.placement === 'bottom')
const showLeftIndicator = computed(() => matchesIndicatorList.value && props.state.dragInIndicator?.name === (props.field?.name || '') && props.state.dragInIndicator?.placement === 'left')
const showRightIndicator = computed(() => matchesIndicatorList.value && props.state.dragInIndicator?.name === (props.field?.name || '') && props.state.dragInIndicator?.placement === 'right')
const showCellReplacementIndicator = computed(() =>
  isCellField.value
  && matchesIndicatorList.value
  && props.state.dragInIndicator?.name === (props.field?.name || '')
  && Boolean(props.state.dragInIndicator?.placement)
  && !ignoreDropAreas.value,
)

const sideDropEdgeMaxPx = 24
const sideDropEdgeRatio = 0.16

function isRootOnlyDragEvent(ev: DragEvent) {
  if (props.state.isDraggingRootOnlyStructure) return true
  if (hasRootOnlyBuilderDrag(ev.dataTransfer)) return true

  const draggedField = props.state.elementBeingDragged?.field as any
  if (draggedField && ['q-stepper', 'q-tabs'].includes(String(draggedField.$formkit || ''))) return true

  const toolData = ev.dataTransfer?.getData('text')
  if (!toolData) return false

  try {
    const tool = JSON.parse(toolData)
    return ['q-stepper', 'q-tabs'].includes(String(tool?.$formkit || ''))
  }
  catch {
    return false
  }
}

function onDragEnterTop(ev: DragEvent) {
  if (isRootOnlyDragEvent(ev)) {
    emit('dragover', ev)
    return
  }
  if (blocksRootOnlyHostDropAreas.value) return
  emit('dragEnterTop', { name: props.field?.name, index: props.index, ev, placement: 'top' })
}
function onDragEnterBottom(ev: DragEvent) {
  if (isRootOnlyDragEvent(ev)) {
    emit('dragover', ev)
    return
  }
  if (blocksRootOnlyHostDropAreas.value) return
  emit('dragEnterBottom', { name: props.field?.name, index: props.index + 1, ev, placement: 'bottom' })
}
function onDragEnterLeft(ev: DragEvent) {
  if (isRootOnlyDragEvent(ev)) {
    emit('dragover', ev)
    return
  }
  emit('dragEnterLeft', { name: props.field?.name, index: props.index, ev, placement: 'left' })
}
function onDragEnterRight(ev: DragEvent) {
  if (isRootOnlyDragEvent(ev)) {
    emit('dragover', ev)
    return
  }
  emit('dragEnterRight', { name: props.field?.name, index: props.index + 1, ev, placement: 'right' })
}

function onOverlayDragOver(ev: DragEvent) {
  if (isRootOnlyDragEvent(ev)) {
    emit('dragover', ev)
    return
  }

  if (ignoreDropAreas.value) {
    emit('dragover', ev)
    return
  }

  if (isCellField.value) {
    onDragEnterBottom(ev)
    return
  }

  const target = ev.currentTarget
  if (!(target instanceof HTMLElement)) {
    onDragEnterBottom(ev)
    return
  }

  const rect = target.getBoundingClientRect()
  const edgeSize = Math.min(sideDropEdgeMaxPx, rect.width * sideDropEdgeRatio)
  const distanceFromLeft = ev.clientX - rect.left
  const distanceFromRight = rect.right - ev.clientX

  if (canRouteSideDrop.value && distanceFromLeft >= 0 && distanceFromLeft <= edgeSize) {
    onDragEnterLeft(ev)
    return
  }

  if (canRouteSideDrop.value && distanceFromRight >= 0 && distanceFromRight <= edgeSize) {
    onDragEnterRight(ev)
    return
  }

  if (ev.clientY < rect.top + rect.height / 2) {
    onDragEnterTop(ev)
    return
  }

  onDragEnterBottom(ev)
}

function onOverlayDragStart(ev: DragEvent) {
  if (props.selectionOnly) {
    ev.preventDefault()
    return
  }
  ev.dataTransfer?.setData(builderDragMime.fieldName, props.field?.name || '')
  markBuilderDragType(ev.dataTransfer, props.field)
  emit('dragstart', { field: props.field, index: props.index, ev })
}
</script>

<template>
  <!-- Overlay preview layer for a single field -->
  <div
    class="overlay-preview-element cursor-pointer" :class="{
      '__latest': !isTabsHost && isLatest,
      '__active': !isTabsHost && isActive,
      '__dragging': isDragging,
      '__hover': !isTabsHost && isHover,
      '__replace-target': showCellReplacementIndicator,
      '__structure-host': isStructureHost,
      '__tabs-host': isTabsHost,
      'hidden': !previewModeEditing,
    }" :draggable="!selectionOnly" @click.stop="emit('click', index)"
    @dragstart="onOverlayDragStart" @dragend="emit('dragend', index)"
    @dragenter.prevent.stop="onOverlayDragOver"
    @dragover.prevent.stop="onOverlayDragOver"
  />

  <div v-if="showCellReplacementIndicator" class="preview-cell-replace-indicator" aria-hidden="true">
    <q-icon name="sync_alt" size="md" />
  </div>

  <!-- Top drop area -->
  <div
    class="preview-element-area-top" :class="{ 'hidden': !showTopDropArea, 'preview-element-area--structure-host': isStructureHost }" @dragenter.prevent.stop="onDragEnterTop"
    @dragover.prevent.stop="(e) => emit('dragover', e)"
  >
    <div
      class="preview-element-label-wrapper preview-element-label-wrapper__top"
      :class="{ hidden: !showTopIndicator || showCellReplacementIndicator }"
    >
      <div class="preview-element-label">
        Arraste aqui
      </div>
    </div>
  </div>
  <!-- Bottom drop area -->
  <div
    class="preview-element-area-bottom" :class="{ 'hidden': !showBottomDropArea, 'preview-element-area--structure-host': isStructureHost }" @dragenter.prevent.stop="onDragEnterBottom"
    @dragover.prevent.stop="(e) => emit('dragover', e)"
  >
    <div
      class="preview-element-label-wrapper preview-element-label-wrapper__bottom"
      :class="{ hidden: !showBottomIndicator || showCellReplacementIndicator }"
    >
      <div class="preview-element-label">
        Arraste aqui
      </div>
    </div>
  </div>

  <!-- Left drop area -->
  <div
    class="preview-element-area-left" :class="{ hidden: !showSideDropAreas }" @dragenter.prevent.stop="onDragEnterLeft"
    @dragover.prevent.stop="(e) => emit('dragover', e)"
  >
    <div
      class="preview-element-label-wrapper preview-element-label-wrapper__left"
      :class="{ hidden: !showLeftIndicator || showCellReplacementIndicator }"
    >
      <div class="preview-element-label preview-element-label--side">
        Arraste aqui
      </div>
    </div>
  </div>

  <!-- Right drop area -->
  <div
    class="preview-element-area-right" :class="{ hidden: !showSideDropAreas }" @dragenter.prevent.stop="onDragEnterRight"
    @dragover.prevent.stop="(e) => emit('dragover', e)"
  >
    <div
      class="preview-element-label-wrapper preview-element-label-wrapper__right"
      :class="{ hidden: !showRightIndicator || showCellReplacementIndicator }"
    >
      <div class="preview-element-label preview-element-label--side">
        Arraste aqui
      </div>
    </div>
  </div>

  <!-- Active label and actions -->
  <div v-if="showControls" class="preview-form-name" @click.stop="emit('click', index)">
    {{ field?.name }}
  </div>
  <q-icon
    v-if="showCopyAction" name="content_copy" class="preview-form-copy-action cursor-pointer"
    @click.stop="emit('copy', { field, index })"
  >
    <q-tooltip
      class="bg-dark" transition-show="fade" transition-hide="fade" anchor="top middle"
      self="bottom middle" :offset="[4, 4]"
    >
      Clonar
    </q-tooltip>
  </q-icon>
  <q-icon
    v-if="showControls" name="o_delete" class="preview-form-remove-action cursor-pointer"
    @click.stop="emit('remove', { field, index })"
  >
    <q-tooltip
      class="bg-dark" transition-show="fade" transition-hide="fade" anchor="top middle"
      self="bottom middle" :offset="[4, 4]"
    >
      Excluir
    </q-tooltip>
  </q-icon>
  <div v-if="showControls" class="preview-element-resizer-icon" />
  <div v-if="showControls" class="preview-element-resizer" @mousedown.stop="(ev: MouseEvent) => emit('resizeStart', { ev, field })" />
  <div v-if="showColumnSpan" class="preview-element-columns-display">
    <span class="text-caption text-weight-semibold q-pa-xs">{{ columnSpan }}</span>
  </div>
</template>

<style lang="scss" scoped>
.overlay-preview-element {
  border-color: transparent;
  border-style: solid;
  border-width: 1px;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;

  &.__latest {
    background-color: var(--overlay-accent-color-rgba, rgba(41, 128, 185, .4));
  }

  &.__hover {
    border-color: var(--overlay-accent-color, #2980b9);
    z-index: 1;
  }

  &.__active {
    border-color: var(--overlay-accent-color, #2980b9);
    z-index: 1;
  }

  &.__dragging {
    border-color: var(--overlay-accent-color, #2980b9);
    border-style: dashed;
    z-index: 1;
  }

  &.__replace-target {
    background-color: rgba(20, 184, 166, .26);
    border-color: #14b8a6;
    border-style: dashed;
    z-index: 5;
  }

  &.__structure-host {
    border-width: 1px;
  }

  &.__tabs-host {
    pointer-events: none;
  }
}

:global(body.qfb-builder-dragging) .overlay-preview-element.__structure-host:not(.__dragging):not(.__replace-target) {
  pointer-events: none;
}

:global(body.qfb-builder-dragging .q-notification) {
  pointer-events: none;
}

.preview-cell-replace-indicator {
  align-items: center;
  background: rgba(20, 184, 166, .3);
  border-radius: 9999px;
  color: #14b8a6;
  display: flex;
  height: 2.75rem;
  justify-content: center;
  left: 50%;
  pointer-events: none;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 2.75rem;
  z-index: 6;
}

.preview-element-area-top {
  position: absolute;
  top: -1.25rem;
  left: 0;
  right: 0;
  height: 1.25rem;
  z-index: 3;
}

.preview-element-area-bottom {
  position: absolute;
  bottom: -1.25rem;
  left: 0;
  right: 0;
  height: 1.25rem;
  z-index: 3;
}

.preview-element-area-left,
.preview-element-area-right {
  bottom: 0;
  box-sizing: border-box;
  max-width: 1.5rem;
  min-width: 0;
  overflow: visible;
  position: absolute;
  top: 0;
  width: min(1.5rem, 16%);
  z-index: 4;
}

.preview-element-area-left {
  left: 0;
}

.preview-element-area-right {
  right: 0;
}

.preview-element-label-wrapper {
  pointer-events: none;
  position: absolute;
  height: .1875rem;
  border-radius: 9999px;
  background-color: var(--overlay-accent-color, #2980b9);
  z-index: 6;

  &__bottom {
    left: 0;
    right: 0;
    top: 50%;
    translate: 0 -50%;
  }

  &__top {
    left: 0;
    right: 0;
    top: 50%;
    translate: 0 -50%;
  }

  &__left,
  &__right {
    bottom: 0;
    height: auto;
    top: 0;
    width: .1875rem;
  }

  &__left {
    left: -.1875rem;
  }

  &__right {
    right: -.1875rem;
  }

  .preview-element-label {
    background-color: var(--overlay-accent-color, #2980b9);
    border-radius: 9999px;
    color: white;
    font-size: .75rem;
    left: 50%;
    line-height: .875rem;
    padding: .125rem .5rem;
    position: absolute;
    text-wrap: nowrap;
    top: 50%;
    transform: translate(-50%, -50%);
    width: fit-content;
  }

  .preview-element-label--side {
    display: block;
    font-size: .75rem;
    line-height: .875rem;
    padding: .125rem .5rem;
    transform: translate(-50%, -50%);
  }
}

.preview-element-label-wrapper__left .preview-element-label--side {
  left: 0;
  transform: translateY(-50%);
}

.preview-element-label-wrapper__right .preview-element-label--side {
  left: auto;
  right: 0;
  transform: translateY(-50%);
}

.preview-form-name {
  background-color: var(--overlay-accent-color, #2980b9);
  top: 0;
  left: 0;
  color: white;
  width: fit-content;
  height: fit-content;
  max-width: 100%;
  padding: 4px;
  position: absolute;
  overflow: hidden;
  z-index: 5;
  transform: translateY(-100%);
}

.preview-form-copy-action {
  position: absolute;
  background-color: var(--overlay-accent-color, #2980b9);
  color: white;
  top: 0;
  right: 1.5rem;
  width: fit-content;
  height: fit-content;
  padding: 4px;
  z-index: 5;
  transform: translateY(-100%);
}

.preview-form-remove-action {
  position: absolute;
  background-color: var(--overlay-accent-color, #2980b9);
  color: white;
  top: 0;
  right: 0;
  width: fit-content;
  height: fit-content;
  padding: 4px;
  z-index: 5;
  transform: translateY(-100%);
}

.preview-element-resizer-icon {
  position: absolute;
  pointer-events: none;
  background-color: white;
  border: 1px solid #546e7a;
  border-radius: .125rem;
  top: 50%;
  bottom: 0;
  right: .125rem;
  height: .562rem;
  width: .562rem;
  translate: 50% -50%;
  z-index: 1;
}

.preview-element-resizer {
  cursor: col-resize;
  position: absolute;
  top: 0;
  bottom: 0;
  right: -.125rem;
  width: .5rem;
  z-index: 9999;
}

.preview-element-columns-display {
  align-items: center;
  background-color: white;
  border: 1px solid #546e7a;
  border-radius: .125rem;
  bottom: 0;
  color: #212121;
  display: flex;
  left: 0;
  font-size: .875rem;
  height: 1rem;
  justify-content: center;
  line-height: 1;
  min-width: 1.125rem;
  pointer-events: none;
  position: absolute;
  top: 50%;
  translate: -50% -50%;
  width: auto;
  z-index: 6;
}
</style>
