<script setup lang="ts">
const { dark } = useQuasar()
const formStore = useFormStore()
const { onEnteredProp } = formStore

const elementStates = reactive({
  accept: formStore.activeField?.accept || '',
  multiple: Boolean(formStore.activeField?.multiple) || false,
  maxFileSize: formStore.activeField?.maxFileSize || '',
  maxTotalSize: formStore.activeField?.maxTotalSize || '',
  maxFiles: formStore.activeField?.maxFiles || '',
  autoUpload: Boolean(formStore.activeField?.autoUpload) || false,
  hideUploadBtn: Boolean(formStore.activeField?.hideUploadBtn) || false,
  useChips: Boolean(formStore.activeField?.useChips) || false,
  counter: Boolean(formStore.activeField?.counter) || false,
  clearable: Boolean(formStore.activeField?.clearable) || false,
  disable: Boolean(formStore.activeField?.disable) || false,
})

watch(() => formStore.activeField, (val) => {
  elementStates.accept = val?.accept || ''
  elementStates.multiple = Boolean(val?.multiple) || false
  elementStates.maxFileSize = val?.maxFileSize || ''
  elementStates.maxTotalSize = val?.maxTotalSize || ''
  elementStates.maxFiles = val?.maxFiles || ''
  elementStates.autoUpload = Boolean(val?.autoUpload) || false
  elementStates.hideUploadBtn = Boolean(val?.hideUploadBtn) || false
  elementStates.useChips = Boolean(val?.useChips) || false
  elementStates.counter = Boolean(val?.counter) || false
  elementStates.clearable = Boolean(val?.clearable) || false
  elementStates.disable = Boolean(val?.disable) || false
}, { deep: true })
</script>

<template>
  <q-card flat>
    <q-card-section>
      <div class="column q-gutter-sm">
        <div class="row align-center items-center justify-between">
          <label>
            <span class="text-body2">Accept</span>
          </label>
          <q-input :model-value="elementStates.accept" hide-bottom-space filled class="mw-200" color="cyan-8" dense
            placeholder="e.g. image/*, .pdf, .docx"
            @update:model-value="val => { elementStates.accept = val; onEnteredProp('accept', val) }" />
        </div>

        <div class="row align-center items-center justify-between">
          <label>
            <span class="text-body2">Multiple files</span>
          </label>
          <q-toggle :model-value="elementStates.multiple" color="primary"
            @update:model-value="val => { elementStates.multiple = val; onEnteredProp('multiple', val) }" />
        </div>

        <div class="row align-center items-center justify-between">
          <label>
            <span class="text-body2">Max file size (bytes)</span>
          </label>
          <q-input :model-value="elementStates.maxFileSize" type="number" hide-bottom-space filled class="mw-200" color="cyan-8" dense
            @update:model-value="val => { elementStates.maxFileSize = val; onEnteredProp('maxFileSize', val) }" />
        </div>

        <div class="row align-center items-center justify-between">
          <label>
            <span class="text-body2">Max total size (bytes)</span>
          </label>
          <q-input :model-value="elementStates.maxTotalSize" type="number" hide-bottom-space filled class="mw-200" color="cyan-8" dense
            @update:model-value="val => { elementStates.maxTotalSize = val; onEnteredProp('maxTotalSize', val) }" />
        </div>

        <div class="row align-center items-center justify-between">
          <label>
            <span class="text-body2">Max files</span>
          </label>
          <q-input :model-value="elementStates.maxFiles" type="number" hide-bottom-space filled class="mw-200" color="cyan-8" dense
            @update:model-value="val => { elementStates.maxFiles = val; onEnteredProp('maxFiles', val) }" />
        </div>

        <div class="row align-center items-center justify-between">
          <label>
            <span class="text-body2">Auto upload</span>
          </label>
          <q-toggle :model-value="elementStates.autoUpload" color="primary"
            @update:model-value="val => { elementStates.autoUpload = val; onEnteredProp('autoUpload', val) }" />
        </div>

        <div class="row align-center items-center justify-between">
          <label>
            <span class="text-body2">Hide upload button</span>
          </label>
          <q-toggle :model-value="elementStates.hideUploadBtn" color="primary"
            @update:model-value="val => { elementStates.hideUploadBtn = val; onEnteredProp('hideUploadBtn', val) }" />
        </div>

        <div class="row align-center items-center justify-between">
          <label>
            <span class="text-body2">Use chips for selected files</span>
          </label>
          <q-toggle :model-value="elementStates.useChips" color="primary"
            @update:model-value="val => { elementStates.useChips = val; onEnteredProp('useChips', val) }" />
        </div>

        <div class="row align-center items-center justify-between">
          <label>
            <span class="text-body2">Show counter</span>
          </label>
          <q-toggle :model-value="elementStates.counter" color="primary"
            @update:model-value="val => { elementStates.counter = val; onEnteredProp('counter', val) }" />
        </div>

        <div class="row align-center items-center justify-between">
          <label>
            <span class="text-body2">Clearable</span>
          </label>
          <q-toggle :model-value="elementStates.clearable" color="primary"
            @update:model-value="val => { elementStates.clearable = val; onEnteredProp('clearable', val) }" />
        </div>

        <div class="row align-center items-center justify-between">
          <label>
            <span class="text-body2">Disable</span>
          </label>
          <q-toggle :model-value="elementStates.disable" color="primary"
            @update:model-value="val => { elementStates.disable = val; onEnteredProp('disable', val) }" />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>


