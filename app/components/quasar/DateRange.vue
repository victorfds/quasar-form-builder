<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QInputProps } from 'quasar'

const props = defineProps<{ context: FormKitFrameworkContext & { attrs: QInputProps } }>()

const { dark } = useQuasar()
const { hasError, getMessages } = useValidationMessages(props.context?.node)

const mask = computed(() => (props.context?.attrs as any)?.mask || 'DD/MM/YYYY')

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

const disabledDatesSet = computed(() => {
  const raw = (props.context?.attrs as any)?.disabledDates as unknown
  const arr = Array.isArray(raw)
    ? raw as string[]
    : (typeof raw === 'string' ? String(raw).split(',').map(s => s.trim()).filter(Boolean) : [])
  const set = new Set<number>()
  for (const d of arr) {
    const n = toComparableNumber(d, mask.value)
    if (n != null) set.add(n)
  }
  return set
})

function optionsFn(date: string): boolean {
  const current = toComparableNumber(date, 'YYYY/MM/DD')
  if (current == null) return true
  if (minDateNum.value != null && current < minDateNum.value) return false
  if (maxDateNum.value != null && current > maxDateNum.value) return false
  if (disabledDatesSet.value.size && current != null && disabledDatesSet.value.has(current)) return false
  return true
}

const displayValue = computed(() => {
  const v: any = props.context?.value
  if (v && typeof v === 'object' && 'from' in v && 'to' in v) {
    const from = String((v as any).from || '')
    const to = String((v as any).to || '')
    return [from, to].filter(Boolean).join(' - ')
  }
  return v ? String(v) :  ''
})

const dateModel = computed(() => {
  const v: any = props.context?.value
  if (v && typeof v === 'object' && ('from' in v || 'to' in v)) {
    const from = (v as any).from || ''
    const to = (v as any).to || ''
    if (from || to) return { from, to }
  }
  return null
})
</script>

<template>
  <q-input filled :model-value="displayValue" :error-message="getMessages" color="cyan-8"
    :error="hasError" :label="context.label" :hint="context.attrs.description" :dense="context.attrs.dense"
    inputmode="none" :rules="[(val) => !!val || true]" hide-bottom-space :placeholder="context.attrs.placeholder"
    @keydown.stop.prevent @keypress.stop.prevent @beforeinput.stop.prevent @paste.stop.prevent @drop.stop.prevent @cut.stop.prevent>
    <template #append>
      <q-icon name="event" class="cursor-pointer" :color="dark.isActive ? 'grey-5' : 'blue-grey-5'">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-date :model-value="dateModel" :mask="mask" range today-btn :options="optionsFn"
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
