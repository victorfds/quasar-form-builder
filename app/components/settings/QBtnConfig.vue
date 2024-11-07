<script setup lang="ts">
import type { ColumnsType } from '~/types'

const { dark, localStorage } = useQuasar()
const formStore = useFormStore()
const { updatePropFromActiveField, changeViewport, updateActiveFieldColumns } = formStore

const elementsClosed = localStorage.getItem('elements-closed')

const elementStates = ref<{
  name?: string
  nameError?: string
  label?: string
  tooltip?: string
  description?: string
  buttonLabel?: string
  buttonType?: string
  buttonAction: { resets: boolean }
  fullWidth?: boolean
  align?: 'left' | 'center' | 'right'
  size?: 'default' | 'sm' | 'md' | 'lg'
  columns?: ColumnsType
  columnsPreferencies: { hasDefault?: boolean, hasTablet?: boolean, hasDesktop?: boolean }
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
  size: formStore.activeField?.size || 'default',
  columns: formStore.activeField?.columns,
  columnsPreferencies: { hasDefault: Boolean(!formStore.activeField?.columns?.container || formStore.activeField?.columns?.container || formStore.activeField?.columns?.default), hasTablet: Boolean(formStore.activeField?.columns?.sm), hasDesktop: Boolean(formStore.activeField?.columns?.lg) },
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

const isColumnDefault = computed(() => {
  if (formStore.formSettings.columns === 'default') {
    return !formStore.activeField?.columns?.container && !formStore.activeField?.columns?.default?.container
  }

  if (formStore.formSettings.columns === 'sm') {
    return !formStore.activeField?.columns?.sm?.container
  }

  if (formStore.formSettings.columns === 'lg') {
    return !formStore.activeField?.columns?.lg?.container
  }

  return !formStore.activeField?.columns?.[formStore.formSettings.columns]?.container
})

function onClickLabel(refElement: HTMLInputElement | null, { select = false }: { select?: boolean } = {}) {
  refElement?.focus()
  if (select) {
    refElement?.select()
  }
}

function onBlurName(_: Event) {
  elementStates.value.nameError = ''
  if (elementStates.value.name === formStore.activeField?.name)
    return

  const response = formStore.updateNameField(formStore.activeField?.name, elementStates.value.name)

  if (response?.message === 'name cannot be empty') {
    elementStates.value.nameError = 'Nome não pode ser vazio'
    return
  }

  if (response?.message === 'name already exists') {
    elementStates.value.nameError = 'Este nome já existe'
  }
}

function onEnteredProp(propName: string, propValue?: string | number | boolean | null | ColumnsType) {
  if (!propName)
    return

  updatePropFromActiveField(formStore.activeField, propName, propValue)
}

function handleCheckboxUpdate(isChecked: boolean) {
  const columnKey = formStore.formSettings.columns
  const currentColumns = formStore.activeField?.columns || {}
  const hasSmOrLg = currentColumns.sm || currentColumns.lg
  const defaultContainer = { container: currentColumns.default?.container || currentColumns.container || 12 }

  if (isChecked) {
    elementStates.value.columns = { ...currentColumns, container: null, [columnKey]: null }
  }
  else if (columnKey === 'sm' || columnKey === 'lg') {
    elementStates.value.columns = {
      ...currentColumns,
      [columnKey]: { container: 12 },
      container: currentColumns.container ? null : undefined,
      ...(currentColumns.container && { default: defaultContainer }),
    }
  }
  else if (hasSmOrLg) {
    elementStates.value.columns = { ...currentColumns, [columnKey]: defaultContainer }
  }
  else {
    elementStates.value.columns = defaultContainer
  }

  // Remove any columns set to null
  const filteredColumns = Object.fromEntries(
    Object.entries(elementStates.value.columns).filter(([_, value]) => value !== null),
  )
  const hasOnlyDefaultEntry = hasOnlyOneKeyWithName(filteredColumns, 'default')

  elementStates.value.columns = hasOnlyDefaultEntry ? defaultContainer : filteredColumns
  onEnteredProp('columns', elementStates.value.columns)
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
              <q-input
                id="form-name" ref="propNameInputRef" v-model.trim="elementStates.name"
                :error="Boolean(elementStates.nameError)" :error-message="elementStates.nameError" hide-bottom-space
                filled class="mw-200" color="cyan-8" dense type="text" @blur="onBlurName"
              />
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
              <q-input
                id="form-label" ref="propLabelInputRef" v-model.trim="elementStates.label" hide-bottom-space
                filled class="mw-200" color="cyan-8" dense type="text"
                @update:model-value="val => onEnteredProp('label', val)"
              />
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
              <q-input
                id="form-tooltip" ref="propTooltipInputRef" v-model.trim="elementStates.tooltip"
                hide-bottom-space filled class="mw-200" color="cyan-8" dense type="text"
                @update:model-value="val => onEnteredProp('info', val)"
              />
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
            <q-input
              id="form-description" ref="propDescriptionInputRef" v-model.trim="elementStates.description"
              hide-bottom-space filled class="mw-200" color="cyan-8" dense type="text"
              @update:model-value="val => onEnteredProp('description', val)"
            />
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
            <q-input
              id="form-button-label" ref="propButtonLabelInputRef" v-model.trim="elementStates.buttonLabel"
              hide-bottom-space filled class="mw-200" color="cyan-8" dense type="text"
              @update:model-value="val => onEnteredProp('buttonLabel', val)"
            />
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
            <q-btn-toggle
              id="form-button-type" :model-value="elementStates.buttonType" no-wrap unelevated no-caps
              toggle-color="primary" :color="dark.isActive ? 'grey-10' : 'grey-3'" dense :text-color="dark.isActive ? 'white' : 'grey-10'" :options="[
                { label: 'Primário', value: 'primary' },
                { label: 'Secundário', value: 'secondary' },
                { label: 'Risco', value: 'negative' },
              ]"
              @update:model-value="val => {
                elementStates.buttonType = val
                onEnteredProp('color', val)
              }"
            />
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

              <q-toggle
                :model-value="elementStates.buttonAction.resets" color="primary" :true-value="false"
                :false-value="true" @update:model-value="val => {
                  elementStates.buttonAction.resets = val
                  onEnteredProp('resets', val)
                }"
              />
            </div>
            <div class="row align-center items-center justify-between">
              <label for="form-button-toggle-submit">
                <span class="text-body2">
                  Limpar
                </span>
              </label>

              <q-toggle
                :model-value="elementStates.buttonAction.resets" color="primary" @update:model-value="val => {
                  elementStates.buttonAction.resets = val
                  onEnteredProp('resets', val)
                }"
              />
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

            <q-toggle
              :model-value="elementStates.fullWidth" color="primary" @update:model-value="val => {
                elementStates.fullWidth = val
                onEnteredProp('full', val)
              }"
            />
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
            <q-btn-toggle
              id="form-button-align" :model-value="elementStates.align" no-wrap unelevated no-caps
              toggle-color="primary" :color="dark.isActive ? 'grey-10' : 'grey-3'" size="sm" :text-color="dark.isActive ? 'white' : 'grey-10'"
              :options="[
                { icon: 'format_align_left', value: 'left' },
                { icon: 'format_align_center', value: 'center' },
                { icon: 'format_align_right', value: 'right' },
              ]" @update:model-value="val => {
                elementStates.align = val
                onEnteredProp('align', val)
              }"
            />
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
            <q-btn-toggle
              id="form-button-size" :model-value="elementStates.size" no-wrap unelevated no-caps
              toggle-color="primary" :color="dark.isActive ? 'grey-10' : 'grey-3'" dense :text-color="dark.isActive ? 'white' : 'grey-10'" :options="[
                { label: 'Padrão', value: 'default' },
                { label: 'Pequeno', value: 'sm' },
                { label: 'Médio', value: 'md' },
                { label: 'Grande', value: 'lg' },
              ]"
              @update:model-value="val => {
                elementStates.size = val
                if (val === 'default') {
                  onEnteredProp('size', '')
                  return
                }
                onEnteredProp('size', val)
              }"
            />
          </div>
        </q-card-section>
        <q-separator :color="dark.isActive ? 'grey-9' : 'blue-grey-1'" />
        <q-card-section>
          <div class="row align-center items-center justify-between">
            <label for="form-button-columns">
              <span class="text-body2">
                Colunas
              </span>
            </label>
            <q-btn-toggle
              id="form-button-columns" :model-value="formStore.formSettings.columns"
              no-wrap unelevated no-caps toggle-color="primary" :color="dark.isActive ? 'grey-10' : 'grey-3'"
              dense :text-color="dark.isActive ? 'white' : 'grey-10'" :options="[
                { label: 'Padrão', value: 'default' },
                { label: 'Tablet', value: 'sm' },
                { label: 'Desktop', value: 'lg' },
              ]"
              @update:model-value="changeViewport"
            />
          </div>
          <q-checkbox
            :model-value="isColumnDefault" label="Largura de coluna padrão"
            @update:model-value="handleCheckboxUpdate"
          />
          <q-btn-toggle
            v-if="!isColumnDefault" no-wrap unelevated dense spread toggle-color="primary"
            :model-value="formStore.activeField?.columns?.[formStore.formSettings.columns]?.container || formStore.activeField?.columns?.container"
            :options="[
              { label: '1', value: 1 },
              { label: '2', value: 2 },
              { label: '3', value: 3 },
              { label: '4', value: 4 },
              { label: '5', value: 5 },
              { label: '6', value: 6 },
              { label: '7', value: 7 },
              { label: '8', value: 8 },
              { label: '9', value: 9 },
              { label: '10', value: 10 },
              { label: '11', value: 11 },
              { label: '12', value: 12 },
            ]" @update:model-value="updateActiveFieldColumns"
          />
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
