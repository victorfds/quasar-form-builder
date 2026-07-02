<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useFormStore } from '#qfb/stores/formStore'

const formStore = useFormStore()
const { onEnteredProp } = formStore

const inputType = computed(() => String(formStore.activeField?.inputType || 'text'))
const supportsMask = computed(() => ['text', 'search', 'url', 'tel', 'password'].includes(inputType.value))
const isTextarea = computed(() => inputType.value === 'textarea')

const elementStates = reactive({
  clearable: Boolean(formStore.activeField?.clearable),
  counter: Boolean(formStore.activeField?.counter),
  autogrow: Boolean(formStore.activeField?.autogrow),
  loading: Boolean(formStore.activeField?.loading),
  stackLabel: Boolean(formStore.activeField?.stackLabel),
  debounce: formStore.activeField?.debounce ?? '',
  mask: String(formStore.activeField?.mask || ''),
  fillMask: Boolean(formStore.activeField?.['fill-mask']),
  reverseFillMask: Boolean(formStore.activeField?.['reverse-fill-mask']),
  unmaskedValue: Boolean(formStore.activeField?.['unmasked-value']),
  prefix: String(formStore.activeField?.prefix || ''),
  suffix: String(formStore.activeField?.suffix || ''),
})

const prefixInputRef = ref<HTMLInputElement | null>(null)
const suffixInputRef = ref<HTMLInputElement | null>(null)
const debounceInputRef = ref<HTMLInputElement | null>(null)
const maskInputRef = ref<HTMLInputElement | null>(null)

function onClickLabel(refElement: HTMLInputElement | null) {
  refElement?.focus()
}

function setFillMask(value: boolean) {
  elementStates.fillMask = value
  onEnteredProp('fill-mask', value)

  if (!value && elementStates.reverseFillMask) {
    elementStates.reverseFillMask = false
    onEnteredProp('reverse-fill-mask', false)
  }
}

function setReverseFillMask(value: boolean) {
  elementStates.reverseFillMask = value

  if (value && !elementStates.fillMask) {
    elementStates.fillMask = true
    onEnteredProp('fill-mask', true)
  }

  onEnteredProp('reverse-fill-mask', value)
}
</script>

<template>
  <q-card flat class="input-options-card">
    <q-card-section>
      <div class="column q-gutter-sm">
        <div class="row align-center items-center justify-between">
          <label for="input-clearable">
            <span class="text-body2">Limpável</span>
          </label>
          <q-toggle
            id="input-clearable"
            :model-value="elementStates.clearable"
            color="primary"
            @update:model-value="val => { elementStates.clearable = val; onEnteredProp('clearable', val) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="input-counter">
            <span class="text-body2">Contador</span>
          </label>
          <q-toggle
            id="input-counter"
            :model-value="elementStates.counter"
            color="primary"
            @update:model-value="val => { elementStates.counter = val; onEnteredProp('counter', val) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="input-loading">
            <span class="text-body2">Carregando</span>
          </label>
          <q-toggle
            id="input-loading"
            :model-value="elementStates.loading"
            color="primary"
            @update:model-value="val => { elementStates.loading = val; onEnteredProp('loading', val) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="input-stack-label">
            <span class="text-body2">Label fixo</span>
          </label>
          <q-toggle
            id="input-stack-label"
            :model-value="elementStates.stackLabel"
            color="primary"
            @update:model-value="val => { elementStates.stackLabel = val; onEnteredProp('stackLabel', val) }"
          />
        </div>

        <div v-if="isTextarea" class="row align-center items-center justify-between">
          <label for="input-autogrow">
            <span class="text-body2">Auto expandir</span>
          </label>
          <q-toggle
            id="input-autogrow"
            :model-value="elementStates.autogrow"
            color="primary"
            @update:model-value="val => { elementStates.autogrow = val; onEnteredProp('autogrow', val) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="input-prefix" @click="onClickLabel(prefixInputRef)">
            <span class="text-body2">Prefixo</span>
          </label>
          <q-input
            id="input-prefix"
            ref="prefixInputRef"
            :model-value="elementStates.prefix"
            hide-bottom-space
            filled
            class="mw-200"
            color="cyan-8"
            dense
            @update:model-value="val => { elementStates.prefix = String(val || ''); onEnteredProp('prefix', elementStates.prefix) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="input-suffix" @click="onClickLabel(suffixInputRef)">
            <span class="text-body2">Sufixo</span>
          </label>
          <q-input
            id="input-suffix"
            ref="suffixInputRef"
            :model-value="elementStates.suffix"
            hide-bottom-space
            filled
            class="mw-200"
            color="cyan-8"
            dense
            @update:model-value="val => { elementStates.suffix = String(val || ''); onEnteredProp('suffix', elementStates.suffix) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="input-debounce" @click="onClickLabel(debounceInputRef)">
            <span class="text-body2">Debounce</span>
          </label>
          <q-input
            id="input-debounce"
            ref="debounceInputRef"
            :model-value="elementStates.debounce"
            hide-bottom-space
            filled
            class="mw-200"
            color="cyan-8"
            dense
            type="number"
            suffix="ms"
            @update:model-value="val => { elementStates.debounce = val || ''; onEnteredProp('debounce', val ? Number(val) : '') }"
          />
        </div>

        <template v-if="supportsMask">
          <div class="row align-center items-center justify-between">
            <label for="input-mask" @click="onClickLabel(maskInputRef)">
              <span class="text-body2">Máscara</span>
            </label>
            <q-input
              id="input-mask"
              ref="maskInputRef"
              :model-value="elementStates.mask"
              hide-bottom-space
              filled
              class="mw-200"
              color="cyan-8"
              dense
              placeholder="###-###"
              @update:model-value="val => { elementStates.mask = String(val || ''); onEnteredProp('mask', elementStates.mask) }"
            />
          </div>

          <div class="row align-center items-center justify-between">
            <label for="input-fill-mask">
              <span class="text-body2">Preencher máscara</span>
            </label>
            <q-toggle
              id="input-fill-mask"
              :model-value="elementStates.fillMask"
              color="primary"
              @update:model-value="setFillMask"
            />
          </div>

          <div class="row align-center items-center justify-between">
            <label for="input-reverse-fill-mask">
              <span class="text-body2">Preencher reverso</span>
            </label>
            <q-toggle
              id="input-reverse-fill-mask"
              :model-value="elementStates.reverseFillMask"
              color="primary"
              @update:model-value="setReverseFillMask"
            />
          </div>

          <div class="row align-center items-center justify-between">
            <label for="input-unmasked-value">
              <span class="text-body2">Valor sem máscara</span>
            </label>
            <q-toggle
              id="input-unmasked-value"
              :model-value="elementStates.unmaskedValue"
              color="primary"
              @update:model-value="val => { elementStates.unmaskedValue = val; onEnteredProp('unmasked-value', val) }"
            />
          </div>
        </template>
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.input-options-card .row.align-center.items-center.justify-between {
  display: grid;
  gap: .75rem;
  grid-template-columns: minmax(0, 1fr) minmax(108px, 128px);
}

.input-options-card .mw-200 {
  max-width: 128px;
  width: 128px;
}

@media (max-width: 340px) {
  .input-options-card .row.align-center.items-center.justify-between {
    grid-template-columns: 1fr;
  }

  .input-options-card .mw-200 {
    max-width: 100%;
    width: 100%;
  }
}
</style>
