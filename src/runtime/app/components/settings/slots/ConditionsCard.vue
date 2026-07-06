<script setup lang="ts">
import type { FormKitSchemaDefinition } from '@formkit/core'
import type { ConditionValueInputMode, LogicField } from '#qfb/types'
import { useQuasar } from 'quasar'
import { computed, reactive, ref } from 'vue'
import { useFormStore } from '#qfb/stores/formStore'
import { getAllConditionOperators, getConditionOperatorsForField, getConditionValueInputMode, isConditionOperatorAllowedForField, isConditionTargetField, needsConditionValue } from '#qfb/utils/conditionOperators'
import { generateHumanReadableText, parseLogic, saveLogic } from '#qfb/utils/formUtils'

const props = defineProps<{
  noConditionsMessage?: string
  conditionsDialogSubtitle?: string
  saveTo?: 'if' | 'validation' | 'disable' | 'readonly'
  mode?: 'summary' | 'icon'
  element?: Record<string, any> | null
  updateProp?: (prop: 'if' | 'validation' | 'disable' | 'readonly', value: any) => void
}>()

const { dark } = useQuasar()
const formStore = useFormStore()
const { onEnteredProp, getFieldByName } = formStore

const activeElement = computed(() => props.element || formStore.activeField)

const elementStates = reactive<{ logicFields: LogicField[] }>({
  logicFields: parseLogic(getSavedLogicString()),
})

const conditionDialog = ref<boolean>(false)
const showConditionsForm = ref<boolean>(false)
const compactMode = computed(() => props.mode === 'icon')

const getFieldList = computed(() => {
  const activeName = (activeElement.value as any)?.name
  const list = formStore.allFields
    .filter(formField => formField.name !== activeName && isConditionTargetField(formField))
    .map(formField => ({ label: formField.name, value: formField.name, cannotSelect: false }))

  if (!list.length) return [{ label: 'A lista está vazia', value: null, cannotSelect: true }]

  return list
})

function toggleConditionDialog() {
  conditionDialog.value = !conditionDialog.value
  if (conditionDialog.value) {
    // Re-parse saved logic when opening
    elementStates.logicFields = parseLogic(getSavedLogicString())
  }
}

function getOptionsBasedOnField(fieldName: string): FormKitSchemaDefinition {
  if (!fieldName) return []

  const field = formStore.allFields.find(element => element.name === fieldName)
  if (field?.options) {
    return field?.options
  }
  return []
}

function triggerSaveLogic() {
  const updateProp = props.updateProp || onEnteredProp
  saveLogic(elementStates, props.saveTo, updateProp)
  conditionDialog.value = false
}

function resetConditions() {
  elementStates.logicFields = [{ name: '', operator: '', value: '', values: [], or: [] }]
}

function getOriginalField(fieldName?: string) {
  return fieldName ? getFieldByName(fieldName) : null
}

function resetConditionValue(field: LogicField) {
  field.value = ''
  field.values = []
}

function handleFieldNameChange(field: LogicField) {
  resetConditionValue(field)

  const originalField = getOriginalField(field.name)
  if (!isConditionOperatorAllowedForField(originalField, field.operator)) {
    field.operator = ''
  }
}

function handleOperatorChange(field: LogicField) {
  resetConditionValue(field)
}

function getOperators(field: LogicField) {
  return getConditionOperatorsForField(getOriginalField(field.name))
}

function needsValue(operator?: string): boolean {
  return needsConditionValue(operator)
}

// Higher-level helpers to simplify template conditions
function getSavedLogicString(): string {
  const active: any = activeElement.value
  if (!active) return ''
  if (props.saveTo === 'validation') return active?.validation?.if || ''
  if (props.saveTo === 'disable') return active?.disable?.if || ''
  if (props.saveTo === 'readonly') return active?.readonly?.if || ''
  return active?.if || ''
}

function hasSavedLogic(): boolean {
  return Boolean(getSavedLogicString())
}

function getConditionCount() {
  return parseLogic(getSavedLogicString())
    .filter(field => field.name && field.operator)
    .reduce((count, field) => count + 1 + (field.or?.filter(orField => orField.name && orField.operator).length || 0), 0)
}

function shouldShowNoConditionsSummary(): boolean {
  return !hasSavedLogic()
}

function isEqualsOrNotEquals(op?: string): boolean {
  return op === 'equals' || op === 'notEquals'
}

function hasOptionsFor(fieldName?: string): boolean {
  return !!(fieldName && (getOptionsBasedOnField(fieldName) as any)?.length)
}

function getValueInputMode(field: LogicField): ConditionValueInputMode {
  return getConditionValueInputMode(getOriginalField(field.name), field.operator)
}

function showOptionsSelect(field: LogicField): boolean {
  return Boolean(field.name && hasOptionsFor(field.name) && getValueInputMode(field) === 'options-multiple')
}

function showSingleOptionSelect(field: LogicField): boolean {
  return Boolean(field.name && hasOptionsFor(field.name) && getValueInputMode(field) === 'options-single')
}

function showTagsInput(field: LogicField): boolean {
  return Boolean(field.name && isEqualsOrNotEquals(field.operator) && getValueInputMode(field) === 'tags')
}

function showValueInput(field: LogicField): boolean {
  return Boolean(field.name && getValueInputMode(field) === 'text')
}

function columnClass(field: LogicField): string {
  return field.name && needsValue(field.operator) ? 'two-columns' : 'one-column'
}

function shouldShowDialogEmptyState(): boolean {
  if (!props.saveTo || props.saveTo === 'if') return false
  const active: any = activeElement.value
  const hasGlobalIf = Boolean(active?.if)
  return !hasSavedLogic() && !hasGlobalIf && !showConditionsForm.value
}

function hasSubtitle(): boolean {
  return Boolean(props.conditionsDialogSubtitle)
}
</script>

<template>
  <q-btn
    v-if="compactMode"
    dense
    unelevated
    no-caps
    color="primary"
    class="condition-icon-button"
    aria-label="Editar condições"
    @click="toggleConditionDialog"
  >
    [ ]
    <q-badge v-if="getConditionCount()" color="grey-2" text-color="blue-grey-10" floating rounded>
      {{ getConditionCount() }}
    </q-badge>
  </q-btn>

  <q-card v-else flat>
    <q-card-section>
      <div
        class="row align-center items-center justify-between q-pa-sm rounded-borders"
        :class="dark.isActive ? 'bg-grey-10' : 'bg-blue-grey-1'"
      >
        <div v-if="shouldShowNoConditionsSummary()" class="text-body2">
          {{ noConditionsMessage || 'Este elemento não contém condições' }}
        </div>
        <div v-else class="text-body2">
          <code>
            {{ generateHumanReadableText(parseLogic(getSavedLogicString()), getAllConditionOperators()) }}
          </code>
        </div>
        <q-btn no-caps label="Editar" aria-label="Editar condições" color="primary" dense @click="toggleConditionDialog" />
      </div>
    </q-card-section>
  </q-card>
  <q-dialog
    v-model="conditionDialog" backdrop-filter="brightness(50%)"
    @before-hide="() => { showConditionsForm = false }"
  >
    <q-card style="width: 700px; max-width: 80vw;">
      <q-card-section class="row items-center" :class="dark.isActive ? 'bg-grey-10' : 'bg-blue-grey-1'">
        <div>
          <h5 class="text-weight-semibold no-margin">
            Condições
          </h5>
          <h6
            v-if="hasSubtitle()" class="text-subtitle1 no-margin"
            :class="dark.isActive ? 'text-grey-6' : 'text-blue-grey-6'"
          >
            {{ conditionsDialogSubtitle }}
          </h6>
          <div class="text-body1" :class="dark.isActive ? 'text-grey-7' : 'text-blue-grey-6'">
            {{ elementStates.name }}
          </div>
        </div>
        <q-space />
        <q-btn v-close-popup flat dense round icon="close" :color="dark.isActive ? 'grey-5' : 'blue-grey-8'" />
      </q-card-section>

      <q-card-section>
        <div v-if="shouldShowDialogEmptyState()" class="column align-center content-center justify-center text-center q-py-xl">
          <div class="text-body2 text-weight-semibold">
            Sem condições
          </div>
          <div class="text-body2" :class="dark.isActive ? 'text-grey-6' : 'text-blue-grey-6'">
            A lista de condições está
            vazia
          </div>
          <q-btn
            no-caps class="q-mt-sm" label="Adicionar condição" color="primary"
            @click="showConditionsForm = !showConditionsForm"
          />
        </div>
        <div v-else>
          <div v-for="(field, index) in elementStates.logicFields" :key="index" class="condition-and">
            <div class="condition-wrapper">
              <q-select
                v-model="field.name" :options="getFieldList" option-disable="cannotSelect" emit-value filled
                label="Campo" @update:model-value="() => handleFieldNameChange(field)"
              />

              <div :class="columnClass(field)">
                <q-select :key="`operator-${field.name || 'empty'}-${index}`" v-model="field.operator" :options="getOperators(field)" filled emit-value map-options label="Operador" @update:model-value="() => handleOperatorChange(field)">
                  <template #no-option>
                    <q-item>
                      <q-item-section class="text-grey">
                        Escolha um campo primeiro
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>

                <q-select
                  v-if="showOptionsSelect(field)"
                  v-model="field.values" :options="getOptionsBasedOnField(field.name)" multiple filled label="valor"
                  map-options emit-value
                >
                  <template #no-option>
                    <q-item>
                      <q-item-section class="text-italic text-grey">
                        Sem opções
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
                <q-select
                  v-if="showSingleOptionSelect(field)"
                  v-model="field.value" :options="getOptionsBasedOnField(field.name)" filled label="valor"
                  map-options emit-value clearable
                >
                  <template #no-option>
                    <q-item>
                      <q-item-section class="text-italic text-grey">
                        Sem opções
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
                <q-input
                  v-if="showTagsInput(field)"
                  v-model="field.value" filled clearable @keyup.enter="function addTag() {
                    const value = field.value.trim()
                    if (value && !field.values.includes(value)) {
                      field.values.push(value)
                    }
                    field.value = ''
                  }" @blur="function addTag() {
                    const value = field.value.trim()
                    if (value && !field.values.includes(value)) {
                      field.values.push(value)
                    }
                    field.value = ''
                  }"
                >
                  <template #prepend>
                    <div class="q-gutter-xs row flex-wrap">
                      <q-chip
                        v-for="(tag, tagIndex) in field.values" :key="tagIndex" removable @remove="() => (function removeTag(index: number) {
                          field.values.splice(index, 1)
                        })(tagIndex)
                        "
                      >
                        {{ tag }}
                      </q-chip>
                    </div>
                  </template>
                </q-input>

                <q-input v-if="showValueInput(field)" v-model="field.value" filled />
              </div>
            </div>

            <div v-for="(fieldOr, indexOr) in elementStates.logicFields[index]?.or" :key="indexOr" class="condition-or">
              <div class="condition-wrapper-or">
                <q-select
                  v-model="fieldOr.name" :options="getFieldList" option-disable="cannotSelect" filled emit-value
                  label="Campo" @update:model-value="() => handleFieldNameChange(fieldOr)"
                />

                <div :class="columnClass(fieldOr)">
                  <q-select :key="`operator-or-${fieldOr.name || 'empty'}-${index}-${indexOr}`" v-model="fieldOr.operator" :options="getOperators(fieldOr)" filled emit-value map-options label="Operador" @update:model-value="() => handleOperatorChange(fieldOr)">
                    <template #no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          Escolha um campo primeiro
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>

                  <q-select
                    v-if="showOptionsSelect(fieldOr)"
                    v-model="fieldOr.values" :options="getOptionsBasedOnField(fieldOr.name)" multiple filled
                    label="valor" map-options emit-value
                  >
                    <template #no-option>
                      <q-item>
                        <q-item-section class="text-italic text-grey">
                          Sem opções
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                  <q-select
                    v-if="showSingleOptionSelect(fieldOr)"
                    v-model="fieldOr.value" :options="getOptionsBasedOnField(fieldOr.name)" filled
                    label="valor" map-options emit-value clearable
                  >
                    <template #no-option>
                      <q-item>
                        <q-item-section class="text-italic text-grey">
                          Sem opções
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                  <q-input
                    v-if="showTagsInput(fieldOr)" v-model="fieldOr.value" filled clearable @keyup.enter="function addTag() {
                      const value = fieldOr.value.trim()
                      if (value && !fieldOr.values.includes(value)) {
                        fieldOr.values.push(value)
                      }
                      fieldOr.value = ''
                    }" @blur="function addTag() {
                      const value = fieldOr.value.trim()
                      if (value && !fieldOr.values.includes(value)) {
                        fieldOr.values.push(value)
                      }
                      fieldOr.value = ''
                    }"
                  >
                    <template #prepend>
                      <div class="q-gutter-xs row flex-wrap">
                        <q-chip
                          v-for="(tag, indexTag) in fieldOr.values" :key="indexTag" removable @remove="() => (function removeTag(index: number) {
                            fieldOr.values.splice(index, 1)
                          })(indexTag)
                          "
                        >
                          {{ tag }}
                        </q-chip>
                      </div>
                    </template>
                  </q-input>

                  <q-input v-if="showValueInput(fieldOr)" v-model="fieldOr.value" filled />
                </div>
              </div>
            </div>
            <q-btn
              color="primary" label="Ou" no-caps class="q-mt-md" @click="() => {
                elementStates.logicFields[index].or = elementStates.logicFields[index].or || []
                elementStates.logicFields[index].or!.push({ name: '', operator: '', value: '', values: [], or: [] })
              }"
            />
          </div>
          <q-btn
            color="primary" label="E" class="q-mt-md"
            @click="elementStates.logicFields.push({ name: '', operator: '', value: '', values: [], or: [] })"
          />
        </div>
      </q-card-section>

      <q-separator :color="dark.isActive ? 'grey-9' : 'blue-grey-1'" />

      <q-card-actions>
        <q-btn no-caps color="primary" label="Salvar" @click="triggerSaveLogic" />
        <q-btn no-caps flat :color="dark.isActive ? 'grey' : 'blue-grey'" label="Recomeçar" @click="resetConditions" />
        <q-space />

        <q-btn v-close-popup no-caps flat :color="dark.isActive ? 'grey' : 'blue-grey'" label="Cancelar" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style lang="scss" scoped>
:root {
  --line-color: grey;
  --description-separator-color: #424242;
}

.body--dark {
  --line-color: #424242;
  --description-separator-color: #424242;
}

.body--light {
  --line-color: #b0bec5;
  --description-separator-color: #90a4ae;
}

.condition-wrapper {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1rem;

  &::before {
    background: var(--description-separator-color, grey);
    color: white;
    content: 'E';
    font-variant-caps: all-small-caps;
    z-index: 222;
    position: absolute;
    line-height: 2rem;
    text-align: center;
    left: 0;
    right: 0;
    bottom: 50%;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
  }
}

.condition-wrapper-or {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1rem;
  margin-top: 1rem;
  position: relative;

  > :first-child::before {
    background: var(--description-separator-color, grey);
    color: white;
    content: 'Ou';
    font-variant-caps: all-small-caps;
    position: absolute;
    line-height: 2rem;
    text-align: center;
    left: -3rem;
    right: 0;
    bottom: 0;
    top: calc(50% - 1rem);
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
  }

}

.one-column {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.two-columns {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1rem;
}

.condition-and {
  position: relative;
  padding-left: 3rem;
  padding-right: 1rem;
  margin-bottom: 1rem;

  &::before {
    background: var(--line-color, grey);
    content: '';
    position: absolute;
    width: 1px;
    height: 120%;
    left: 1rem;
    right: 0;
    top: 0;
    bottom: 0;
  }
}

.condition-or {
  position: relative;
  padding-left: 2rem;
  margin-left: 1rem;

  &::before {
    background: var(--line-color, grey);
    content: '';
    position: absolute;
    width: 1px;
    height: 150%;
    left: 0;
    right: 0;
    top: -1rem;
    bottom: 0;
  }
}

.condition-icon-button {
  min-height: 36px;
  min-width: 36px;
}
</style>
