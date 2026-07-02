<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useFormStore } from '#qfb/stores/formStore'

const formStore = useFormStore()
const { onEnteredProp } = formStore

const elementStates = reactive({
  accept: formStore.activeField?.accept || '',
  multiple: Boolean(formStore.activeField?.multiple) || false,
  maxFileSize: formStore.activeField?.maxFileSize || '',
  maxTotalSize: formStore.activeField?.maxTotalSize || '',
  maxFiles: formStore.activeField?.maxFiles || '',
  useChips: Boolean(formStore.activeField?.useChips) || false,
  counter: Boolean(formStore.activeField?.counter) || false,
  clearable: Boolean(formStore.activeField?.clearable) || false,
  disable: Boolean(formStore.activeField?.disable) || false,
})

const acceptInputRef = ref<HTMLInputElement | null>(null)
const maxFileSizeInputRef = ref<HTMLInputElement | null>(null)
const maxTotalSizeInputRef = ref<HTMLInputElement | null>(null)
const maxFilesInputRef = ref<HTMLInputElement | null>(null)

function onClickLabel(refElement: HTMLInputElement | null) {
  refElement?.focus()
}
</script>

<template>
  <q-card flat>
    <q-card-section>
      <div class="column q-gutter-sm">
        <div class="row align-center items-center justify-between">
          <label for="file-accept" @click="onClickLabel(acceptInputRef)">
            <span class="text-body2">Accept</span>
          </label>
          <q-input
            id="file-accept"
            ref="acceptInputRef"
            :model-value="elementStates.accept" hide-bottom-space filled class="mw-200" color="cyan-8" dense
            placeholder="e.g. image/*, .pdf, .docx"
            @update:model-value="val => { elementStates.accept = val; onEnteredProp('accept', val) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="file-multiple">
            <span class="text-body2">Multiple files</span>
          </label>
          <q-toggle
            id="file-multiple"
            :model-value="elementStates.multiple" color="primary"
            @update:model-value="val => { elementStates.multiple = val; onEnteredProp('multiple', val) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="file-max-size" @click="onClickLabel(maxFileSizeInputRef)">
            <span class="text-body2">Max file size (bytes)</span>
          </label>
          <q-input
            id="file-max-size"
            ref="maxFileSizeInputRef"
            :model-value="elementStates.maxFileSize" type="number" hide-bottom-space filled class="mw-200" color="cyan-8" dense
            @update:model-value="val => { elementStates.maxFileSize = val; onEnteredProp('maxFileSize', val) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="file-max-total-size" @click="onClickLabel(maxTotalSizeInputRef)">
            <span class="text-body2">Max total size (bytes)</span>
          </label>
          <q-input
            id="file-max-total-size"
            ref="maxTotalSizeInputRef"
            :model-value="elementStates.maxTotalSize" type="number" hide-bottom-space filled class="mw-200" color="cyan-8" dense
            @update:model-value="val => { elementStates.maxTotalSize = val; onEnteredProp('maxTotalSize', val) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="file-max-files" @click="onClickLabel(maxFilesInputRef)">
            <span class="text-body2">Max files</span>
          </label>
          <q-input
            id="file-max-files"
            ref="maxFilesInputRef"
            :model-value="elementStates.maxFiles" type="number" hide-bottom-space filled class="mw-200" color="cyan-8" dense
            @update:model-value="val => { elementStates.maxFiles = val; onEnteredProp('maxFiles', val) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="file-use-chips">
            <span class="text-body2">Use chips for selected files</span>
          </label>
          <q-toggle
            id="file-use-chips"
            :model-value="elementStates.useChips" color="primary"
            @update:model-value="val => { elementStates.useChips = val; onEnteredProp('useChips', val) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="file-counter">
            <span class="text-body2">Show counter</span>
          </label>
          <q-toggle
            id="file-counter"
            :model-value="elementStates.counter" color="primary"
            @update:model-value="val => { elementStates.counter = val; onEnteredProp('counter', val) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="file-clearable">
            <span class="text-body2">Clearable</span>
          </label>
          <q-toggle
            id="file-clearable"
            :model-value="elementStates.clearable" color="primary"
            @update:model-value="val => { elementStates.clearable = val; onEnteredProp('clearable', val) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="file-disable">
            <span class="text-body2">Disable</span>
          </label>
          <q-toggle
            id="file-disable"
            :model-value="elementStates.disable" color="primary"
            @update:model-value="val => { elementStates.disable = val; onEnteredProp('disable', val) }"
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>
