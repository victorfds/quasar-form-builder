<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QInputProps } from 'quasar'

type RangeValidationParams = {
  inputValue: string | null | undefined
  clamp: boolean
  rawMin?: string
  rawMax?: string
}

const props = defineProps<{ context: FormKitFrameworkContext & { attrs: QInputProps } }>()

const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)

const mask = computed(() => (props.context?.attrs as any)?.mask || 'DD/MM/YYYY')
const formatedMask = computed(() => {
  return mask.value.replace(/[A-Za-z]+/g, (match: string) => '#'.repeat(match.length))
})

function toComparableNumber(dateStr?: string | null): number | null {
  if (!dateStr) return null
  // Supports: YYYY/MM/DD, YYYY-MM-DD
  //           DD/MM/YYYY, DD-MM-YYYY
  let y = 0, m = 0, d = 0
  const s = String(dateStr)
  const isYmd = /^\d{4}[\/-]\d{2}[\/-]\d{2}$/.test(s)
  if (isYmd) {
    const [yy, mm, dd] = s.replace(/-/g, '/').split('/')
    y = Number(yy)
    m = Number(mm)
    d = Number(dd)
  }
  const isDmy = /^\d{2}[\/-]\d{2}[\/-]\d{4}$/.test(s)
  if (!isYmd && isDmy) {
    const [dd, mm, yy] = s.replace(/-/g, '/').split('/')
    y = Number(yy)
    m = Number(mm)
    d = Number(dd)
  }
  if (!isYmd && !isDmy) return null
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null
  return y * 10000 + m * 100 + d
}

const minDateNum = computed(() => toComparableNumber((props.context?.attrs as any)?.min))
const maxDateNum = computed(() => toComparableNumber((props.context?.attrs as any)?.max))

function optionsFn(date: string): boolean {
  const current = toComparableNumber(date)
  if (current == null) return true
  if (minDateNum.value != null && current < minDateNum.value) return false
  if (maxDateNum.value != null && current > maxDateNum.value) return false
  return true
}

const rangeError = ref('')

function validateAndMaybeClamp({ inputValue, clamp, rawMin, rawMax }: RangeValidationParams) {
  rangeError.value = ''
  const current = toComparableNumber(inputValue || '')
  if (current == null) return

  const effectiveRawMin = rawMin ?? ((props.context?.attrs as any)?.min as string | undefined)
  const effectiveRawMax = rawMax ?? ((props.context?.attrs as any)?.max as string | undefined)

  if (minDateNum.value != null && current < minDateNum.value) {
    if (!(clamp && effectiveRawMin)) {
      rangeError.value = 'Data menor que a mínima permitida'
      return
    }
    props.context?.node.input(effectiveRawMin)
    rangeError.value = ''
    return
  }

  if (maxDateNum.value != null && current > maxDateNum.value) {
    if (!(clamp && effectiveRawMax)) {
      rangeError.value = 'Data maior que a máxima permitida'
      return
    }
    props.context?.node.input(effectiveRawMax)
    rangeError.value = ''
    return
  }
}

function handleInputUpdate(val: any) {
  props.context?.node.input(val)
  validateAndMaybeClamp({ inputValue: val, clamp: false })
}

function handleBlur() {
  checkForErrorMessages()
  validateAndMaybeClamp({ inputValue: props.context?.value as any, clamp: true })
}
</script>

<template>
  <q-input filled :model-value="context.value" :error-message="rangeError || getMessages"
    :error="hasError || Boolean(rangeError)" :label="context.label" :hint="context.attrs.description" :dense="context.attrs.dense"
    @update:model-value="handleInputUpdate" @blur="handleBlur" :mask="formatedMask" :rules="[(val) => !!val || true]"
    hide-bottom-space>
    <template #append>
      <q-icon name="event" class="cursor-pointer">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-date :model-value="context.value" :mask="mask" today-btn :options="optionsFn"
            :emit-immediately="context.attrs.emitImmediately" @update:model-value="(val) => context?.node.input(val)"
            :readonly="context.attrs.readonly">
            <div class="row items-center justify-end">
              <q-btn v-close-popup label="Fechar" color="primary" flat />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>
