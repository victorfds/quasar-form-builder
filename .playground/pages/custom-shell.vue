<script setup lang="ts">
const controls = useQfbBuilderControls()
const savedCount = shallowRef<number | null>(null)

function saveForm() {
  savedCount.value = controls.formStore.formFields.length
}
</script>

<template>
  <QfbBuilderShell title="Editor de Contratos" :show-theme-toggle="false">
    <template #header-before>
      <q-btn flat dense no-caps icon="arrow_back" label="Voltar" data-testid="back-button" />
    </template>

    <template #header-after>
      <q-btn color="primary" no-caps label="Salvar no banco" data-testid="save-button" @click="saveForm" />
      <span class="q-ml-sm text-caption" data-testid="save-status">
        {{ savedCount === null ? 'Não salvo' : `Salvo: ${savedCount}` }}
      </span>
    </template>

    <template #right-drawer-after="{ formFields }">
      <div class="q-pa-md text-caption" data-testid="right-drawer-extra">
        Campos no formulário: {{ formFields.length }}
      </div>
    </template>
  </QfbBuilderShell>
</template>
