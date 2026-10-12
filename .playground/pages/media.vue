<script setup lang="ts">
import type { QfbMediaController, QfbMediaRecoveryState, QfbMediaSnapshot, QfbRemoteMedia } from 'nuxt-quasar-form-builder/media'
import { createQfbHttpMediaTransport, createQfbIndexedDbStorage, useQfbMediaController } from 'nuxt-quasar-form-builder/media'
import { computed, onMounted, onScopeDispose, ref, shallowRef, watch } from 'vue'
import { useFetch, useRoute } from '#imports'
import { createNativeMediaDemo } from '../utils/nativeMediaDemo'

type DemoField = Record<string, any> & { $formkit: string, name: string }
const route = useRoute()
const responseId = String(route.query.response || 'media-example')
const mode = String(route.query.mode || 'offline')
const { data } = await useFetch<{ schema: DemoField[], values: Record<string, unknown> }>(`/api/media-demo/responses/${encodeURIComponent(responseId)}`)
const fields = shallowRef((data.value?.schema || []).map(field =>
  field.name === 'voice' && route.query.multiple === 'true' ? { ...field, multiple: true, maxFiles: 2 } : field,
))
const laterDefinition = computed(() => fields.value.filter(field => field.name !== 'conditional').map(field => field.name === 'title' ? { ...field, name: 'revised_title', label: 'Pergunta revisada' } : field))
const laterValues = ref({})
const values = ref<Record<string, unknown>>(data.value?.values || {})
const connected = shallowRef(true)
const readonly = shallowRef(mode === 'readonly' || mode === 'historical')
const saving = shallowRef(false)
const hydrated = shallowRef(false)
const result = shallowRef('')
const attachments = shallowRef<QfbRemoteMedia[]>([])
const scope = { userKey: 'playground-user', formId: 'media-demo', responseKey: responseId }
const key = `qfb-media-demo:${responseId}`
const policy = { maxFileSize: 1024 * 1024, allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'text/plain', 'application/pdf', 'audio/webm', 'audio/ogg', 'audio/mp4', 'video/mp4', 'video/webm'], allowedExtensions: ['png', 'jpg', 'jpeg', 'webp', 'txt', 'pdf', 'webm', 'ogg', 'm4a', 'mp4'] }
const blocked = computed(() => readonly.value || (mode === 'online' && !connected.value))
const http = createQfbHttpMediaTransport({
  urls: {
    list: id => `/api/media-demo/responses/${encodeURIComponent(id)}/documents`,
    upload: id => `/api/media-demo/responses/${encodeURIComponent(id)}/documents`,
    remove: (id, document) => `/api/media-demo/responses/${encodeURIComponent(id)}/documents/${document}`,
    access: document => `/api/media-demo/documents/${document}/access`,
  },
  headers: () => ({ 'X-Qfb-Demo-User': scope.userKey }),
  toRemote: dto => dto as QfbRemoteMedia,
  toAccess: dto => ({ url: new URL((dto as { url: string }).url, window.location.origin).href, release() {} }),
})
const adapters = mode === 'native' ? createNativeMediaDemo(scope, http) : { storage: createQfbIndexedDbStorage({ databaseName: 'qfb-playground' }), transport: http }
const controller = shallowRef<QfbMediaController>()
const viewer = shallowRef<{ submit: () => void }>()
function initialize(snapshot?: QfbMediaSnapshot, recovery?: QfbMediaRecoveryState) {
  controller.value?.dispose()
  controller.value = useQfbMediaController({ scope, policy, ...adapters, readonly: blocked, initialValues: data.value?.values, initialSnapshot: snapshot, initialRecovery: recovery })
}
initialize()
const secondValues = ref<Record<string, unknown>>({})
const second = mode === 'simultaneous' ? useQfbMediaController({ scope: { ...scope, responseKey: `${responseId}-other` }, policy, ...adapters }) : undefined
function persistDraft(snapshot?: QfbMediaSnapshot) {
  if (!hydrated.value || typeof localStorage === 'undefined' || blocked.value) return
  localStorage.setItem(key, JSON.stringify({ values: values.value, snapshot, recovery: controller.value?.recovery.value }))
}
function recoveryChanged() {
  if (!hydrated.value || typeof localStorage === 'undefined') return
  const previous = JSON.parse(localStorage.getItem(key) || '{}')
  localStorage.setItem(key, JSON.stringify({ ...previous, recovery: controller.value?.recovery.value }))
}
async function saveLocal() {
  try { persistDraft(await controller.value!.prepare(values.value)); result.value = 'Rascunho salvo' }
  catch (error) { result.value = error instanceof Error ? error.message : 'Erro ao salvar' }
}
async function saveRemote() {
  if (!connected.value || blocked.value || saving.value) return
  saving.value = true
  try {
    const snapshot = await controller.value!.prepare(values.value)
    persistDraft(snapshot)
    const sync = useQfbMediaController({ scope, policy, ...adapters, initialSnapshot: snapshot })
    try {
    await $fetch(`/api/media-demo/responses/${encodeURIComponent(responseId)}`, { method: 'PUT', body: { values: snapshot.values } })
    const upload = await sync.uploadPending(responseId, snapshot)
    const confirmed = sync.applyRemote(snapshot.values, upload.results)
    await $fetch(`/api/media-demo/responses/${encodeURIComponent(responseId)}`, { method: 'PUT', body: { values: confirmed } })
    sync.markCommitted(confirmed)
    await sync.applyRemovals(responseId, snapshot)
    controller.value!.markCommitted(confirmed)
    values.value = controller.value!.applyRemote(values.value, upload.results)
    persistDraft()
    const remote = await controller.value!.reconcile(responseId)
    attachments.value = remote.unassigned
    result.value = upload.errors.length ? upload.errors.map(error => error.message).join('; ') : 'Resposta salva'
    }
    finally { sync.dispose() }
  }
  catch (error) { result.value = error instanceof Error ? error.message : 'Erro ao enviar' }
  finally { saving.value = false }
}
function rollback() { values.value = controller.value!.rollback(); persistDraft(); result.value = 'Edição cancelada' }
watch(values, () => persistDraft(), { deep: true })
onMounted(() => {
  const draft = mode !== 'readonly' && mode !== 'historical' ? JSON.parse(localStorage.getItem(key) || 'null') : null
  if (draft) {
    values.value = draft.values
    initialize(draft.snapshot, draft.recovery)
  }
  hydrated.value = true
})
onScopeDispose(() => { controller.value?.dispose(); second?.dispose() })
</script>

<template>
  <main class="media-demo q-pa-md">
    <div class="media-demo__toolbar q-mb-md">
      <h1 class="text-h6 q-ma-none">Mídia</h1>
      <q-toggle v-model="connected" label="Conectado" />
      <q-toggle v-model="readonly" label="Somente leitura" />
      <q-btn icon="save" label="Salvar rascunho" :disable="blocked || saving" @click="saveLocal" />
      <q-btn icon="cloud_upload" label="Enviar" :disable="blocked || !connected" :loading="saving" @click="viewer?.submit()" />
      <q-btn icon="undo" label="Cancelar edição" :disable="blocked || saving" @click="rollback" />
    </div>
    <div v-if="result" role="status" class="q-mb-md" data-testid="media-result">{{ result }}</div>
    <QfbFormViewer v-if="mode !== 'legacy' && (hydrated || mode === 'readonly' || mode === 'historical')" ref="viewer" v-model="values" :form-fields="fields" :media-controller="controller" :readonly="blocked" @submit="saveRemote" @submit-invalid="result = 'Valores inválidos'" @media-change="recoveryChanged" @media-error="error => { result = error.message }" />
    <QfbFormViewer v-if="mode === 'legacy' && hydrated" v-model="values" :form-fields="fields.filter(field => ['q-file', 'q-audio-recorder'].includes(field.$formkit))" :readonly="blocked" />
    <QfbMediaAttachments v-if="attachments.length" :items="attachments" :media-controller="controller" />
    <section v-if="mode === 'historical'" class="q-mt-lg">
      <h2 class="text-subtitle1">Definição posterior</h2>
      <QfbFormViewer v-model="laterValues" :form-fields="laterDefinition" readonly />
    </section>
    <QfbFormViewer v-if="second" v-model="secondValues" :form-fields="fields" :media-controller="second" data-testid="second-viewer" />
    <details class="q-mt-lg"><summary>Valores</summary><pre data-testid="media-values">{{ JSON.stringify(values, null, 2) }}</pre></details>
    <pre v-if="second" data-testid="second-values">{{ JSON.stringify(secondValues, null, 2) }}</pre>
  </main>
</template>

<style scoped>
.media-demo { max-width: 960px; margin: 0 auto; }
.media-demo__toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
