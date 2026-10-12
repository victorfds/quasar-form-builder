<script setup lang="ts">
import type { QfbMediaController, QfbRemoteMedia } from '../media/types'
import { computed, inject, shallowRef } from 'vue'
import { qfbMediaControllerKey } from '../media/injection'
import MediaItem from './media/MediaItem.vue'

const props = withDefaults(defineProps<{ items: QfbRemoteMedia[], mediaController?: QfbMediaController, readonly?: boolean, removable?: boolean, gallery?: boolean }>(), { readonly: true })
const emit = defineEmits<{ removeRequested: [item: QfbRemoteMedia], mediaError: [error: Error] }>()
const provided = inject(qfbMediaControllerKey, shallowRef(undefined))
const controller = computed(() => props.mediaController || provided.value)
const locked = computed(() => props.readonly || controller.value?.readonly.value)
</script>

<template>
  <div class="qfb-media-attachments">
    <MediaItem v-for="item in items" :key="item.kind === 'linked' ? item.value.clientId : item.document.documentId" :item="item.kind === 'linked' ? item.value : item.document" :controller="controller" :readonly="locked" :removable="removable" :gallery="gallery" @remove="emit('removeRequested', item)" @error="emit('mediaError', $event)" />
  </div>
</template>

<style scoped>
.qfb-media-attachments { display: grid; gap: 0.5rem; }
</style>
