<script setup lang="ts">
const { dark } = useQuasar()
const formStore = useFormStore()
const { onEnteredProp } = formStore

const DEFAULT_DATE_MASK = 'DD/MM/YYYY'

const elementStates = reactive({
  min: formStore.activeField?.min || '',
  max: formStore.activeField?.max || '',
  mask: formStore.activeField?.mask || DEFAULT_DATE_MASK,
  emitImmediately: Boolean(formStore.activeField?.emitImmediately) || false,
  defaultYearMonth: formStore.activeField?.defaultYearMonth || '',
  disabledDates: (formStore.activeField?.disabledDates as string[] | undefined) || [],
})

const minRef = ref<HTMLInputElement | null>(null)
const maxRef = ref<HTMLInputElement | null>(null)
const maskRef = ref<HTMLInputElement | null>(null)
const defaultYearMonthRef = ref<HTMLInputElement | null>(null)

const disabledDatesDisplay = computed(() => (elementStates.disabledDates || []).join(', '))

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
              color="cyan-8" dense :placeholder="elementStates.mask || DEFAULT_DATE_MASK" readonly>
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
              color="cyan-8" dense :placeholder="elementStates.mask || DEFAULT_DATE_MASK" readonly>
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
            <label for="disabled-dates">
              <span class="text-body2">Datas desabilitadas</span>
            </label>
            <q-input id="disabled-dates" :model-value="disabledDatesDisplay" hide-bottom-space filled class="mw-200"
              color="cyan-8" dense readonly placeholder="Selecionar datas">
              <template #append>
                <q-icon name="event" class="cursor-pointer">
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
              </template>
            </q-input>
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
