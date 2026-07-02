<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useFormStore } from '#qfb/stores/formStore'

defineProps<{ showReadonly?: boolean }>()
const formStore = useFormStore()
const { onEnteredProp } = formStore

interface CustomAttribute {
  name: string
  value: string
}

function getCustomAttrs(attrs?: Record<string, unknown>): CustomAttribute[] {
  return Object.entries(attrs || {})
    .filter(([name]) => name !== 'id')
    .map(([name, value]) => ({ name, value: value == null ? '' : String(value) }))
}

const elementStates = reactive<{
  disable?: boolean
  readonly?: boolean
  id?: string
  customAttrs: CustomAttribute[]
}>({
  disable: Boolean(formStore.activeField?.disable),
  readonly: Boolean(formStore.activeField?.readonly),
  id: String(formStore.activeField?.attrs?.id || ''),
  customAttrs: getCustomAttrs(formStore.activeField?.attrs),
})

const idInputRef = ref<HTMLInputElement | null>(null)

function focusInput(inputRef: HTMLInputElement | null) {
  inputRef?.focus()
}

function getAttrsPayload() {
  return {
    ...(elementStates.id ? { id: elementStates.id } : {}),
    ...Object.fromEntries(
      elementStates.customAttrs
        .filter(attr => attr.name.trim())
        .map(attr => [attr.name.trim(), attr.value]),
    ),
  }
}

function saveAttrs() {
  onEnteredProp('attrs', getAttrsPayload())
}

function addCustomAttr() {
  elementStates.customAttrs.push({ name: '', value: '' })
}

function removeCustomAttr(index: number) {
  elementStates.customAttrs.splice(index, 1)
  saveAttrs()
}
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
        <q-toggle
          id="form-required" :model-value="elementStates.disable" color="primary" @update:model-value="val => {
            elementStates.disable = val
            if (!val && formStore.activeField?.disable?.if) {
              onEnteredProp('disable', { if: '' })
            }
            onEnteredProp('disable', val)
          }"
        />

        <SettingsSlotsConditionsCard
          v-if="elementStates.disable" save-to="disable"
          mode="icon"
          no-conditions-message="Regra de desabilitação vazia"
          :conditions-dialog-subtitle="`${formStore.activeField?.name} / regra para desabilitação`"
        />
      </div>

      <div v-if="showReadonly" class="row align-center items-center justify-between">
        <label for="form-readonly">
          <span class="text-body2">
            Apenas leitura
          </span>
        </label>
        <q-toggle
          id="form-readonly" :model-value="elementStates.readonly" color="primary" @update:model-value="val => {
            elementStates.readonly = val
            if (!val && formStore.activeField?.readonly?.if) {
              onEnteredProp('readonly', { if: '' })
            }
            onEnteredProp('readonly', val)
          }"
        />

        <SettingsSlotsConditionsCard
          v-if="elementStates.readonly"
          save-to="readonly"
          mode="icon"
          no-conditions-message="Regra de apenas leitura vazia"
          :conditions-dialog-subtitle="`${formStore.activeField?.name} / regra para ativar modo apenas leitura`"
        />
      </div>

      <div class="row align-center items-center justify-between q-mt-sm">
        <label for="form-attrs-id" @click="focusInput(idInputRef)">
          <span class="text-body2">
            ID
          </span>
        </label>
        <q-input
          id="form-attrs-id"
          ref="idInputRef"
          :model-value="elementStates.id"
          hide-bottom-space
          filled
          class="mw-200"
          color="cyan-8"
          dense
          type="text"
          placeholder="padrão"
          @update:model-value="val => { elementStates.id = String(val || ''); saveAttrs() }"
        />
      </div>

      <div class="row align-center items-center justify-between q-mt-sm">
        <span class="text-body2">
          Atributos personalizados
        </span>
        <q-btn
          no-caps
          dense
          color="primary"
          label="+ Adicionar"
          @click="addCustomAttr"
        />
      </div>

      <div
        v-for="(customAttr, index) in elementStates.customAttrs"
        :key="index"
        class="row align-center items-center no-wrap q-gutter-sm q-mt-sm"
      >
        <q-btn
          size="xs"
          flat
          dense
          round
          icon="close"
          @click="removeCustomAttr(index)"
        />
        <q-input
          v-model.trim="customAttr.name"
          hide-bottom-space
          filled
          class="col"
          color="cyan-8"
          dense
          placeholder="Nome"
          type="text"
          @update:model-value="saveAttrs"
        />
        <q-input
          v-model="customAttr.value"
          hide-bottom-space
          filled
          class="col"
          color="cyan-8"
          dense
          placeholder="Valor"
          type="text"
          @update:model-value="saveAttrs"
        />
      </div>
    </q-card-section>
  </q-card>
</template>
