<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useFormStore } from '#qfb/stores/formStore'

const formStore = useFormStore()
const { onEnteredProp } = formStore

const DEFAULT_TIME_MASK = 'HH:mm'

const elementStates = reactive({
  mask: formStore.activeField?.mask || DEFAULT_TIME_MASK,
  format24h: formStore.activeField?.format24h !== false,
  withSeconds: Boolean(formStore.activeField?.withSeconds),
  nowBtn: Boolean(formStore.activeField?.nowBtn),
})

const maskRef = ref<{ focus: () => void } | null>(null)

const maskOptions = [
  { label: 'HH:mm', value: 'HH:mm' },
  { label: 'HH:mm:ss', value: 'HH:mm:ss' },
  { label: 'hh:mm A', value: 'hh:mm A' },
]

function onClickLabel(refElement: { focus: () => void } | null) {
  refElement?.focus()
}
</script>

<template>
  <q-card flat>
    <q-card-section>
      <div class="column q-gutter-sm">
        <div class="row align-center items-center justify-between">
          <label for="time-mask" @click="onClickLabel(maskRef)">
            <span class="text-body2">Máscara</span>
          </label>
          <q-select
            id="time-mask"
            ref="maskRef"
            :model-value="elementStates.mask"
            :options="maskOptions"
            emit-value
            map-options
            hide-bottom-space
            filled
            class="mw-200"
            color="cyan-8"
            dense
            @update:model-value="val => { elementStates.mask = String(val); onEnteredProp('mask', String(val)) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="time-format-24h">
            <span class="text-body2">Formato 24h</span>
          </label>
          <q-toggle
            id="time-format-24h"
            :model-value="elementStates.format24h"
            color="primary"
            @update:model-value="val => { elementStates.format24h = val; onEnteredProp('format24h', val) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="time-with-seconds">
            <span class="text-body2">Exibir segundos</span>
          </label>
          <q-toggle
            id="time-with-seconds"
            :model-value="elementStates.withSeconds"
            color="primary"
            @update:model-value="val => { elementStates.withSeconds = val; onEnteredProp('withSeconds', val) }"
          />
        </div>

        <div class="row align-center items-center justify-between">
          <label for="time-now-btn">
            <span class="text-body2">Botão agora</span>
          </label>
          <q-toggle
            id="time-now-btn"
            :model-value="elementStates.nowBtn"
            color="primary"
            @update:model-value="val => { elementStates.nowBtn = val; onEnteredProp('nowBtn', val) }"
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>
