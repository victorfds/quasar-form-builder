<script setup lang="ts">
const { dark } = useQuasar()
const formStore = useFormStore()
const { onEnteredProp } = formStore

const DEFAULT_DATE_MASK = 'DD/MM/YYYY'

const elementStates = reactive({
  min: formStore.activeField?.min || '',
  max: formStore.activeField?.max || '',
  mask: formStore.activeField?.mask || DEFAULT_DATE_MASK,
  range: Boolean(formStore.activeField?.range) || false,
  multiple: Boolean(formStore.activeField?.multiple) || false,
  emitImmediately: Boolean(formStore.activeField?.emitImmediately) || false,
  defaultYearMonth: formStore.activeField?.defaultYearMonth || '',
  disabledDates: (formStore.activeField?.disabledDates as string[] | undefined) || [],
})

const minRef = ref<HTMLInputElement | null>(null)
const maxRef = ref<HTMLInputElement | null>(null)
const maskRef = ref<HTMLInputElement | null>(null)
const defaultYearMonthRef = ref<HTMLInputElement | null>(null)

const inputMask = computed(() => {
  const mask = isValidMask(elementStates.mask) ? elementStates.mask : DEFAULT_DATE_MASK
  return mask.replace(/[A-Za-z]+/g, (match: string) => '#'.repeat(match.length))
})

const dateValidationRules = computed(() => {
  const currentMask = elementStates.mask || DEFAULT_DATE_MASK

  const parts = currentMask.match(/([A-Za-z]+)/g) || []
  const hasDay = parts.includes('DD')
  const hasMonth = parts.includes('MM')
  const hasYear = parts.includes('YYYY')

  const rules = []

  if (hasDay) {
    rules.push((val: string) => {
      if (!val) return true
      const dayPart = val.split(/[\/\-]/)[parts.indexOf('DD')]
      if (!dayPart) return true
      const day = parseInt(dayPart)
      return (day >= 1 && day <= 31) || 'Dia deve estar entre 1 e 31'
    })
  }

  if (hasMonth) {
    rules.push((val: string) => {
      if (!val) return true
      const monthPart = val.split(/[\/\-]/)[parts.indexOf('MM')]
      if (!monthPart) return true
      const month = parseInt(monthPart)
      return (month >= 1 && month <= 12) || 'Mês deve estar entre 1 e 12'
    })
  }

  if (hasYear) {
    rules.push((val: string) => {
      if (!val) return true
      const yearPart = val.split(/[\/\-]/)[parts.indexOf('YYYY')]
      if (!yearPart) return true
      const year = parseInt(yearPart)
      return (year >= 1900 && year <= 2100) || 'Ano deve estar entre 1900 e 2100'
    })
  }

  return rules
})

const maskValidationRules = computed(() => [
  (val: string) => {
    if (!val) return true
    const mask = val.trim()
    if (mask.length === 0) return true

    const validFormats = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY/MM/DD', 'DD-MM-YYYY', 'MM-DD-YYYY', 'YYYY-MM-DD']
    if (!validFormats.includes(mask)) {
      return 'Formato inválido. Use DD/MM/YYYY, MM/DD/YYYY, YYYY/MM/DD ou com hífens'
    }
    return true
  }
])

function isValidMask(mask: string): boolean {
  const validFormats = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY/MM/DD', 'DD-MM-YYYY', 'MM-DD-YYYY', 'YYYY-MM-DD']
  return validFormats.includes(mask.trim())
}

function onClickLabel(refElement: HTMLInputElement | null, { select = false }: { select?: boolean } = {}) {
  refElement?.focus()
  if (select) refElement?.select()
}

watch(() => formStore.activeField, (val) => {
  elementStates.min = val?.min || ''
  elementStates.max = val?.max || ''
  elementStates.mask = val?.mask || ''
  elementStates.range = Boolean(val?.range) || false
  elementStates.multiple = Boolean(val?.multiple) || false
  elementStates.emitImmediately = Boolean(val?.emitImmediately) || false
  elementStates.defaultYearMonth = val?.defaultYearMonth || ''
  elementStates.disabledDates = (val?.disabledDates as string[] | undefined) || []
}, { deep: true })
</script>

<template>
  <q-card flat>
    <q-card-section>
      <div class="column q-gutter-sm">
        <div class="column">
          <div class="row align-center items-center justify-between">
            <label for="min-date" @click="onClickLabel(minRef)">
              <span class="text-body2">Data mínima</span>
            </label>
            <q-input id="min-date" ref="minRef" :model-value="elementStates.min" hide-bottom-space filled class="mw-200"
              color="cyan-8" dense :placeholder="elementStates.mask || DEFAULT_DATE_MASK" :mask="inputMask"
              :rules="dateValidationRules"
              @update:model-value="val => { elementStates.min = val; onEnteredProp('min', val) }">
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy transition-show="scale" transition-hide="scale">
                    <q-date :model-value="elementStates.min" :mask="elementStates.mask || DEFAULT_DATE_MASK"
                      :today-btn="true" bordered
                      @update:model-value="val => { elementStates.min = val as string; onEnteredProp('min', val) }" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="row align-center items-center justify-between q-mt-sm">
            <label for="max-date" @click="onClickLabel(maxRef)">
              <span class="text-body2">Data máxima</span>
            </label>
            <q-input id="max-date" ref="maxRef" :model-value="elementStates.max" hide-bottom-space filled class="mw-200"
              color="cyan-8" dense :placeholder="elementStates.mask || DEFAULT_DATE_MASK" :mask="inputMask"
              :rules="dateValidationRules"
              @update:model-value="val => { elementStates.max = val; onEnteredProp('max', val) }">
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy transition-show="scale" transition-hide="scale">
                    <q-date :model-value="elementStates.max" :mask="elementStates.mask || DEFAULT_DATE_MASK"
                      :today-btn="true" bordered
                      @update:model-value="val => { elementStates.max = val as string; onEnteredProp('max', val) }" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
        </div>

        <div class="row align-center items-center justify-between">
          <label for="mask" @click="onClickLabel(maskRef)">
            <span class="text-body2">Máscara</span>
          </label>
          <q-input id="mask" ref="maskRef" :model-value="elementStates.mask" hide-bottom-space filled class="mw-200"
            color="cyan-8" dense placeholder="DD/MM/YYYY (opcional)" maxlength="10" :rules="maskValidationRules"
            @update:model-value="val => { elementStates.mask = String(val).toUpperCase(); onEnteredProp('mask', String(val).toUpperCase()) }" />
        </div>

        <div class="row align-center items-center justify-between">
          <label @click="() => { }">
            <span class="text-body2">Intervalo</span>
          </label>
          <q-toggle :model-value="elementStates.range" color="primary"
            @update:model-value="val => { elementStates.range = val; onEnteredProp('range', val) }" />
        </div>

        <div class="row align-center items-center justify-between">
          <label @click="() => { }">
            <span class="text-body2">Emitir imediatamente</span>
          </label>
          <q-toggle :model-value="elementStates.emitImmediately" color="primary"
            @update:model-value="val => { elementStates.emitImmediately = val; onEnteredProp('emitImmediately', val) }" />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="default-year-month" @click="onClickLabel(defaultYearMonthRef)">
            <span class="text-body2">Ano/mês padrão</span>
          </label>
          <q-input id="default-year-month" ref="defaultYearMonthRef" :model-value="elementStates.defaultYearMonth"
            hide-bottom-space filled class="mw-200" color="cyan-8" dense placeholder="YYYY/MM"
            @update:model-value="val => { elementStates.defaultYearMonth = val; onEnteredProp('defaultYearMonth', val) }" />
        </div>

        <div class="column">
          <div class="row align-center items-center justify-between">
            <label>
              <span class="text-body2">Datas desabilitadas</span>
            </label>
            <q-icon name="event" class="cursor-pointer" size="sm" :color="dark.isActive ? 'grey-5' : 'blue-grey-5'">
              <q-popup-proxy transition-show="scale" transition-hide="scale">
                <q-date :mask="elementStates.mask || DEFAULT_DATE_MASK" :multiple="true"
                  :model-value="elementStates.disabledDates"
                  @update:model-value="val => { elementStates.disabledDates = val as string[]; onEnteredProp('disabledDates', val) }">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup flat color="primary" label="Fechar" />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </div>

          <div class="row q-mt-sm">
            <q-chip v-for="d in elementStates.disabledDates" :key="d" removable color="primary" text-color="white"
              @remove="() => { elementStates.disabledDates = elementStates.disabledDates.filter(x => x !== d); onEnteredProp('disabledDates', elementStates.disabledDates) }">
              {{ d }}
            </q-chip>
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>
