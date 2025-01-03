<script setup lang="ts">
const {dark, localStorage} = useQuasar()
const formStore = useFormStore()
const {onEnteredProp} = formStore

const elementsClosed = localStorage.getItem('elements-closed')

const elementStates = reactive<{
  buttonLabel?: string
  buttonType?: string
  buttonAction: { resets: boolean }
  fullWidth?: boolean
  align?: 'left' | 'center' | 'right'
  size?: 'default' | 'sm' | 'md' | 'lg'
}>({
  buttonLabel: formStore.activeField?.buttonLabel,
  buttonType: formStore.activeField?.color || 'primary',
  buttonAction: {resets: false},
  fullWidth: formStore.activeField?.full || false,
  align: formStore.activeField?.align || 'left',
  size: formStore.activeField?.size || 'default',
})
const propButtonLabelInputRef = ref<HTMLInputElement | null>(null)
const propButtonTypeInputRef = ref<HTMLInputElement | null>(null)

function onClickLabel(refElement: HTMLInputElement | null, {select = false}: { select?: boolean } = {}) {
  refElement?.focus()
  if (select) {
    refElement?.select()
  }
}
</script>
<template>
  <q-card flat>
    <q-card-section>
      <div class="row align-center items-center justify-between">
        <label for="form-button-label" @click="onClickLabel(propButtonLabelInputRef, { select: true })">
              <span class="text-body2">
                Texto do botão
              </span>
        </label>
        <q-input id="form-button-label" ref="propButtonLabelInputRef" v-model.trim="elementStates.buttonLabel"
                 hide-bottom-space filled class="mw-200" color="cyan-8" dense type="text"
                 @update:model-value="val => onEnteredProp('buttonLabel', val)"/>
      </div>
    </q-card-section>
    <q-separator :color="dark.isActive ? 'grey-9' : 'blue-grey-1'"/>
    <q-card-section>
      <div class="row align-center items-center justify-between">
        <label for="form-button-type" @click="onClickLabel(propButtonTypeInputRef)">
              <span class="text-body2">
                Tipo
              </span>
        </label>
        <q-btn-toggle id="form-button-type" :model-value="elementStates.buttonType" no-wrap unelevated no-caps
                      toggle-color="primary" :color="dark.isActive ? 'grey-10' : 'blue-grey-1'" dense
                      :text-color="dark.isActive ? 'white' : 'grey-10'" :options="[
                { label: 'Primário', value: 'primary' },
                { label: 'Secundário', value: 'secondary' },
                { label: 'Risco', value: 'negative' },
              ]" @update:model-value="val => {
                elementStates.buttonType = val
                onEnteredProp('color', val)
              }"/>
      </div>
    </q-card-section>
    <q-separator :color="dark.isActive ? 'grey-9' : 'blue-grey-1'"/>
    <q-card-section>
      <div>
        <div class="row align-center items-center justify-between">
          <label for="form-button-toggle-submit">
                <span class="text-body2">
                  Concluir
                </span>
          </label>

          <q-toggle :model-value="elementStates.buttonAction.resets" color="primary" :true-value="false"
                    :false-value="true" @update:model-value="val => {
                  elementStates.buttonAction.resets = val
                  onEnteredProp('resets', val)
                }"/>
        </div>
        <div class="row align-center items-center justify-between">
          <label for="form-button-toggle-submit">
                <span class="text-body2">
                  Limpar
                </span>
          </label>

          <q-toggle :model-value="elementStates.buttonAction.resets" color="primary" @update:model-value="val => {
                elementStates.buttonAction.resets = val
                onEnteredProp('resets', val)
              }"/>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>