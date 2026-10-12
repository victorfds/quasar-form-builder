<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QFileProps } from 'quasar'
import { computed, shallowRef } from 'vue'
import { useValidationMessages } from '#qfb/composables/useValidationMessages'
import { getFormKitContextAttrs, getQuasarFieldDesignAttrs } from '#qfb/utils/quasarFieldDesign'
import { useQfbMediaField } from '../../composables/useQfbMediaField'
import MediaItem from '../media/MediaItem.vue'
import MediaList from '../media/MediaList.vue'

const props = defineProps<{
  context: FormKitFrameworkContext & { attrs: QFileProps & { description?: string, gallery?: boolean } }
}>()
const media = useQfbMediaField(props.context)
const selector = shallowRef<File | File[] | null>(null)

const filePropNames = [
  'accept',
  'multiple',
  'maxFileSize',
  'maxTotalSize',
  'maxFiles',
  'useChips',
  'counter',
  'clearable',
  'gallery',
  'mediaKind',
  'capture',
  'readonly',
  'disabled',
  'disable',
  'filled',
  'outlined',
  'standout',
  'borderless',
  'rounded',
  'square',
  'dark',
]

const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
const errorActive = computed(
  () =>
    hasError.value
    || (props.context?.state?.submitted && props.context?.state?.valid === false)
    || (props.context?.state?.touched && props.context?.state?.valid === false),
)
const legacyFiles = computed<File[]>(() => {
  const value = props.context._value
  return (Array.isArray(value) ? value : value ? [value] : []).filter(
    file => typeof File !== 'undefined' && file instanceof File,
  )
})
const mergedAttrs = computed(() => getFormKitContextAttrs(props.context, filePropNames))
const gallery = computed(() => Boolean(mergedAttrs.value.gallery))
const fileAttrs = computed(() => {
  const {
    columns: _columns,
    description: _description,
    gallery: _gallery,
    mediaKind: _kind,
    ...attrs
  } = mergedAttrs.value

  if (media.controller.value) {
    delete attrs.maxFiles
    delete attrs.maxTotalSize
    delete attrs.maxFileSize
  }
  return {
    ...getQuasarFieldDesignAttrs(attrs),
    append: Boolean(attrs.multiple),
    readonly: media.locked.value,
    disable: !media.canSelect.value,
  }
})
async function selected(value: File | File[] | null) {
  if (media.controller.value) {
    await media.select(value, true)
    selector.value = null
  }
  else if (!media.locked.value) {
    if (!value) media.clearErrors()
    await props.context.node.input(value)
  }
}
function rejected(entries: Array<{ file: File, failedPropValidation: string }>) {
  for (const entry of entries)
    media.error(new Error(`${entry.file.name}: arquivo rejeitado (${entry.failedPropValidation})`))
}
</script>

<template>
  <div>
    <q-file
      :model-value="media.controller.value ? selector : context._value"
      :label="context.label"
      :aria-label="context.label"
      :hint="context.attrs.description"
      hide-bottom-space
      color="cyan-8"
      :error-message="media.errors.value.join('; ') || getMessages"
      :error="Boolean(errorActive || media.errors.value.length)"
      :loading="media.busy.value"
      v-bind="fileAttrs"
      @change.capture="media.clearErrors"
      @clear="media.clearErrors"
      @update:model-value="selected"
      @rejected="rejected"
      @blur="checkForErrorMessages"
    >
      <template #prepend>
        <q-icon name="attach_file" />
      </template>
    </q-file>

    <MediaList
      v-if="media.controller.value && media.values.value.length"
      class="q-mt-sm"
      :values="media.values.value"
      :controller="media.controller.value"
      :readonly="media.locked.value || media.busy.value"
      :gallery="gallery"
      @remove="media.remove"
    />
    <div v-else-if="gallery && legacyFiles.length" class="file-gallery q-mt-sm">
      <MediaItem
        v-for="(file, index) in legacyFiles"
        :key="`${file.name}-${index}`"
        :item="{ documentId: '', name: file.name, mimeType: file.type, size: file.size }"
        :local-file="file"
        gallery
      />
    </div>
    <div v-if="media.recovery.value.length" class="q-mt-sm">
      <div class="text-caption q-mb-xs" role="status">
        Recuperação
      </div>
      <div v-for="item in media.recovery.value" :key="item.value.clientId" class="file-recovery">
        <span>{{ item.value.name }}</span>
        <q-btn
          flat
          dense
          icon="check"
          :disable="!media.canSelect.value"
          :aria-label="`Confirmar ${item.value.name}`"
          @click="media.confirmRecovery(item.value.clientId)"
        >
          <q-tooltip>Confirmar</q-tooltip>
        </q-btn>
        <q-btn
          flat
          dense
          icon="delete_outline"
          :disable="media.locked.value"
          :aria-label="`Descartar ${item.value.name}`"
          @click="media.discardRecovery(item.value.clientId)"
        >
          <q-tooltip>Descartar</q-tooltip>
        </q-btn>
      </div>
    </div>
    <div v-for="error in media.errors.value" :key="error" class="text-negative text-caption" role="alert">
      {{ error }}
    </div>
  </div>
</template>

<style scoped>
.file-gallery {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
}

.file-recovery {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.file-recovery span {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}
</style>
