<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'

const props = defineProps<{ context: FormKitFrameworkContext & { attrs: { description?: string, readonly?: boolean, disable?: boolean } } }>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const isDrawing = shallowRef(false)

function getPoint(ev: MouseEvent | TouchEvent) {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  const source = ev instanceof TouchEvent ? ev.touches[0] : ev
  if (!source) return null
  return {
    x: source.clientX - rect.left,
    y: source.clientY - rect.top,
  }
}

function getContext() {
  const context = canvasRef.value?.getContext('2d')
  if (!context) return null
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.lineWidth = 2
  context.strokeStyle = '#263238'
  return context
}

function syncValue() {
  const canvas = canvasRef.value
  if (!canvas) return
  props.context?.node.input(canvas.toDataURL('image/png'))
}

function startDrawing(ev: MouseEvent | TouchEvent) {
  if (props.context.attrs.readonly || props.context.attrs.disable) return
  const point = getPoint(ev)
  const context = getContext()
  if (!point || !context) return
  isDrawing.value = true
  context.beginPath()
  context.moveTo(point.x, point.y)
}

function draw(ev: MouseEvent | TouchEvent) {
  if (!isDrawing.value) return
  ev.preventDefault()
  const point = getPoint(ev)
  const context = getContext()
  if (!point || !context) return
  context.lineTo(point.x, point.y)
  context.stroke()
}

function stopDrawing() {
  if (!isDrawing.value) return
  isDrawing.value = false
  syncValue()
}

function clearSignature() {
  const canvas = canvasRef.value
  const context = getContext()
  if (!canvas || !context) return
  context.clearRect(0, 0, canvas.width, canvas.height)
  props.context?.node.input('')
}
</script>

<template>
  <q-field
    borderless
    :label="context.label"
    :hint="context.attrs.description"
    stack-label
    hide-bottom-space
  >
    <template #control>
      <div class="signature-field full-width">
        <canvas
          ref="canvasRef"
          class="signature-field__canvas"
          width="620"
          height="220"
          @mousedown="startDrawing"
          @mousemove="draw"
          @mouseup="stopDrawing"
          @mouseleave="stopDrawing"
          @touchstart.prevent="startDrawing"
          @touchmove="draw"
          @touchend="stopDrawing"
        />
        <q-btn dense flat no-caps icon="backspace" label="Limpar" class="q-mt-xs" @click="clearSignature" />
      </div>
    </template>
  </q-field>
</template>

<style scoped>
.signature-field__canvas {
  background: white;
  border: 1px solid var(--line-color);
  border-radius: 6px;
  display: block;
  height: 180px;
  max-width: 100%;
  touch-action: none;
  width: 100%;
}
</style>
