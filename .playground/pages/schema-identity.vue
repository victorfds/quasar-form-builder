<script setup lang="ts">
import { cloneQfbSchemaAsTemplate } from 'nuxt-quasar-form-builder/schema'
import { onMounted, shallowRef } from 'vue'
import { useQfbBuilderControls, useQfbFormStore } from '#imports'

const store = useQfbFormStore()
const controls = useQfbBuilderControls()
const ready = shallowRef(false)
const error = shallowRef('')
onMounted(() => {
  store.setFormFields([{ $formkit: 'q-container', name: 'group', children: [{ $formkit: 'q-input', name: 'question', label: 'Pergunta', inputType: 'text' }, { $formkit: 'q-input', name: 'dependent', label: 'Dependente', inputType: 'text', if: '$question == "question"' }] }])
  ready.value = true
})
function rename() {
  const field = store.getFieldByName('question') || store.getFieldByName('renamed_question')
  if (!field) return
  const result = store.updateNameField(field.name, field.name === 'question' ? 'renamed_question' : 'question')
  error.value = result instanceof Error ? result.message : ''
}
function duplicate() { store.copyField(0, store.formFields[0]) }
function template() { store.setFormFields(cloneQfbSchemaAsTemplate(store.formFields)) }
</script>

<template>
  <main class="q-pa-md">
    <div class="row items-center q-gutter-sm q-mb-md">
      <h1 class="text-h6 q-ma-none">Identidade do schema</h1>
      <q-btn label="Renomear pergunta" icon="edit" @click="rename" />
      <q-btn label="Duplicar grupo" icon="content_copy" @click="duplicate" />
      <q-btn label="Novo modelo" icon="note_add" @click="template" />
      <q-btn icon="undo" aria-label="Desfazer" :disable="!controls.canUndo.value" @click="controls.undo" />
      <q-btn icon="redo" aria-label="Refazer" :disable="!controls.canRedo.value" @click="controls.redo" />
    </div>
    <div v-if="error" role="alert">{{ error }}</div>
    <QfbFormBuilder v-if="ready" />
    <pre data-testid="identity-schema" style="white-space: pre-wrap; overflow-wrap: anywhere;">{{ JSON.stringify(store.formFields, null, 2) }}</pre>
  </main>
</template>
