<script setup lang="ts">
import type { QfbMediaController, QfbMediaFieldContext } from 'nuxt-quasar-form-builder/media'
import { createQfbIndexedDbStorage, useQfbMediaController } from 'nuxt-quasar-form-builder/media'
import { extractFormData, walkQfbSchemaStructure } from 'nuxt-quasar-form-builder/schema'
import fixtures from '../../tests/fixtures/gmf-media-structures.json'

const route = useRoute()
const fixture = fixtures.find(item => item.name === route.query.fixture) || fixtures[0]!
const fields = JSON.parse(JSON.stringify(fixture.schema))
walkQfbSchemaStructure(fields, (field, position) => {
  if (position.role === 'input') field.label = 'Mídia da fixture'
})
const values = ref<Record<string, unknown>>(fixture.name === 'list-repeated-group' ? { itens: [{ foto: null }, { foto: null }] } : { visible: true })
const controller = shallowRef<QfbMediaController>()
const viewer = useTemplateRef<{ flush: () => Promise<Record<string, unknown>> }>('viewer')
const actualField = shallowRef<QfbMediaFieldContext>()
const snapshot = ref('')
const error = ref('')

onMounted(() => {
  controller.value = useQfbMediaController({
    scope: { userKey: 'fixture', formId: fixture.name, responseKey: String(route.query.key || 'default') },
    policy: { maxFileSize: 1024 * 1024, allowedMimeTypes: ['image/png'], allowedExtensions: ['png'] },
    storage: createQfbIndexedDbStorage({ databaseName: 'qfb-structure-fixtures' }),
    transport: { list: async () => [], access: async () => { throw new Error('No remote source in this fixture') }, remove: async () => {}, upload: async () => { throw new Error('No upload in this fixture') } },
  })
})
onBeforeUnmount(() => controller.value?.dispose())
async function prepare() {
  try {
    const current = await viewer.value!.flush()
    const prepared = await controller.value!.prepare(current)
    snapshot.value = JSON.stringify({ fields: prepared.fields, uploads: prepared.uploads, answers: extractFormData(fields, current).answers, actualField: actualField.value })
  }
  catch (reason) { error.value = reason instanceof Error ? reason.message : String(reason) }
}
function reorder() {
  if (Array.isArray(values.value.itens)) values.value = { ...values.value, itens: [...values.value.itens].reverse() }
}
</script>

<template>
  <main class="q-pa-lg">
    <h1>{{ fixture.name }}</h1>
    <QfbFormViewer v-if="controller" ref="viewer" v-model="values" :form-fields="fields" :media-controller="controller" @media-change="change => actualField = change.field" @media-error="reason => error = reason.message" />
    <q-btn label="Preparar" @click="prepare" />
    <q-btn v-if="fixture.name === 'list-repeated-group'" label="Reordenar" @click="reorder" />
    <pre data-testid="snapshot">{{ snapshot }}</pre>
    <p role="alert">{{ error }}</p>
  </main>
</template>
