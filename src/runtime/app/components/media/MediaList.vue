<script setup lang="ts">
import type { QfbMediaController, QfbMediaValue } from '../../media/types'
import MediaItem from './MediaItem.vue'

withDefaults(
  defineProps<{ values: QfbMediaValue[], controller?: QfbMediaController, readonly?: boolean, gallery?: boolean }>(),
  { readonly: true },
)
const emit = defineEmits<{ remove: [clientId: string], error: [error: Error] }>()
</script>

<template>
  <div class="qfb-media-list" :class="{ 'qfb-media-list--gallery': gallery }">
    <MediaItem
      v-for="value in values"
      :key="value.clientId"
      :item="value"
      :controller="controller"
      :readonly="readonly"
      :gallery="gallery"
      removable
      @remove="emit('remove', value.clientId)"
      @error="emit('error', $event)"
    />
  </div>
</template>

<style scoped>
.qfb-media-list {
  display: grid;
  gap: 0.5rem;
  min-width: 0;
}
.qfb-media-list--gallery {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
}
</style>
