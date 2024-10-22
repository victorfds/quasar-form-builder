<script setup lang="ts">
const { dark, localStorage } = useQuasar()
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

function toggleThemeFn(newState: boolean) {
  const localTheme = newState ? 'dark' : 'light'
  dark.set(newState)
  localStorage.set('theme', localTheme)
}
</script>

<template>
  <q-layout view="hHh lpR fFf">
    <q-header bordered class="text-white" height-hint="98" :class="dark.isActive ? 'bg-grey-10' : 'bg-white'">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer"
          :color="dark.isActive ? 'grey-11' : 'blue-grey-8'" />

        <q-toolbar-title :class="dark.isActive ? 'text-grey-11' : 'text-blue-grey-10'">
          Construtor de formulário
        </q-toolbar-title>
        <ClientOnly>
          <q-toggle :model-value="dark.isActive" checked-icon="dark_mode" unchecked-icon="light_mode" size="3rem"
            color="primary" keep-color @update:model-value="toggleThemeFn" />
        </ClientOnly>
        <q-btn dense flat round icon="menu" @click="toggleRightDrawer"
          :color="dark.isActive ? 'grey-5' : 'blue-grey-8'" />

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
