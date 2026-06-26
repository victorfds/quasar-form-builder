<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QFileProps } from 'quasar'

const props = defineProps<{ context: FormKitFrameworkContext & { attrs: QFileProps & { description?: string, gallery?: boolean } } }>()

const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
const errorActive = computed(() => hasError.value || (props.context?.state?.submitted && props.context?.state?.valid === false) || (props.context?.state?.touched && props.context?.state?.valid === false))
const selectedFiles = computed<File[]>(() => {
  if (!props.context.value) return []
  return Array.isArray(props.context.value) ? props.context.value : [props.context.value as File]
})
const imageFiles = computed(() => selectedFiles.value.filter(file => file.type?.startsWith('image/')))
const fileAttrs = computed(() => {
  const {
    columns: _columns,
    description: _description,
    gallery: _gallery,
    ...attrs
  } = props.context.attrs

  return getQuasarFieldDesignAttrs(attrs)
})
</script>

<template>
  <div>
    <q-file
      :model-value="context.value"
      :label="context.label"
      :hint="context.attrs.description"
      hide-bottom-space
      color="cyan-8"
      :error-message="getMessages"
      :error="errorActive"
      v-bind="fileAttrs"
      @update:model-value="(val) => context?.node.input(val)"
      @blur="checkForErrorMessages"
    >
      <template #prepend>
        <q-icon name="attach_file" />
      </template>
    </q-file>

    <div v-if="context.attrs.gallery && imageFiles.length" class="file-gallery q-mt-sm">
      <div v-for="file in imageFiles" :key="`${file.name}-${file.size}`" class="file-gallery__item">
        {{ file.name }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.file-gallery {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
}

.file-gallery__item {
  border: 1px solid var(--line-color);
  border-radius: 6px;
  font-size: 0.75rem;
  overflow: hidden;
  padding: 0.5rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
