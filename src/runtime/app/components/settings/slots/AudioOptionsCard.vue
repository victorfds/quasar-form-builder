<script setup lang="ts">
import { shallowRef } from 'vue'
import { useFormStore } from '#qfb/stores/formStore'
import { positiveNumber } from '../../../../utils/mediaPolicy'

const store = useFormStore()
const duration = shallowRef(store.activeField?.maxDurationSeconds || 300)
const formats = shallowRef<string[]>(store.activeField?.preferredMimeTypes || ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'])
</script>

<template>
  <q-card flat>
    <q-card-section class="column q-gutter-sm">
      <div class="qfb-settings-row">
        <label for="audio-max-duration" class="text-body2">Duração máxima (segundos)</label>
        <q-input v-model="duration" for="audio-max-duration" type="number" dense filled @update:model-value="value => store.onEnteredProp('maxDurationSeconds', positiveNumber(value))" />
      </div>
      <div class="qfb-settings-row">
        <label for="audio-formats" class="text-body2">Formatos preferidos</label>
        <q-select v-model="formats" for="audio-formats" :options="['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4']" multiple use-chips dense filled @update:model-value="value => store.onEnteredProp('preferredMimeTypes', value.length ? value : undefined)" />
      </div>
    </q-card-section>
  </q-card>
</template>
