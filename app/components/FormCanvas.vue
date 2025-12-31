<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const rootRef = defineModel<HTMLElement | null>('rootRef', { default: null })

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

const attrs = useAttrs()

function handleDrop(ev: DragEvent) {
  if (!props.droppable) return
  ev.preventDefault()
  emit('drop', ev)
}

function handleDragover(ev: DragEvent) {
  if (!props.droppable) return
  ev.preventDefault()
  emit('dragover', ev)
}

function handleDragenter(ev: DragEvent) {
  if (!props.droppable || !props.empty) return
  ev.preventDefault()
  emit('dragenter', ev)
}

function handleDragleave(ev: DragEvent) {
  if (!props.droppable || !props.empty) return
  ev.preventDefault()
  emit('dragleave', ev)
}
</script>

<template>
  <div
    ref="rootRef"
    class="form-canvas q-py-sm rounded-borders grid grid-cols-12 row-gap-y-gutter column-gap-x-gutter"
    v-bind="attrs"
    @drop="handleDrop"
    @dragover="handleDragover"
  >
    <div
      v-if="empty"
      class="overlay-drop-here row items-center justify-center rounded-borders span-12"
      :class="{ 'bg-green-8': highlightEmpty }"
      @dragenter="handleDragenter"
      @dragleave="handleDragleave"
    >
      <slot name="empty">
        {{ emptyText }}
      </slot>
    </div>

    <slot />
  </div>
</template>

<style lang="scss">
.form-canvas {
  height: fit-content;
}

.form-field {
  position: relative;
  pointer-events: auto;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.overlay-drop-here {
  position: relative;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
  height: 328px;
}
</style>
