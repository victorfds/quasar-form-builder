<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'

const props = defineProps<{ context: FormKitFrameworkContext & { attrs: { description?: string, readonly?: boolean, disable?: boolean, disabled?: boolean } } }>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const isDrawing = shallowRef(false)
let resizeObserver: ResizeObserver | null = null

function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas || !import.meta.client) return
  const rect = canvas.getBoundingClientRect()
  const ratio = window.devicePixelRatio || 1
  const width = Math.max(1, Math.round(rect.width * ratio))
  const height = Math.max(1, Math.round(rect.height * ratio))

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }

  const context = canvas.getContext('2d')
  if (!context) return
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.lineWidth = 2
  context.strokeStyle = '#263238'
}

function getPoint(ev: PointerEvent) {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  return {
    x: ev.clientX - rect.left,
    y: ev.clientY - rect.top,
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

function startDrawing(ev: PointerEvent) {
  if (props.context.attrs.readonly || props.context.attrs.disable || props.context.attrs.disabled) return
  ev.preventDefault()
  canvasRef.value?.setPointerCapture(ev.pointerId)
  const point = getPoint(ev)
  const context = getContext()
  if (!point || !context) return
  isDrawing.value = true
  context.beginPath()
  context.moveTo(point.x, point.y)
}

function draw(ev: PointerEvent) {
  if (!isDrawing.value) return
  ev.preventDefault()
  const point = getPoint(ev)
  const context = getContext()
  if (!point || !context) return
  context.lineTo(point.x, point.y)
  context.stroke()
}

function stopDrawing(ev?: PointerEvent) {
  if (!isDrawing.value) return
  isDrawing.value = false
  if (ev) canvasRef.value?.releasePointerCapture(ev.pointerId)
  syncValue()
}

function clearSignature() {
  const canvas = canvasRef.value
  const context = getContext()
  if (!canvas || !context) return
  context.clearRect(0, 0, canvas.width, canvas.height)
  props.context?.node.input('')
}

onMounted(() => {
  nextTick(() => {
    resizeCanvas()
    if (!canvasRef.value || typeof ResizeObserver === 'undefined') return
    resizeObserver = new ResizeObserver(resizeCanvas)
    resizeObserver.observe(canvasRef.value)
  })
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})
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
          @pointerdown="startDrawing"
          @pointermove="draw"
          @pointerup="stopDrawing"
          @pointercancel="stopDrawing"
          @pointerleave="stopDrawing"
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
