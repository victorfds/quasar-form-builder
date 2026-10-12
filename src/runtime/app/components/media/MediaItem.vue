<script setup lang="ts">
import type { QfbMediaController, QfbMediaSource, QfbMediaValue } from '../../media/types'
import { computed, onMounted, onScopeDispose, shallowRef, watch } from 'vue'
import { baseMimeType, formatMediaSize } from '../../media/policy'

const props = withDefaults(
  defineProps<{
    item: QfbMediaValue | { documentId: string, name: string, mimeType: string, size: number }
    controller?: QfbMediaController
    localFile?: File
    gallery?: boolean
    removable?: boolean
    readonly?: boolean
  }>(),
  { readonly: true },
)
const emit = defineEmits<{ remove: [], error: [error: Error] }>()
const source = shallowRef<QfbMediaSource>()
const loading = shallowRef(false)
const preview = shallowRef(false)
const failure = shallowRef('')
const mounted = shallowRef(false)
let generation = 0
const mime = computed(() => baseMimeType(props.item.mimeType))
const image = computed(() =>
  ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/bmp'].includes(mime.value),
)
const player = computed(() =>
  mime.value.startsWith('audio/') ? 'audio' : mime.value.startsWith('video/') ? 'video' : undefined,
)
const runtime = computed(() =>
  'clientId' in props.item ? props.controller?.items.value[props.item.clientId] : undefined,
)
const stateLabels = {
  staging: 'Armazenando',
  local: 'Local',
  queued: 'Aguardando envio',
  uploading: 'Enviando',
  uploaded: 'Enviado',
  error: 'Erro',
  removing: 'Removendo',
}
const status = computed(() =>
  runtime.value ? stateLabels[runtime.value.state] : props.item.documentId ? 'Enviado' : '',
)
const progress = computed(() => {
  const current = runtime.value?.progress
  return current?.total ? Math.min(1, current.loaded / current.total) : undefined
})
const canPlay = computed(() =>
  mounted.value && player.value
    ? Boolean(document.createElement(player.value).canPlayType(props.item.mimeType))
    : false,
)

function release() {
  generation++
  source.value?.release()
  source.value = undefined
}
async function acquire() {
  if (source.value && (!source.value.expiresAt || Date.parse(source.value.expiresAt) > Date.now() + 5000))
    return source.value
  release()
  const operation = generation
  loading.value = true
  failure.value = ''
  try {
    let next: QfbMediaSource
    if (props.localFile) {
      const url = URL.createObjectURL(props.localFile)
      next = { url, release: () => URL.revokeObjectURL(url) }
    }
    else if (props.controller) {
      next = await props.controller.getSource(props.item)
    }
    else {
      throw new Error('Fonte de mídia não configurada')
    }
    if (operation !== generation) {
      next.release()
      return
    }
    let url: URL
    try {
      url = new URL(next.url, document.baseURI)
    }
    catch {
      next.release()
      throw new Error('Fonte de mídia não suportada')
    }
    if (!['http:', 'https:', 'blob:', 'capacitor:'].includes(url.protocol)) {
      next.release()
      throw new Error('Fonte de mídia não suportada')
    }
    source.value = { url: url.href, expiresAt: next.expiresAt, release: () => next.release() }
    return source.value
  }
  catch (error) {
    if (operation === generation) {
      const problem = error instanceof Error ? error : new Error('Não foi possível abrir o arquivo')
      failure.value = problem.message
      emit('error', problem)
    }
  }
  finally {
    if (operation === generation) loading.value = false
  }
}
async function open() {
  if (preview.value) {
    preview.value = false
    release()
    return
  }
  if (await acquire()) preview.value = true
}
async function download() {
  const current = await acquire()
  if (!current) return
  const anchor = document.createElement('a')
  anchor.href = current.url
  anchor.download = props.item.name
  anchor.rel = 'noopener noreferrer'
  anchor.target = '_blank'
  anchor.click()
}
function previewError() {
  failure.value = 'Formato sem reprodução disponível. O download permanece disponível.'
  preview.value = false
}
watch(
  () => [props.item, props.controller, props.gallery],
  () => {
    release()
    preview.value = false
    if (mounted.value && props.gallery && image.value) void open()
  },
)
onMounted(() => {
  mounted.value = true
  if (props.gallery && image.value) void open()
})
onScopeDispose(release)
</script>

<template>
  <article class="qfb-media-item">
    <img
      v-if="preview && image && source"
      class="qfb-media-item__image"
      :src="source.url"
      :alt="item.name"
      loading="lazy"
      @error="previewError"
    >
    <div class="qfb-media-item__body">
      <div class="qfb-media-item__name">
        {{ item.name || 'Anexo' }}
      </div>
      <div class="text-caption text-grey">
        {{ formatMediaSize(item.size) }} · {{ item.mimeType }}
      </div>
      <div v-if="status" class="text-caption" role="status">
        {{ status }}
      </div>
      <q-linear-progress
        v-if="runtime?.state === 'uploading'"
        class="q-mt-xs"
        :value="progress"
        :indeterminate="progress === undefined"
        :aria-label="`Envio de ${item.name}`"
      />
      <div v-if="failure || runtime?.error" class="text-negative text-caption" role="alert">
        {{ failure || runtime?.error?.message }}
      </div>
    </div>
    <div class="qfb-media-item__actions">
      <q-btn
        v-if="image || canPlay"
        flat
        round
        dense
        :icon="preview ? 'visibility_off' : 'visibility'"
        :loading="loading"
        :aria-label="`Visualizar ${item.name}`"
        @click="open"
      >
        <q-tooltip>Visualizar</q-tooltip>
      </q-btn>
      <q-btn flat round dense icon="download" :loading="loading" :aria-label="`Baixar ${item.name}`" @click="download">
        <q-tooltip>Baixar</q-tooltip>
      </q-btn>
      <q-btn
        v-if="removable && !readonly"
        flat
        round
        dense
        icon="delete_outline"
        :aria-label="`Remover ${item.name}`"
        @click="emit('remove')"
      >
        <q-tooltip>Remover</q-tooltip>
      </q-btn>
    </div>
    <audio
      v-if="preview && player === 'audio' && canPlay && source"
      class="qfb-media-item__player"
      :src="source.url"
      controls
      preload="metadata"
      :aria-label="item.name"
      @error="previewError"
    />
    <video
      v-if="preview && player === 'video' && canPlay && source"
      class="qfb-media-item__player"
      :src="source.url"
      controls
      preload="metadata"
      :aria-label="item.name"
      @error="previewError"
    />
  </article>
</template>

<style scoped>
.qfb-media-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem;
  border: 1px solid var(--line-color, #ccc);
  border-radius: 6px;
  min-width: 0;
}
.qfb-media-item__body {
  flex: 1 1 140px;
  min-width: 0;
  overflow-wrap: anywhere;
}
.qfb-media-item__name {
  font-size: 0.875rem;
  font-weight: 500;
}
.qfb-media-item__actions {
  display: flex;
  flex: 0 0 auto;
}
.qfb-media-item__image {
  width: 96px;
  height: 80px;
  object-fit: contain;
}
.qfb-media-item__player {
  display: block;
  width: 100%;
  max-height: 320px;
}
</style>
