<script setup lang="ts">
const { dark, localStorage } = useQuasar()
const formStore = useFormStore()
const { updatePropFromActiveField } = formStore

const elementsClosed = localStorage.getItem('elements-closed')

const elementStates = ref<{
  name?: string,
  nameError?: string,
  label?: string,
  tooltip?: string,
  description?: string,
  buttonLabel?: string,
  buttonType?: string,
  buttonAction: { resets: boolean },
  fullWidth?: boolean,
  align?: 'left' | 'center' | 'right',
  size?: 'default' | 'sm' | 'md' | 'lg'
}>({
  name: formStore.activeField?.name,
  label: formStore.activeField?.label,
  tooltip: formStore.activeField?.info,
  description: formStore.activeField?.description,
  buttonLabel: formStore.activeField?.buttonLabel,
  buttonType: formStore.activeField?.color || 'primary',
  buttonAction: { resets: false },
  fullWidth: formStore.activeField?.full || false,
  align: formStore.activeField?.align || 'left',
  size: formStore.activeField?.size || 'default'
})
const propNameInputRef = ref<HTMLInputElement | null>(null)
const propLabelInputRef = ref<HTMLInputElement | null>(null)
const propTooltipInputRef = ref<HTMLInputElement | null>(null)
const propDescriptionInputRef = ref<HTMLInputElement | null>(null)
const propButtonLabelInputRef = ref<HTMLInputElement | null>(null)
const propButtonTypeInputRef = ref<HTMLInputElement | null>(null)

watch(() => formStore.activeField, (newVal) => {
  elementStates.value.name = newVal?.name
  elementStates.value.nameError = ''
}, { deep: true })

function onClickLabel(refElement: HTMLInputElement | null, { select = false }: { select?: boolean } = {}) {
  refElement?.focus()
  if (select) {
    refElement?.select()
  }
}

function onBlurName(_: Event) {
  elementStates.value.nameError = ''
  if (elementStates.value.name === formStore.activeField?.name) return

  const response = formStore.updateNameField(formStore.activeField?.name, elementStates.value.name)

  if (response?.message === 'name cannot be empty') {
    elementStates.value.nameError = 'Nome não pode ser vazio'
    return
  }

  if (response?.message === 'name already exists') {
    elementStates.value.nameError = 'Este nome já existe'
  }
}

function onEnteredProp(propName: string, propValue?: string | number | boolean | null) {
  if (!propName) return

  updatePropFromActiveField(formStore.activeField, propName, propValue)
}
</script>
<template>
  <SettingsExpansionBaseWrapper :section-labels="{ options: 'Opções de botão' }">
    <template #properties>
      <q-card flat>
        <q-card-section>
          <div>
            <div class="row align-center items-center justify-between">
              <label for="form-name" @click="onClickLabel(propNameInputRef)">
                <span class="text-body2">
                  Nome
                </span>
              </label>
              <q-input id="form-name" ref="propNameInputRef" v-model.trim="elementStates.name"
                :error="Boolean(elementStates.nameError)" :error-message="elementStates.nameError" hide-bottom-space
                filled class="mw-200" color="cyan-8" dense type="text" @blur="onBlurName" />
            </div>
          </div>
        </q-card-section>
        <q-separator :color="dark.isActive ? 'grey-9' : 'blue-grey-1'" />
        <q-card-section>
          <div>
            <div class="row align-center items-center justify-between">
              <label for="form-label" @click="onClickLabel(propLabelInputRef)">
                <span class="text-body2">
                  Cabeçalho
                </span>
              </label>
              <q-input id="form-label" ref="propLabelInputRef" v-model.trim="elementStates.label" hide-bottom-space
                filled class="mw-200" color="cyan-8" dense type="text"
                @update:model-value="val => onEnteredProp('label', val)" />
            </div>
            <div class="row align-center items-center justify-between q-mt-sm">
              <label for="form-tooltip" @click="onClickLabel(propTooltipInputRef)">
                <span class="text-body2">
                  Texto auxiliar
                </span>
                <q-icon name="info" :color="dark.isActive ? 'grey' : 'grey-13'" class="cursor-pointer">
                  <q-tooltip class="bg-grey-10" :offset="[10, 10]">
                    Apenas exibido em combinação com cabeçalho
                  </q-tooltip>
                </q-icon>
              </label>
              <q-input id="form-tooltip" ref="propTooltipInputRef" v-model.trim="elementStates.tooltip"
                hide-bottom-space filled class="mw-200" color="cyan-8" dense type="text"
                @update:model-value="val => onEnteredProp('info', val)" />
            </div>
          </div>
        </q-card-section>
        <q-separator :color="dark.isActive ? 'grey-9' : 'blue-grey-1'" />
        <q-card-section>
          <div class="row align-center items-center justify-between">
            <label for="form-description" @click="onClickLabel(propDescriptionInputRef)">
              <span class="text-body2">
                Descrição
              </span>
            </label>
            <q-input id="form-description" ref="propDescriptionInputRef" v-model.trim="elementStates.description"
              hide-bottom-space filled class="mw-200" color="cyan-8" dense type="text"
              @update:model-value="val => onEnteredProp('description', val)" />
          </div>
        </q-card-section>
      </q-card>
    </template>
    <template #options>
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
              @update:model-value="val => onEnteredProp('buttonLabel', val)" />
          </div>
        </q-card-section>
        <q-separator :color="dark.isActive ? 'grey-9' : 'blue-grey-1'" />
        <q-card-section>
          <div class="row align-center items-center justify-between">
            <label for="form-button-type" @click="onClickLabel(propButtonTypeInputRef)">
              <span class="text-body2">
                Tipo
              </span>
            </label>
            <q-btn-toggle :model-value="elementStates.buttonType" id="form-button-type" no-wrap unelevated no-caps
              toggle-color="primary" @update:model-value="val => {
                elementStates.buttonType = val
                onEnteredProp('color', val)
              }" :color="dark.isActive ? 'grey-10' : 'grey-3'" rounded dense
              :text-color="dark.isActive ? 'white' : 'grey-10'" :options="[
                { label: 'Primário', value: 'primary' },
                { label: 'Secundário', value: 'secondary' },
                { label: 'Risco', value: 'negative' }
              ]" />
          </div>
        </q-card-section>
        <q-separator :color="dark.isActive ? 'grey-9' : 'blue-grey-1'" />
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
                }" />
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
              }" />
            </div>
          </div>
        </q-card-section>

      </q-card>
    </template>
    <template #layout>
      <q-card flat>
        <q-card-section>
          <div class="row align-center items-center justify-between">
            <label for="form-button-toggle-submit">
              <span class="text-body2">
                Largura máxima
              </span>
            </label>

            <q-toggle :model-value="elementStates.fullWidth" color="primary" @update:model-value="val => {
              elementStates.fullWidth = val
              onEnteredProp('full', val)
            }" />
          </div>
        </q-card-section>
        <q-separator :color="dark.isActive ? 'grey-9' : 'blue-grey-1'" />
        <q-card-section>
          <div class="row align-center items-center justify-between">
            <label for="form-button-align">
              <span class="text-body2">
                Alinhar
              </span>
            </label>
            <q-btn-toggle :model-value="elementStates.align" id="form-button-align" no-wrap unelevated no-caps
              toggle-color="primary" @update:model-value="val => {
                elementStates.align = val
                onEnteredProp('align', val)
              }" :color="dark.isActive ? 'grey-10' : 'grey-3'" rounded size="sm"
              :text-color="dark.isActive ? 'white' : 'grey-10'" :options="[
                { icon: 'format_align_left', value: 'left' },
                { icon: 'format_align_center', value: 'center' },
                { icon: 'format_align_right', value: 'right' }
              ]" />
          </div>
        </q-card-section>
        <q-separator :color="dark.isActive ? 'grey-9' : 'blue-grey-1'" />
        <q-card-section>
          <div class="row align-center items-center justify-between">
            <label for="form-button-size">
              <span class="text-body2">
                Tamanho
              </span>
            </label>
            <q-btn-toggle :model-value="elementStates.size" id="form-button-size" no-wrap unelevated no-caps
              toggle-color="primary" @update:model-value="val => {
                elementStates.size = val
                if (val === 'default') {
                  onEnteredProp('size', '')
                  return
                }
                onEnteredProp('size', val)
              }" :color="dark.isActive ? 'grey-10' : 'grey-3'" rounded dense 
              :text-color="dark.isActive ? 'white' : 'grey-10'" :options="[
                { label: 'Padrão', value: 'default' },
                { label: 'Pequeno', value: 'sm' },
                { label: 'Médio', value: 'md' },
                { label: 'Grande', value: 'lg' }
              ]" />
          </div>
        </q-card-section>

      </q-card>
    </template>
  </SettingsExpansionBaseWrapper>

  <pre>{{ formStore.activeField }}</pre>

</template>
<style lang="scss" scoped>
.mw-200 {
  max-width: 200px;
}
</style>
