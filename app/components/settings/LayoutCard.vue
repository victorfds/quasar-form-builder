<script setup lang="ts">
import type {ColumnsType, LogicField} from '~/types'

defineProps<{ showFullWidth?: boolean }>()

const {dark, localStorage} = useQuasar()
const formStore = useFormStore()
const {changeViewport, updateActiveFieldColumns, onEnteredProp} = formStore

const elementStates = reactive<{
  fullWidth?: boolean
  align?: 'left' | 'center' | 'right'
  size?: 'default' | 'sm' | 'md' | 'lg'
  columns?: ColumnsType
  columnsPreferencies: { hasDefault?: boolean, hasTablet?: boolean, hasDesktop?: boolean },
}>({
  fullWidth: formStore.activeField?.full || false,
  align: formStore.activeField?.align || 'left',
  size: formStore.activeField?.size || 'default',
  columns: formStore.activeField?.columns,
  columnsPreferencies: {
    hasDefault: Boolean(!formStore.activeField?.columns?.container || formStore.activeField?.columns?.container || formStore.activeField?.columns?.default),
    hasTablet: Boolean(formStore.activeField?.columns?.sm),
    hasDesktop: Boolean(formStore.activeField?.columns?.lg)
  }
})

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

function handleCheckboxUpdate(isChecked: boolean) {
  const columnKey = formStore.formSettings.columns
  const currentColumns = formStore.activeField?.columns || {}
  const hasSmOrLg = currentColumns.sm || currentColumns.lg
  const defaultContainer = {container: currentColumns.default?.container || currentColumns.container || 12}

  if (isChecked) {
    elementStates.columns = {...currentColumns, container: null, [columnKey]: null}
  } else if (columnKey === 'sm' || columnKey === 'lg') {
    elementStates.columns = {
      ...currentColumns,
      [columnKey]: {container: 12},
      container: currentColumns.container ? null : undefined,
      ...(currentColumns.container && {default: defaultContainer}),
    }
  } else if (hasSmOrLg) {
    elementStates.columns = {...currentColumns, [columnKey]: defaultContainer}
  } else {
    elementStates.columns = defaultContainer
  }

  // Remove any columns set to null
  const filteredColumns = Object.fromEntries(
      Object.entries(elementStates.columns).filter(([_, value]) => value !== null),
  )
  const hasOnlyDefaultEntry = hasOnlyOneKeyWithName(filteredColumns, 'default')

  elementStates.columns = hasOnlyDefaultEntry ? defaultContainer : filteredColumns
  onEnteredProp('columns', elementStates.columns)
}
</script>
<template>
  <q-card flat>
    <q-card-section v-if="showFullWidth">
      <div class="row align-center items-center justify-between">
        <label for="form-button-toggle-submit">
              <span class="text-body2">
                Largura máxima
              </span>
        </label>

        <q-toggle :model-value="elementStates.fullWidth" color="primary" @update:model-value="val => {
              elementStates.fullWidth = val
              onEnteredProp('full', val)
            }"/>
      </div>
    </q-card-section>
    <q-separator :color="dark.isActive ? 'grey-9' : 'blue-grey-1'"/>
    <q-card-section>
      <div class="row align-center items-center justify-between">
        <label for="form-button-align">
              <span class="text-body2">
                Alinhar
              </span>
        </label>
        <q-btn-toggle id="form-button-align" :model-value="elementStates.align" no-wrap unelevated no-caps
                      toggle-color="primary" :color="dark.isActive ? 'grey-10' : 'blue-grey-1'" size="sm"
                      :text-color="dark.isActive ? 'white' : 'grey-10'" :options="[
                { icon: 'format_align_left', value: 'left' },
                { icon: 'format_align_center', value: 'center' },
                { icon: 'format_align_right', value: 'right' },
              ]" @update:model-value="val => {
                elementStates.align = val
                onEnteredProp('align', val)
              }"/>
      </div>
    </q-card-section>
    <q-separator :color="dark.isActive ? 'grey-9' : 'blue-grey-1'"/>
    <q-card-section>
      <div class="row align-center items-center justify-between">
        <label for="form-button-size">
              <span class="text-body2">
                Tamanho
              </span>
        </label>
        <q-btn-toggle id="form-button-size" :model-value="elementStates.size" no-wrap unelevated no-caps
                      toggle-color="primary" :color="dark.isActive ? 'grey-10' : 'blue-grey-1'" dense
                      :text-color="dark.isActive ? 'white' : 'grey-10'" :options="[
                { label: 'Padrão', value: 'default' },
                { label: 'Pequeno', value: 'sm' },
                { label: 'Médio', value: 'md' },
                { label: 'Grande', value: 'lg' },
              ]" @update:model-value="val => {
                elementStates.size = val
                if (val === 'default') {
                  onEnteredProp('size', '')
                  return
                }
                onEnteredProp('size', val)
              }"/>
      </div>
    </q-card-section>
    <q-separator :color="dark.isActive ? 'grey-9' : 'blue-grey-1'"/>
    <q-card-section>
      <div class="row align-center items-center justify-between">
        <label for="form-button-columns">
              <span class="text-body2">
                Colunas
              </span>
        </label>
        <q-btn-toggle id="form-button-columns" :model-value="formStore.formSettings.columns" no-wrap unelevated
                      no-caps toggle-color="primary" :color="dark.isActive ? 'grey-10' : 'blue-grey-1'" dense
                      :text-color="dark.isActive ? 'white' : 'grey-10'" :options="[
                { label: 'Padrão', value: 'default' },
                { label: 'Tablet', value: 'sm' },
                { label: 'Desktop', value: 'lg' },
              ]" @update:model-value="changeViewport"/>
      </div>
      <q-checkbox :model-value="isColumnDefault" label="Largura de coluna padrão"
                  @update:model-value="handleCheckboxUpdate"/>
      <q-btn-toggle v-if="!isColumnDefault" no-wrap unelevated dense spread toggle-color="primary"
                    :text-color="dark.isActive ? 'white' : 'grey-10'"
                    :color="dark.isActive ? 'grey-10' : 'blue-grey-1'"
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
            ]" @update:model-value="updateActiveFieldColumns"/>
    </q-card-section>
  </q-card>
</template>