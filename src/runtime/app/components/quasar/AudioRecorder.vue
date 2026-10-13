<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QfbMediaController } from '../../../types/media'
import { useQuasar } from 'quasar'
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, onScopeDispose, shallowRef, watch } from 'vue'
import { useRouter } from '#imports'
import { baseMimeType, positiveNumber } from '../../../utils/mediaPolicy'
import { createQfbAudioCapture } from '../../composables/audioCapture'
import { useQfbMediaField } from '../../composables/useQfbMediaField'
import { getFormKitContextAttrs } from '../../utils/quasarFieldDesign'
import MediaItem from '../media/MediaItem.vue'
import MediaList from '../media/MediaList.vue'

const props = defineProps<{ context: FormKitFrameworkContext }>()
const media = useQfbMediaField(props.context)
const attrs = computed(() =>
  getFormKitContextAttrs(props.context, [
    'maxDurationSeconds',
    'preferredMimeTypes',
    'maxFileSize',
    'maxTotalSize',
    'multiple',
    'maxFiles',
  ]),
)
const owner = getCurrentInstance()!.appContext.app
const recording = shallowRef<ReturnType<typeof createQfbAudioCapture>>()
const capture = shallowRef<ReturnType<QfbMediaController['beginCapture']>>()
const previewUrl = shallowRef('')
const transitioning = shallowRef(false)
const picker = shallowRef<File | File[] | null>(null)
const router = useRouter()
const quasar = useQuasar()
const active = computed(() =>
  ['requesting', 'recording', 'paused', 'stopping', 'ready'].includes(recording.value?.state.value || ''),
)
const state = computed(() => recording.value?.state.value || 'idle')
const duration = computed(() => {
  const seconds = Math.floor((recording.value?.durationMs.value || 0) / 1000)
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
})
const mime = computed(() => recording.value?.candidate.value?.mimeType || '')
const localFiles = computed<File[]>(() => {
  const value = props.context._value
  return (Array.isArray(value) ? value : value ? [value] : []).filter(
    item => typeof File !== 'undefined' && item instanceof File,
  )
})
async function removeLocal(index: number) {
  if (media.locked.value || active.value) return
  const remaining = localFiles.value.filter((_file, position) => position !== index)
  media.clearErrors()
  await props.context.node.input(attrs.value.multiple ? remaining : null)
}
function releasePreview() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
}
function discard() {
  recording.value?.discard()
  capture.value?.release()
  capture.value = undefined
  releasePreview()
  media.clearErrors()
}
async function start() {
  if (!media.canSelect.value || transitioning.value || active.value) return
  transitioning.value = true
  try {
    capture.value = media.beginRecording()
    recording.value = createQfbAudioCapture({
      owner,
      maxDurationSeconds: positiveNumber(attrs.value.maxDurationSeconds) || 300,
      maxFileSize: positiveNumber(attrs.value.maxFileSize),
      preferredMimeTypes: attrs.value.preferredMimeTypes,
      policy: media.controller.value?.policy.value,
    })
    await recording.value.start()
  }
  catch (error) {
    media.error(error)
    capture.value?.release()
    capture.value = undefined
  }
  finally {
    transitioning.value = false
  }
}
async function stop() {
  if (!recording.value || transitioning.value) return
  try {
    await recording.value.stop()
  }
  catch (error) {
    media.error(error)
  }
}
async function confirm() {
  const candidate = recording.value?.candidate.value
  if (!candidate || media.locked.value || transitioning.value) return
  transitioning.value = true
  try {
    await media.finishRecording(candidate, capture.value)
    discard()
  }
  catch {
    capture.value = undefined
  }
  finally {
    transitioning.value = false
  }
}
async function preserve(commitLocal = false) {
  if (!recording.value || transitioning.value) return
  if (state.value === 'requesting') {
    discard()
    return
  }
  transitioning.value = true
  try {
    const candidate = await recording.value.stop()
    if (capture.value) {
      await capture.value.finish(candidate, true)
      discard()
    }
    else if (commitLocal && !media.locked.value) {
      await media.finishRecording(candidate)
      discard()
    }
  }
  catch (error) {
    media.error(error)
  }
  finally {
    transitioning.value = false
  }
}
async function selected(files: File | File[] | null) {
  await media.select(files, true)
  picker.value = null
}
function rejected(entries: Array<{ file: File, failedPropValidation: string }>) {
  for (const entry of entries)
    media.error(new Error(`${entry.file.name}: arquivo rejeitado (${entry.failedPropValidation})`))
}
watch(
  () => recording.value?.candidate.value,
  (candidate) => {
    releasePreview()
    if (candidate?.binary.kind === 'blob') previewUrl.value = URL.createObjectURL(candidate.binary.blob)
  },
)
watch(
  media.locked,
  (locked) => {
    if (locked && active.value) void preserve()
  },
  { flush: 'sync' },
)
watch(
  media.controller,
  (_current, previous) => {
    if (previous && active.value) void preserve()
  },
  { flush: 'sync' },
)
const stopErrorWatch = watch(
  () => recording.value?.error.value,
  (error) => {
    if (error) media.error(new Error(error))
  },
)
function visibility() {
  if (document.visibilityState === 'hidden' && active.value) void preserve()
}
function beforeUnload(event: BeforeUnloadEvent) {
  if (active.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}
let removeGuard: (() => void) | undefined
onMounted(() => {
  document.addEventListener('visibilitychange', visibility)
  window.addEventListener('beforeunload', beforeUnload)
  removeGuard = router.beforeEach(async () => {
    if (!active.value) return true
    const choice = await new Promise<string | undefined>((resolve) => {
      quasar
        .dialog({
          title: 'Gravação em andamento',
          message: 'Escolha o destino da gravação.',
          cancel: true,
          options: {
            type: 'radio',
            model: 'preserve',
            items: [
              { label: 'Parar e preservar', value: 'preserve' },
              { label: 'Descartar', value: 'discard' },
            ],
          },
        })
        .onOk(resolve)
        .onCancel(() => resolve(undefined))
        .onDismiss(() => resolve(undefined))
    })
    if (!choice) return false
    if (choice === 'preserve') {
      await preserve(true)
      return !active.value
    }
    discard()
    return true
  })
})
onBeforeUnmount(() => {
  const current = recording.value
  const issued = capture.value
  if (current && issued && ['recording', 'paused', 'stopping', 'ready'].includes(current.state.value)) {
    recording.value = undefined
    capture.value = undefined
    void current
      .stop()
      .then(candidate => issued.finish(candidate, true))
      .catch(() => {})
      .finally(current.dispose)
  }
})
onScopeDispose(() => {
  removeGuard?.()
  stopErrorWatch()
  if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', visibility)
  if (typeof window !== 'undefined') window.removeEventListener('beforeunload', beforeUnload)
  recording.value?.dispose()
  capture.value?.release()
  releasePreview()
})
</script>

<template>
  <div class="qfb-audio-recorder">
    <div class="text-body2">
      {{ context.label }}
    </div>
    <div v-if="context.attrs.description" class="text-caption text-grey">
      {{ context.attrs.description }}
    </div>
    <div class="qfb-audio-recorder__controls">
      <q-btn
        v-if="!active"
        icon="mic"
        label="Gravar"
        color="primary"
        :disable="!media.canSelect.value"
        :loading="transitioning"
        @click="start"
      />
      <q-btn
        v-if="state === 'recording'"
        round
        flat
        icon="pause"
        color="primary"
        aria-label="Pausar gravação"
        @click="recording?.pause()"
      >
        <q-tooltip>Pausar</q-tooltip>
      </q-btn>
      <q-btn
        v-if="state === 'paused'"
        round
        flat
        icon="play_arrow"
        color="primary"
        aria-label="Continuar gravação"
        :disable="media.locked.value"
        @click="recording?.resume()"
      >
        <q-tooltip>Continuar</q-tooltip>
      </q-btn>
      <q-btn
        v-if="state === 'recording' || state === 'paused'"
        round
        flat
        icon="stop"
        color="primary"
        aria-label="Parar gravação"
        @click="stop"
      >
        <q-tooltip>Parar</q-tooltip>
      </q-btn>
      <span v-if="active" class="qfb-audio-recorder__duration" role="status">{{ duration }}</span>
      <q-btn
        v-if="state === 'ready'"
        icon="check"
        label="Confirmar"
        color="primary"
        :loading="media.busy.value || transitioning"
        :disable="media.locked.value"
        @click="confirm"
      />
      <q-btn
        v-if="active"
        flat
        round
        icon="delete_outline"
        aria-label="Descartar gravação"
        :disable="transitioning"
        @click="discard"
      >
        <q-tooltip>Descartar</q-tooltip>
      </q-btn>
    </div>
    <audio
      v-if="previewUrl && baseMimeType(mime).startsWith('audio/')"
      :src="previewUrl"
      controls
      preload="metadata"
      aria-label="Ouvir gravação"
      class="qfb-audio-recorder__player"
    />
    <q-file
      :model-value="media.controller.value ? picker : context._value"
      label="Selecionar áudio"
      aria-label="Selecionar áudio"
      accept="audio/*"
      :multiple="Boolean(attrs.multiple)"
      :append="Boolean(attrs.multiple)"
      :max-file-size="media.controller.value ? undefined : positiveNumber(attrs.maxFileSize)"
      :max-total-size="media.controller.value ? undefined : positiveNumber(attrs.maxTotalSize)"
      :max-files="media.controller.value ? undefined : positiveNumber(attrs.maxFiles)"
      :disable="!media.canSelect.value || active"
      color="primary"
      dense
      outlined
      @update:model-value="selected"
      @change.capture="media.clearErrors"
      @rejected="rejected"
    >
      <template #prepend>
        <q-icon name="audio_file" />
      </template>
    </q-file>
    <MediaList
      v-if="media.controller.value"
      class="q-mt-sm"
      :values="media.values.value"
      :controller="media.controller.value"
      :readonly="media.locked.value || active || media.busy.value"
      @remove="media.remove"
    />
    <MediaItem
      v-for="(file, index) in media.controller.value ? [] : localFiles"
      :key="`${file.name}-${index}`"
      class="q-mt-sm"
      :item="{ documentId: '', name: file.name, mimeType: file.type, size: file.size }"
      :local-file="file"
      removable
      :readonly="media.locked.value || active"
      @remove="removeLocal(index)"
    />
    <div v-if="!media.controller.value && localFiles.length" class="text-caption text-grey">
      Somente nesta sessão
    </div>
    <div v-for="item in media.recovery.value" :key="item.value.clientId" class="qfb-audio-recorder__recovery">
      <span>{{ item.value.name }}</span>
      <q-btn
        flat
        icon="check"
        :aria-label="`Confirmar ${item.value.name}`"
        :disable="!media.canSelect.value"
        @click="media.confirmRecovery(item.value.clientId)"
      />
      <q-btn
        flat
        icon="delete_outline"
        :aria-label="`Descartar ${item.value.name}`"
        :disable="media.locked.value"
        @click="media.discardRecovery(item.value.clientId)"
      />
    </div>
    <div v-for="error in media.errors.value" :key="error" role="alert" class="text-negative text-caption">
      {{ error }}
    </div>
  </div>
</template>

<style scoped>
.qfb-audio-recorder__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin: 0.75rem 0;
}
.qfb-audio-recorder__duration {
  font-variant-numeric: tabular-nums;
  min-width: 48px;
}
.qfb-audio-recorder__player {
  width: 100%;
  margin-bottom: 0.75rem;
}
.qfb-audio-recorder__recovery {
  display: flex;
  align-items: center;
  overflow-wrap: anywhere;
}
.qfb-audio-recorder__recovery span {
  flex: 1;
  min-width: 0;
}
</style>
