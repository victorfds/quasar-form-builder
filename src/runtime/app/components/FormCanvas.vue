<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  droppable?: boolean
  empty?: boolean
  highlightEmpty?: boolean
  emptyText?: string
}>(), {
  droppable: false,
  empty: false,
  highlightEmpty: false,
  emptyText: 'Arraste e solte aqui os elementos da coluna esquerda',
})

const emit = defineEmits<{
  (e: 'drop', ev: DragEvent): void
  (e: 'dragover', ev: DragEvent): void
  (e: 'dragenter', ev: DragEvent): void
  (e: 'dragleave', ev: DragEvent): void
}>()

const rootRef = defineModel<HTMLElement | null>('rootRef', { default: null })

const attrs = useAttrs()

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
      :class="{ 'bg-green-8': highlightEmpty }"
      @dragenter="handleDragenter"
      @dragleave="handleDragleave"
    >
      <slot name="empty">
        <div class="overlay-drop-here__content column items-center justify-center no-wrap">
          <q-icon name="add_box" class="overlay-drop-here__icon" />
          <div class="overlay-drop-here__label">
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
  background: rgba(129, 212, 250, .24);
  border: 1px dashed rgba(69, 140, 163, .52);
  color: #4f93a8;
  grid-column: 1 / -1;
  position: relative;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
  height: 328px;
  min-height: 7.5rem;
}

.overlay-drop-here__content {
  gap: .5rem;
  pointer-events: none;
}

.overlay-drop-here__icon {
  font-size: 2rem;
}

.overlay-drop-here__label {
  font-size: .875rem;
  line-height: 1.25rem;
  text-align: center;
}
</style>
