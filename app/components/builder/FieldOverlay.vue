<script setup lang="ts">
import type { FormKitSchemaDefinition } from '@formkit/core'

type OverlayState = {
  // active and hover are based on field names for simplicity
  activeNames: string[]
  hoverName?: string
  elementBeingDragged?: { field?: FormKitSchemaDefinition, index?: number }
  isUserDraggingOver?: boolean
  dragInIndicator?: { index?: number, name?: string }
  isDraggingStepper?: boolean
  hasStepper?: boolean
}

const props = defineProps<{
  field: FormKitSchemaDefinition & { name?: string }
  index: number
  state: OverlayState
  previewModeEditing: boolean
}>()

const emit = defineEmits<{
  (e: 'click', index: number): void
  (e: 'dragstart', payload: { field: any, index: number }): void
  (e: 'dragend', index: number): void
  (e: 'dragenter:top', payload: { name?: string, index: number, ev: DragEvent }): void
  (e: 'dragenter:bottom', payload: { name?: string, index: number, ev: DragEvent }): void
  (e: 'dragover', ev: DragEvent): void
  (e: 'copy', payload: { field: any, index: number }): void
  (e: 'remove', payload: { field: any, index: number }): void
  (e: 'resize:start', payload: { ev: MouseEvent, field: any }): void
}>()

const isLatest = computed(() => !props.state.elementBeingDragged?.field && !props.state.elementBeingDragged?.index && props.state.activeNames.at(-1) === (props.field?.name || ''))
const isActive = computed(() => !props.state.elementBeingDragged?.field && !props.state.elementBeingDragged?.index && props.state.activeNames?.includes(props.field?.name || ''))
const isDragging = computed(() => (props.state.elementBeingDragged?.field as any)?.name === (props.field?.name || ''))
const isHover = computed(() => !isActive.value && props.state.hoverName === (props.field?.name || ''))
const showControls = computed(() => props.previewModeEditing && (!props.state.elementBeingDragged?.field && !props.state.elementBeingDragged?.index) && (isActive.value || isHover.value))
const hideDropAreas = computed(() => (props.state.elementBeingDragged?.field as any)?.name === (props.field?.name || '') || !props.state.isUserDraggingOver || (props.state.isDraggingStepper && props.state.hasStepper))
const showStepperOnlyTop = computed(() => props.state.isDraggingStepper === true && props.state.hasStepper !== true)
const showTopDropArea = computed(() => {
  if (showStepperOnlyTop.value) {
    return props.index === 0 && props.state.isUserDraggingOver
  }
  return !hideDropAreas.value
})
const showBottomDropArea = computed(() => {
  if (showStepperOnlyTop.value) return false
  return !hideDropAreas.value
})

function onDragEnterTop(ev: DragEvent) {
  const destIndex = Number(props.state.elementBeingDragged?.index) < props.index ? props.index - 1 : props.index
  emit('dragenter:top', { name: props.field?.name, index: destIndex, ev })
}
function onDragEnterBottom(ev: DragEvent) {
  const destIndex = Number(props.state.elementBeingDragged?.index) > props.index ? props.index + 1 : props.index
  emit('dragenter:bottom', { name: props.field?.name, index: destIndex, ev })
}
</script>

<template>
  <!-- Overlay preview layer for a single field -->
  <div class="overlay-preview-element cursor-pointer" :class="{
    __latest: isLatest,
    __active: isActive,
    __dragging: isDragging,
    __hover: isHover,
    hidden: !previewModeEditing,
  }" draggable="true" @click.stop="emit('click', index)"
       @dragstart="emit('dragstart', { field, index })" @dragend="emit('dragend', index)" />

  <!-- Top drop area -->
  <div class="preview-element-area-top" :class="{ hidden: !showTopDropArea }" @dragenter.prevent="onDragEnterTop"
       @dragover.prevent="(e) => emit('dragover', e)">
    <div class="preview-element-label-wrapper preview-element-label-wrapper__top"
         :class="{ hidden: state.dragInIndicator?.name !== (field?.name || '') || (Number(state.elementBeingDragged?.index) > index && state.dragInIndicator?.index !== index) || (Number(state.elementBeingDragged?.index) < index && state.dragInIndicator?.index !== index - 1) }">
      <div class="preview-element-label">Drag it here</div>
    </div>
  </div>
  <!-- Bottom drop area -->
  <div class="preview-element-area-bottom" :class="{ hidden: !showBottomDropArea }" @dragenter.prevent="onDragEnterBottom"
       @dragover.prevent="(e) => emit('dragover', e)">
    <div class="preview-element-label-wrapper preview-element-label-wrapper__bottom"
         :class="{ hidden: state.dragInIndicator?.name !== (field?.name || '') || (Number(state.elementBeingDragged?.index) > index && state.dragInIndicator?.index !== index + 1) || (Number(state.elementBeingDragged?.index) < index && state.dragInIndicator?.index !== index) }">
      <div class="preview-element-label">Drag it here</div>
    </div>
  </div>

  <!-- Active label and actions -->
  <div v-if="showControls" class="preview-form-name" @click.stop="emit('click', index)">{{ field?.name }}</div>
  <q-icon v-if="showControls" name="content_copy" class="preview-form-copy-action cursor-pointer"
          @click.stop="emit('copy', { field, index })">
    <q-tooltip class="bg-dark" transition-show="fade" transition-hide="fade" anchor="top middle"
               self="bottom middle" :offset="[4, 4]">
      Clone
    </q-tooltip>
  </q-icon>
  <q-icon v-if="showControls" name="o_delete" class="preview-form-remove-action cursor-pointer"
          @click.stop="emit('remove', { field, index })">
    <q-tooltip class="bg-dark" transition-show="fade" transition-hide="fade" anchor="top middle"
               self="bottom middle" :offset="[4, 4]">
      Remove
    </q-tooltip>
  </q-icon>
  <div v-if="showControls" class="preview-element-resizer-icon" />
  <div v-if="showControls" class="preview-element-resizer" @mousedown.stop="(ev: MouseEvent) => emit('resize:start', { ev, field })" />
  <div v-if="showControls && state.elementBeingDragged?.field?.name === field?.name" class="preview-element-columns-display">
    <span class="text-caption text-weight-semibold q-pa-xs">{{
      // @ts-expect-error store enriches columns
      (field?.columns?.container || field?.columns?.default?.container || 12) || 12
    }}</span>
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
}

.preview-element-area-top {
  position: absolute;
  bottom: 50%;
  top: -.5rem;
  left: 0;
  right: 0;
}

.preview-element-area-bottom {
  position: absolute;
  top: 50%;
  bottom: -.5rem;
  left: 0;
  right: 0;
}

.preview-element-label-wrapper {
  pointer-events: none;
  position: absolute;
  height: .25rem;
  border-radius: 9999px;
  background-color: #a82454;

  &__bottom {
    left: -.5rem;
    right: -.5rem;
    bottom: -.125rem;
  }

  &__top {
    left: -.5rem;
    right: -.5rem;
    top: -.125rem;
  }

  .preview-element-label {
    color: white;
    position: absolute;
    left: 50%;
    right: 50%;
    border-radius: 9999px;
    background-color: #a82454;
    padding: .125rem .5rem;
    font-size: .875rem;
    line-height: 1rem;
    transform: translate(-2.5rem, -.5rem);
    text-wrap: nowrap;
    width: fit-content;
  }
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
  z-index: 2;
  transform: translateY(-100%);
}

.preview-form-copy-action {
  position: absolute;
  background-color: var(--overlay-accent-color, #2980b9);
  color: white;
  top: -1.4rem;
  right: 1.5rem;
  width: fit-content;
  height: fit-content;
  padding: 4px;
  z-index: 2;
}

.preview-form-remove-action {
  position: absolute;
  background-color: var(--overlay-accent-color, #2980b9);
  color: white;
  top: -1.4rem;
  right: 0;
  width: fit-contet;
  height: fit-content;
  padding: 4px;
  z-index: 2;
}

.preview-element-resizer-icon {
  position: absolute;
  pointer-events: none;
  background-color: white;
  border: 1px solid $blue-grey-6;
  border-radius: .125rem;
  top: 50%;
  bottom: 0;
  right: 0;
  height: .562rem;
  width: .562rem;
  translate: 44% -50%;
  z-index: 1;
}

.preview-element-resizer {
  cursor: col-resize;
  position: absolute;
  top: 0;
  bottom: 0;
  right: -.25rem;
  width: .5rem;
  z-index: 9999;
}

.preview-element-columns-display {
  position: absolute;
  background-color: white;
  border: 1px solid $blue-grey-6;
  border-radius: .125rem;
  bottom: 0;
  color: $grey-10;
  top: 50%;
  left: 0;
  font-size: .875rem;
  pointer-events: none;
  translate: -50% -50%;
  height: 1rem;
  line-height: 1;
  width: auto;
  z-index: 1;
}
</style>
