<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QInputProps } from 'quasar'


const props = defineProps<{ context: FormKitFrameworkContext & { attrs: QInputProps } }>()

const { hasError, getMessages } = useValidationMessages(props.context?.node)

const mask = computed(() => (props.context?.attrs as any)?.mask || 'DD/MM/YYYY')
const displayValue = computed(() => {
  const v: any = props.context?.value
  if (Array.isArray(v)) return v.filter(Boolean).join(', ')
  return v ? String(v) : ''
})

function toComparableNumber(dateStr?: string | null, maskStr?: string | null): number | null {
  if (!dateStr) return null
  const s = String(dateStr)
  if (maskStr) {
    const tokens = String(maskStr).toUpperCase().replace(/-/g, '/').split('/')
    const vals = s.replace(/-/g, '/').split('/')
    if (tokens.length !== 3 || vals.length !== 3) return null
    const yi = tokens.indexOf('YYYY')
    const mi = tokens.indexOf('MM')
    const di = tokens.indexOf('DD')
    if (yi < 0 || mi < 0 || di < 0) return null
    const y = Number(vals[yi])
    const m = Number(vals[mi])
    const d = Number(vals[di])
    if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null
    return y * 10000 + m * 100 + d
  }
  const parts = s.replace(/-/g, '/').split('/')
  if (parts.length === 3) {
    const y = Number(parts[0])
    const m = Number(parts[1])
    const d = Number(parts[2])
    if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null
    return y * 10000 + m * 100 + d
  }
  return null
}

const minDateNum = computed(() => toComparableNumber((props.context?.attrs as any)?.min, mask.value))
const maxDateNum = computed(() => toComparableNumber((props.context?.attrs as any)?.max, mask.value))

function optionsFn(date: string): boolean {
  const current = toComparableNumber(date, 'YYYY/MM/DD')
  if (current == null) return true
  if (minDateNum.value != null && current < minDateNum.value) return false
  if (maxDateNum.value != null && current > maxDateNum.value) return false
  return true
}

</script>

<template>
  <q-input filled :model-value="displayValue" :error-message="getMessages"
    :error="hasError" :label="context.label" :hint="context.attrs.description" :dense="context.attrs.dense"
    readonly inputmode="none" :rules="[(val) => !!val || true]" hide-bottom-space>
    <template #append>
      <q-icon name="event" class="cursor-pointer">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-date :model-value="context.value" :mask="mask" today-btn :options="optionsFn"
            :emit-immediately="context.attrs.emitImmediately" @update:model-value="(val) => context?.node.input(val)"
            :readonly="context.attrs.readonly" multiple>
            <div class="row items-center justify-end">
              <q-btn v-close-popup label="Fechar" color="primary" flat />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>
