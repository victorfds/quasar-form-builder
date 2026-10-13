<script setup lang="ts">
import type { QfbMediaController, QfbMediaFieldValue } from '../../types/media'
import { computed, provide } from 'vue'
import { qfbMediaControllerKey, qfbMediaErrorKey, qfbViewerReadonlyKey } from '../constants/injectionKeys'

const props = withDefaults(
  defineProps<{
    name?: string
    fieldId?: string
    label?: string
    description?: string
    readonly?: boolean
    disabled?: boolean
    multiple?: boolean
    maxFiles?: number
    maxFileSize?: number
    maxTotalSize?: number
    maxDurationSeconds?: number
    preferredMimeTypes?: string[]
    validation?: string
    mediaController?: QfbMediaController
  }>(),
  { name: 'audio', maxDurationSeconds: 300 },
)
const emit = defineEmits<{ mediaError: [error: import('../../types/media').QfbMediaErrorDescription] }>()
const value = defineModel<QfbMediaFieldValue | File | File[]>({ default: null })
provide(
  qfbMediaControllerKey,
  computed(() => props.mediaController),
)
provide(qfbMediaErrorKey, error => emit('mediaError', error))
provide(
  qfbViewerReadonlyKey,
  computed(() => Boolean(props.readonly)),
)
</script>

<template>
  <FormKit v-model="value" type="q-audio-recorder" v-bind="props" :attrs="{ description, readonly, disabled }" />
</template>
