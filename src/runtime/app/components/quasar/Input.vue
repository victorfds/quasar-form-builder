<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QInputProps } from 'quasar'
import { builderModeKey } from '#qfb/constants/injectionKeys'

const props = defineProps<{ context: FormKitFrameworkContext & { attrs: { inputType: QInputProps['type'] } } }>()

const maskTokenPattern = /[#SNAaXx]/g
const maskValuePattern = /[a-z0-9]/gi
const inputPropNames = [
  'clearable',
  'counter',
  'autogrow',
  'loading',
  'stackLabel',
  'debounce',
  'mask',
  'fill-mask',
  'reverse-fill-mask',
  'unmasked-value',
  'prefix',
  'suffix',
  'filled',
  'outlined',
  'standout',
  'borderless',
  'rounded',
  'square',
  'dark',
  'readonly',
  'disable',
  'disabled',
]
const hiddenBlockedAttrNames = new Set([
  ...inputPropNames,
  'description',
  'inputType',
])

const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
const errorActive = computed(() => hasError.value || (props.context?.state?.submitted && props.context?.state?.valid === false) || (props.context?.state?.touched && props.context?.state?.valid === false))
const builderMode = inject(builderModeKey, false)
const formStore = useFormStore()
const inputResetToken = shallowRef(0)
const isEditing = computed(() => builderMode && formStore.formSettings.previewMode === 'editing')
const mergedAttrs = computed(() => getFormKitContextAttrs(props.context, inputPropNames))
const inputType = computed(() => props.context.attrs.inputType || 'text')
const isHiddenInput = computed(() => inputType.value === 'hidden')
const inputAttrs = computed(() => {
  const {
    columns: _columns,
    description: _description,
    inputType: _inputType,
    ...attrs
  } = mergedAttrs.value

  return getQuasarFieldDesignAttrs(attrs)
})
const maskTokenLimit = computed(() => {
  const mask = typeof inputAttrs.value.mask === 'string' ? inputAttrs.value.mask : ''
  return mask.match(maskTokenPattern)?.length || 0
})
const inputBehaviorKey = computed(() => [
  inputType.value,
  inputAttrs.value.mask || '',
  inputAttrs.value.fillMask ? 'fill' : 'no-fill',
  inputAttrs.value.reverseFillMask ? 'reverse' : 'forward',
  inputAttrs.value.unmaskedValue ? 'raw' : 'masked',
  inputResetToken.value,
].join('|'))
const hiddenInputAttrs = computed(() => {
  const {
    columns: _columns,
    description: _description,
    inputType: _inputType,
    ...attrs
  } = props.context.attrs || {}
  const nativeAttrs = Object.fromEntries(
    Object.entries(attrs).filter(([name]) => !hiddenBlockedAttrNames.has(name)),
  )

  return cleanUndefinedAttrs({
    ...nativeAttrs,
    disabled: mergedAttrs.value.disable || mergedAttrs.value.disabled ? true : undefined,
    readonly: mergedAttrs.value.readonly ? true : undefined,
  })
})

function getRawMaskedLength(value: unknown) {
  if (value === null || value === undefined) return 0
  return String(value).match(maskValuePattern)?.length || 0
}

function shouldGuardReverseMask() {
  return Boolean(inputAttrs.value.reverseFillMask && maskTokenLimit.value)
}

function getSelectedRawLength(input: HTMLInputElement) {
  const selectionStart = input.selectionStart ?? input.value.length
  const selectionEnd = input.selectionEnd ?? selectionStart
  return getRawMaskedLength(input.value.slice(selectionStart, selectionEnd))
}

function handleMaskedKeydown(ev: KeyboardEvent) {
  if (!shouldGuardReverseMask()) return
  if (ev.key.length !== 1 || ev.ctrlKey || ev.metaKey || ev.altKey) return

  const input = ev.target instanceof HTMLInputElement ? ev.target : null
  if (!input) return

  const nextRawLength = getRawMaskedLength(input.value) - getSelectedRawLength(input) + getRawMaskedLength(ev.key)
  if (nextRawLength > maskTokenLimit.value) ev.preventDefault()
}

function handleMaskedPaste(ev: ClipboardEvent) {
  if (!shouldGuardReverseMask()) return

  const input = ev.target instanceof HTMLInputElement ? ev.target : null
  const pastedText = ev.clipboardData?.getData('text') || ''
  if (!input || !pastedText) return

  const nextRawLength = getRawMaskedLength(input.value) - getSelectedRawLength(input) + getRawMaskedLength(pastedText)
  if (nextRawLength > maskTokenLimit.value) ev.preventDefault()
}

function handleUpdateModelValue(val: string | number | null) {
  if (
    inputAttrs.value.reverseFillMask
    && maskTokenLimit.value
    && getRawMaskedLength(val) > maskTokenLimit.value
  ) {
    inputResetToken.value += 1
    return
  }

  props.context?.node.input(val)
}
</script>

<template>
  <div v-if="isHiddenInput && isEditing" class="hidden-input-marker">
    (oculto)
  </div>
  <input
    v-else-if="isHiddenInput"
    v-bind="hiddenInputAttrs"
    type="hidden"
    :name="context.name"
    :value="context.value == null ? '' : String(context.value)"
  >
  <q-input
    v-else
    :key="inputBehaviorKey"
    v-bind="inputAttrs" :model-value="context.value" :label="context.label" :type="inputType"
    :hint="context.attrs.description" hide-bottom-space color="cyan-8" :error-message="getMessages" :error="errorActive"
    @update:model-value="handleUpdateModelValue" @keydown="handleMaskedKeydown" @paste="handleMaskedPaste"
    @blur="checkForErrorMessages"
  />
</template>

<style scoped>
.hidden-input-marker {
  background: transparent;
  border: 0;
  color: var(--overlay-accent-color, #2980b9);
  font-style: italic;
  line-height: 1.25rem;
  min-height: 1.25rem;
  opacity: .82;
  padding: 0;
  width: 100%;
}
</style>
