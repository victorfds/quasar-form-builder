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

    <TheLeftDrawer v-model="leftDrawerOpen" />

    <TheRightDrawer v-model="rightDrawerOpen" />

    <q-page-container>
      <q-page :style-fn="fnTweak">
        <slot />
      </q-page>
    </q-page-container>

  </q-layout>
</template>

<script setup lang="ts">

const leftDrawerOpen = ref(false)
const rightDrawerOpen = ref(false)

// Global state
const offsetPage = useState<number>('offset', () => 168)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function toggleRightDrawer() {
  rightDrawerOpen.value = !rightDrawerOpen.value
}

function fnTweak(offset: number, height: number) {
  offsetPage.value = offset
  return { minHeight: offset ? `calc(100vh - ${offset}px)` : '100vh' }
}


</script>
