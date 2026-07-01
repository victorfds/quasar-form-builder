<script setup lang="ts">
import { shallowRef } from 'vue'

const storageKeys = [
  'qfb-viewer-draft',
  'qfb-viewer-ready',
  'qfb-viewer-invalid',
  'qfb-viewer-submit',
]

if (typeof localStorage !== 'undefined') {
  storageKeys.forEach(key => localStorage.removeItem(key))
}

const formFields = [
  {
    $formkit: 'q-input',
    name: 'name',
    label: 'Nome',
    inputType: 'text',
    validation: 'required',
  },
  {
    $formkit: 'q-btn',
    name: 'submit',
    buttonLabel: 'Finalizar',
    ignore: true,
    type: 'submit',
  },
]

const values = shallowRef<Record<string, unknown>>({})
const updateCount = shallowRef(0)
const fieldChangeCount = shallowRef(0)
const readyCount = shallowRef(0)
const invalidCount = shallowRef(0)
const submitCount = shallowRef(0)
const readyFieldsCount = shallowRef(0)
const latestChangedFields = shallowRef('')
const latestFieldChange = shallowRef('')

function writeJson(key: string, value: unknown) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

function onUpdateModelValues(payload: { values: Record<string, unknown>, changedFields: string[] }) {
  updateCount.value += 1
  latestChangedFields.value = payload.changedFields.join(',')
  writeJson('qfb-viewer-draft', payload.values)
}

function onFieldChange(payload: { name: string, value: unknown }) {
  fieldChangeCount.value += 1
  latestFieldChange.value = `${payload.name}:${String(payload.value ?? '')}`
}

function onViewerReady(payload: { values: Record<string, unknown>, fieldsCount: number }) {
  readyCount.value += 1
  readyFieldsCount.value = payload.fieldsCount
  writeJson('qfb-viewer-ready', {
    values: payload.values,
    fieldsCount: payload.fieldsCount,
  })
}

function onSubmitInvalid(payload: { values: Record<string, unknown> }) {
  invalidCount.value += 1
  writeJson('qfb-viewer-invalid', payload.values)
}

function onSubmit(data: Record<string, unknown>) {
  submitCount.value += 1
  writeJson('qfb-viewer-submit', data)
}
</script>

<template>
  <main class="q-pa-lg">
    <QfbFormViewer
      v-model="values"
      :form-fields="formFields"
      @update-model-values="onUpdateModelValues"
      @field-change="onFieldChange"
      @viewer-ready="onViewerReady"
      @submit-invalid="onSubmitInvalid"
      @submit="onSubmit"
    />

    <dl class="q-mt-lg">
      <dt>Pronto</dt>
      <dd data-testid="ready-count">
        {{ readyCount }}
      </dd>
      <dt>Campos renderizados</dt>
      <dd data-testid="ready-fields-count">
        {{ readyFieldsCount }}
      </dd>
      <dt>Atualizações</dt>
      <dd data-testid="update-count">
        {{ updateCount }}
      </dd>
      <dt>Campos alterados</dt>
      <dd data-testid="latest-changed-fields">
        {{ latestChangedFields }}
      </dd>
      <dt>Alterações por campo</dt>
      <dd data-testid="field-change-count">
        {{ fieldChangeCount }}
      </dd>
      <dt>Último campo</dt>
      <dd data-testid="latest-field-change">
        {{ latestFieldChange }}
      </dd>
      <dt>Envios inválidos</dt>
      <dd data-testid="invalid-count">
        {{ invalidCount }}
      </dd>
      <dt>Envios válidos</dt>
      <dd data-testid="submit-count">
        {{ submitCount }}
      </dd>
    </dl>
  </main>
</template>
