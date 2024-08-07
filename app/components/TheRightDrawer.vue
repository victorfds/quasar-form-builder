<template>
  <q-drawer class="no-scroll" show-if-above persistent v-model="model" side="right" bordered>
    <q-tabs vertical dense shrink class="rounded-borders bg-grey-10 text-grey-11 q-mr-sm q-mt-md"
      indicator-color="transparent" active-bg-color="secondary">
      <q-tab name="undo" icon="undo">
        <q-tooltip anchor="center right" self="center left" :offset="[2, 2]">
          Retroceder
        </q-tooltip>
      </q-tab>
      <q-tab name="redo" icon="redo">
        <q-tooltip anchor="center right" self="center left" :offset="[2, 2]">
          Avançar
        </q-tooltip>
      </q-tab>
    </q-tabs>
  </q-drawer>
</template>
<script setup lang="ts">
const model = defineModel()
</script>
