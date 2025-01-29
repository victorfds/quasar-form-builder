<script setup lang="ts">
const { dark, localStorage } = useQuasar()
const formStore = useFormStore()
const { onEnteredProp } = formStore

const elementsClosed = localStorage.getItem('elements-closed')

const elementStates = reactive<{
  disable?: boolean
  readonly?: boolean
}>({
  disable: Boolean(formStore.activeField?.disable),
  readonly: Boolean(formStore.activeField?.readonly)
})

watch(() => formStore.activeField, (newVal) => {
  elementStates.disable = Boolean(newVal?.disable)
  elementStates.readonly = Boolean(newVal?.readonly)
}, { deep: true })
</script>
<template>
  <q-card flat>
    <q-card-section>
      <div class="row align-center items-center justify-between">
        <label for="form-required">
          <span class="text-body2">
            Desabilitado
          </span>
        </label>
        <q-toggle id="form-required" :model-value="elementStates.disable" color="primary" @update:model-value="val => {
          elementStates.disable = val
          if (!val && formStore.activeField?.disable?.if) {
            onEnteredProp('disable', { if: '' })
          }
          onEnteredProp('disable', val)
        }" />

        <SettingsSlotsConditionsCard v-if="elementStates.disable" saveTo="disable"
          noConditionsMessage="Regra de desabilitação vazia"
          :conditionsDialogSubtitle="`${formStore.activeField?.name} / regra para desabilitação`" />
      </div>

      <div class="row align-center items-center justify-between">
        <label for="form-readonly">
          <span class="text-body2">
            Apenas leitura
          </span>
        </label>
        <q-toggle id="form-readonly" :model-value="elementStates.readonly" color="primary" @update:model-value="val => {
          elementStates.readonly = val
          if (!val && formStore.activeField?.readonly?.if) {
            onEnteredProp('readonly', { if: '' })
          }
          onEnteredProp('readonly', val)
        }" />

        <!-- <SettingsSlotsConditionsCard v-if="elementStates.readonly" saveTo="disable" -->
        <!--   noConditionsMessage="Regra de apenas leitura vazia" -->
        <!--   :conditionsDialogSubtitle="`${formStore.activeField?.name} / regra para ativar modo apenas leitura`" /> -->
      </div>
    </q-card-section>
  </q-card>
</template>
