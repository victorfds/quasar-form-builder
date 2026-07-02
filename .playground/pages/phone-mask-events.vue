<script setup lang="ts">
const storageKey = 'qfb-phone-mask-draft'

if (typeof localStorage !== 'undefined') {
  localStorage.removeItem(storageKey)
}

const values = shallowRef<Record<string, unknown>>({})
const fillMask = shallowRef(true)
const reverseFillMask = shallowRef(true)
const unmaskedValue = shallowRef(true)

const formFields = computed(() => [
  {
    '$formkit': 'q-input',
    'name': 'phone',
    'label': 'Telefone',
    'inputType': 'tel',
    'mask': '(##) #####-####',
    'fill-mask': fillMask.value,
    'reverse-fill-mask': reverseFillMask.value,
    'unmasked-value': unmaskedValue.value,
  },
])

function onUpdateModelValues(payload: { values: Record<string, unknown> }) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(storageKey, JSON.stringify(payload.values))
}

function toggleUnmaskedValue() {
  unmaskedValue.value = !unmaskedValue.value
}
</script>

<template>
  <main class="q-pa-lg">
    <button type="button" data-testid="toggle-unmasked-value" @click="toggleUnmaskedValue">
      Alternar valor sem máscara
    </button>
    <output data-testid="phone-unmasked-state">{{ String(unmaskedValue) }}</output>

    <QfbFormViewer
      v-model="values"
      :form-fields="formFields"
      @update-model-values="onUpdateModelValues"
    />

    <output data-testid="phone-model-value">{{ values.phone }}</output>
  </main>
</template>
