<script setup lang="ts">
const isElementsDrawerOpened = ref(false)
const isFormSettingsDrawerOpened = ref(false)

// Global state
const offsetPage = useState<number>('offset', () => 168)

function toggleLeftDrawer() {
  isElementsDrawerOpened.value = !isElementsDrawerOpened.value
}

function toggleRightDrawer() {
  isFormSettingsDrawerOpened.value = !isFormSettingsDrawerOpened.value
}

function fnTweak(offset: number) {
  offsetPage.value = offset
  return { minHeight: offset ? `calc(100vh - ${offset}px)` : '100vh' }
}
</script>

<template>
  <q-layout view="hHh lpR fFf">
    <q-header bordered class="bg-primary text-white" height-hint="98">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          <q-avatar>
            <img src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg">
          </q-avatar>
          Title
        </q-toolbar-title>

        <q-btn dense flat round icon="menu" @click="toggleRightDrawer" />
      </q-toolbar>
    </q-header>

    <TheElementsDrawer v-model="isElementsDrawerOpened" />

    <TheFormSettingsDrawer v-model="isFormSettingsDrawerOpened" />

    <q-page-container>
      <q-page :style-fn="fnTweak">
        <slot />
      </q-page>
    </q-page-container>
  </q-layout>
</template>
