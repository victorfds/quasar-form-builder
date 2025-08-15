<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QInputProps } from 'quasar'

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
  if (/^\d{4}[\/-]\d{2}[\/-]\d{2}$/.test(s)) {
    // YYYY/MM/DD or YYYY-MM-DD
    const [yy, mm, dd] = s.replace(/-/g, '/').split('/')
    y = Number(yy); m = Number(mm); d = Number(dd)
  } else if (/^\d{2}[\/-]\d{2}[\/-]\d{4}$/.test(s)) {
    // DD/MM/YYYY or DD-MM-YYYY
    const [dd, mm, yy] = s.replace(/-/g, '/').split('/')
    y = Number(yy); m = Number(mm); d = Number(dd)
  } else {
    return null
  }
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
</script>

<template>
  <q-input filled :model-value="context.value?.join(',')" v-bind="context.attrs" :error-message="getMessages" :error="hasError"
    :label="context.label" :hint="context.attrs.description" @update:model-value="(val) => context?.node.input(val)"
    @blur="checkForErrorMessages" :mask="formatedMask" :rules="[(val, rule) => !rule.date(val) || 'Data inválida']"
    hide-bottom-space>
    <template #append>
      <q-icon name="event" class="cursor-pointer">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-date :model-value="context.value" :mask="mask" today-btn :options="optionsFn" :range="context.attrs.range" multiple
            @update:model-value="(val) => context?.node.input(val)" :readonly="context.attrs.readonly">
            <div class="row items-center justify-end">
              <q-btn v-close-popup label="Fechar" color="primary" flat />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>
