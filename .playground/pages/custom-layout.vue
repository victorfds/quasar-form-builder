<script setup lang="ts">
const controls = useQfbBuilderControls()
const leftDrawer = controls.isElementsDrawerOpened
const rightDrawer = controls.isPropertiesDrawerOpened
</script>

<template>
  <q-layout view="hHh lpR fFf">
    <q-header bordered class="bg-dark text-white">
      <q-toolbar>
        <q-btn flat dense icon="arrow_back" data-testid="custom-back" />
        <q-toolbar-title>Layout próprio</q-toolbar-title>
        <q-btn dense no-caps color="primary" label="Pré-visualizar" data-testid="custom-preview" @click="controls.updatePreviewMode('previewing')" />
        <span class="q-ml-sm text-caption" data-testid="preview-mode">{{ controls.previewMode.value }}</span>
      </q-toolbar>
    </q-header>

    <QfbElementsDrawer v-model="leftDrawer">
      <template #before>
        <div class="q-pa-sm text-caption" data-testid="left-drawer-extra">
          Catálogo customizado
        </div>
      </template>
    </QfbElementsDrawer>

    <QfbPropertiesDrawer v-model="rightDrawer">
      <template #after="{ formStore }">
        <div class="q-pa-md text-caption" data-testid="properties-extra">
          Nome atual: {{ formStore.formSettings.formName }}
        </div>
      </template>
    </QfbPropertiesDrawer>

    <q-page-container>
      <q-page>
        <ClientOnly>
          <QfbFormBuilder />
        </ClientOnly>
      </q-page>
    </q-page-container>
  </q-layout>
</template>
