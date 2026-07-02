<script setup lang="ts">
import { computed, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  droppable?: boolean
  empty?: boolean
  compactEmpty?: boolean
  highlightEmpty?: boolean
  emptyText?: string
}>(), {
  droppable: false,
  empty: false,
  compactEmpty: false,
  highlightEmpty: false,
  emptyText: 'Arraste os elementos aqui',
})

const emit = defineEmits<{
  (e: 'drop', ev: DragEvent): void
  (e: 'dragover', ev: DragEvent): void
  (e: 'dragenter', ev: DragEvent): void
  (e: 'dragleave', ev: DragEvent): void
}>()

const rootRef = defineModel<HTMLElement | null>('rootRef', { default: null })

const attrs = useAttrs()
const hasEmptyText = computed(() => Boolean(props.emptyText?.trim()))

function handleDrop(ev: DragEvent) {
  if (!props.droppable) return
  ev.preventDefault()
  ev.stopPropagation()
  emit('drop', ev)
}

function handleDragover(ev: DragEvent) {
  if (!props.droppable) return
  ev.preventDefault()
  ev.stopPropagation()
  emit('dragover', ev)
}

function handleDragenter(ev: DragEvent) {
  if (!props.droppable) return
  ev.preventDefault()
  ev.stopPropagation()
  emit('dragenter', ev)
}

function handleDragleave(ev: DragEvent) {
  if (!props.droppable) return
  ev.preventDefault()
  ev.stopPropagation()
  emit('dragleave', ev)
}
</script>

<template>
  <div
    ref="rootRef"
    class="form-canvas q-py-sm rounded-borders"
    v-bind="attrs"
    @drop="handleDrop"
    @dragover="handleDragover"
    @dragenter="handleDragenter"
    @dragleave="handleDragleave"
  >
    <div
      v-if="empty"
      class="overlay-drop-here row items-center justify-center rounded-borders span-12"
      :class="{
        'overlay-drop-here--compact': compactEmpty,
        'overlay-drop-here--highlighted': highlightEmpty,
      }"
      @dragenter="handleDragenter"
      @dragover="handleDragover"
      @dragleave="handleDragleave"
      @drop="handleDrop"
    >
      <slot name="empty">
        <div class="overlay-drop-here__content column items-center justify-center">
          <q-icon name="add_box" :size="compactEmpty ? 'lg' : 'xl'" class="overlay-drop-here__icon" />
          <div v-if="hasEmptyText" class="overlay-drop-here__label text-caption text-center">
            {{ emptyText }}
          </div>
        </div>
      </slot>
    </div>

    <slot />
  </div>
</template>

<style lang="scss">
.form-canvas {
  column-gap: 1rem;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  height: fit-content;
  row-gap: 0;
  width: 100%;
}

.form-canvas--cell-list {
  column-gap: 0;
}

.form-field {
  box-sizing: border-box;
  grid-column: span var(--field-column-default, 12) / span var(--field-column-default, 12);
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  min-width: 0;
  pointer-events: auto;
  position: relative;
  width: 100%;
}

.form-canvas--cell-list > .form-field {
  max-width: 100%;
  overflow-wrap: anywhere;
}

.form-field .form-field {
  z-index: 6;
}

.form-field--hidden-preview {
  display: none;
  margin: 0;
  padding: 0;
}

@media (min-width: 600px) {
  .form-field--responsive {
    grid-column: span var(--field-column-sm, var(--field-column-default, 12)) / span var(--field-column-sm, var(--field-column-default, 12));
  }
}

@media (min-width: 1024px) {
  .form-field--responsive {
    grid-column: span var(--field-column-lg, var(--field-column-sm, var(--field-column-default, 12))) / span var(--field-column-lg, var(--field-column-sm, var(--field-column-default, 12)));
  }
}

.overlay-drop-here {
  background: var(--builder-drop-zone-bg, rgba(41, 128, 185, .12));
  border: 0;
  color: var(--builder-drop-zone-color, #2980b9);
  grid-column: 1 / -1;
  position: relative;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
  height: 328px;
  min-height: 7.5rem;
}

body.qfb-builder-dragging .overlay-drop-here {
  z-index: 8;
}

.overlay-drop-here--highlighted {
  background: var(--builder-drop-zone-active-bg, rgba(41, 128, 185, .18));
}

.overlay-drop-here__content {
  gap: .5rem;
  min-width: 0;
  pointer-events: none;
  width: 100%;
}

.overlay-drop-here--compact .overlay-drop-here__content {
  gap: .25rem;
}

.overlay-drop-here__icon {
  color: var(--builder-drop-zone-color, #2980b9);
}

.overlay-drop-here__label {
  color: var(--builder-drop-zone-color, #2980b9);
  line-height: 1.2;
  max-width: 100%;
  min-width: 0;
  overflow-wrap: anywhere;
  white-space: normal;
  width: 100%;
}
</style>
