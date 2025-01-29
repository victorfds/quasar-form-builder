<script setup lang="ts">
import type { FormKitSchemaDefinition } from '@formkit/core'
import type { LogicField } from '~/types'
import { operators } from '~/constants'

const props = defineProps<{ noConditionsMessage?: string, conditionsDialogSubtitle?: string, saveTo?: 'if' | 'validation' | 'disable' }>()

const { dark } = useQuasar()
const formStore = useFormStore()
const { onEnteredProp } = formStore

const elementStates = reactive<{
  logicFields: LogicField[]
}>({
  logicFields: parseLogic(props.saveTo === 'validation' ? formStore.activeField?.validation?.if : props.saveTo === 'disable' ? formStore.activeField?.disable?.if : formStore.activeField?.if)
})

const conditionDialog = ref<boolean>(false)
const showConditionsForm = ref<boolean>(false)

const getFieldList = computed(() => {
  const list = formStore.formFields.filter(k => k.name !== formStore.activeField?.name && k.name !== 'slots').map(formField => ({ label: formField.name, value: formField.name, cannotSelect: formField.$formkit === 'q-btn' }))
  if (!list.length) return [{ label: 'A lista está vazia', value: null, cannotSelect: true }]

  return list
})

function toggleConditionDialog() {
  conditionDialog.value = !conditionDialog.value
  if (conditionDialog.value) {
    // If it is true parseLogic again
    elementStates.logicFields = parseLogic(props.saveTo === 'validation' ? formStore.activeField?.validation?.if : props.saveTo === 'disable' ? formStore.activeField?.disable?.if : formStore.activeField?.if)
  }
}

function getOptionsBasedOnField(fieldName: string): FormKitSchemaDefinition {
  if (!fieldName) return []

  const field = formStore.formFields.find(element => element.name === fieldName)
  if (field?.options) {
    return field?.options
  }
  return []
}

function triggerSaveLogic() {
  saveLogic(elementStates, props.saveTo, onEnteredProp)
  conditionDialog.value = false
}

function resetConditions() {
  elementStates.logicFields = [{ name: '', operator: '', value: '', values: [], or: [] }]
}
</script>
<template>
  <q-card flat>
    <q-card-section>
      <div class="row align-center items-center justify-between q-pa-sm rounded-borders"
        :class="dark.isActive ? 'bg-grey-10' : 'bg-blue-grey-1'">
        <div
          v-if="saveTo === 'validation' ?
            !formStore.activeField?.validation?.if : saveTo === 'disable' ? !formStore.activeField?.disable?.if : !formStore.activeField?.if"
          class="text-body2">
          {{ noConditionsMessage || 'Este elemento não contém condições' }}
        </div>
        <div v-else class="text-body2">
          <code>
            {{ generateHumanReadableText(parseLogic(saveTo === 'validation' ?
              formStore.activeField?.validation?.if : saveTo === 'disable' ? formStore.activeField?.disable?.if :
                formStore.activeField?.if), operators) }}
          </code>
        </div>
        <q-btn no-caps label="Editar" color="primary" dense @click="toggleConditionDialog" />
      </div>
    </q-card-section>
  </q-card>
  <q-dialog v-model="conditionDialog" backdrop-filter="brightness(50%)"
    @before-hide="() => { showConditionsForm = false }">
    <q-card style="width: 700px; max-width: 80vw;">
      <q-card-section class="row items-center" :class="dark.isActive ? 'bg-grey-10' : 'bg-blue-grey-1'">
        <div>
          <h5 class="text-weight-semibold no-margin">Condições</h5>
          <h6 v-if="conditionsDialogSubtitle" class="text-subtitle1 no-margin"
            :class="dark.isActive ? 'text-grey-6' : 'text-blue-grey-6'">
            {{ conditionsDialogSubtitle }}
          </h6>
          <div class="text-body1" :class="dark.isActive ? 'text-grey-7' : 'text-blue-grey-6'">{{ elementStates.name }}
          </div>
        </div>
        <q-space />
        <q-btn flat dense round icon="close" :color="dark.isActive ? 'grey-5' : 'blue-grey-8'" v-close-popup />

      </q-card-section>

      <q-card-section>
        <div
          v-if="saveTo !== 'if' && !formStore.activeField?.[saveTo]?.if && !formStore.activeField?.if && !showConditionsForm"
          class="column align-center content-center justify-center text-center q-py-xl">
          <div class="text-body2 text-weight-semibold">
            Sem condições
          </div>
          <div class="text-body2" :class="dark.isActive ? 'text-grey-6' : 'text-blue-grey-6'">A lista de condições está
            vazia
          </div>
          <q-btn no-caps class="q-mt-sm" label="Adicionar condição" color="primary"
            @click="showConditionsForm = !showConditionsForm" />
        </div>
        <div v-else>
          <div class="condition-and" v-for="(field, index) in elementStates.logicFields" :key="index">
            <div class="condition-wrapper">
              <q-select :options="getFieldList" v-model="field.name" option-disable="cannotSelect" emit-value filled
                label="Campo" @update:model-value="() => {
                  field.values = []
                }" />

              <div
                :class="field.name && field.operator && !field.operator?.includes('empty') && !field.operator?.includes('notEmpty') ? 'two-columns' : 'one-column'">
                <q-select :options="field.name ? operators : []" v-model="field.operator" filled emit-value map-options>
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey">
                        Escolha um campo primeiro
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>

                <q-select
                  v-if="field.name && field.operator && (field.operator === 'equals' || field.operator === 'notEquals') && getOptionsBasedOnField(field.name)?.length"
                  :options="getOptionsBasedOnField(field.name)" multiple v-model="field.values" filled label="valor"
                  map-options emit-value>
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-italic text-grey">
                        Sem opções
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
                <q-input
                  v-if="field.name && field.operator && !field.operator?.includes('empty') && !field.operator?.includes('notEmpty') && !getOptionsBasedOnField(field.name)?.length && (field.operator === 'equals' || field.operator === 'notEquals')"
                  v-model="field.value" filled @keyup.enter="function addTag() {
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
                  }" clearable>
                  <template v-slot:prepend>
                    <div class="q-gutter-xs row flex-wrap">
                      <q-chip v-for="(tag, index) in field.values" :key="index" removable @remove="() => (function removeTag(index: number) {
                        field.values.splice(index, 1)
                      })(index)
                        ">
                        {{ tag }}
                      </q-chip>
                    </div>
                  </template>
                </q-input>

                <q-input
                  v-if="field.name && field.operator && !field.operator?.includes('empty') && !field.operator?.includes('notEmpty') && field.operator !== 'equals' && field.operator !== 'notEquals'"
                  v-model="field.value" filled />
              </div>
            </div>

            <div class="condition-or" v-for="(fieldOr, indexOr) in elementStates.logicFields[index]?.or" :key="indexOr">
              <div class="condition-wrapper-or">
                <q-select :options="getFieldList" v-model="fieldOr.name" option-disable="cannotSelect" filled emit-value
                  label="Campo" @update:model-value="() => {
                    fieldOr.values = []
                  }" />

                <div
                  :class="fieldOr.name && fieldOr.operator && !fieldOr.operator?.includes('empty') && !fieldOr.operator?.includes('notEmpty') ? 'two-columns' : 'one-column'">
                  <q-select :options="fieldOr.name ? operators : []" v-model="fieldOr.operator" filled emit-value
                    map-options>
                    <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          Escolha um campo primeiro
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>

                  <q-select
                    v-if="fieldOr.name && fieldOr.operator && (fieldOr.operator === 'equals' || fieldOr.operator === 'notEquals') && getOptionsBasedOnField(field.name)?.length"
                    :options="getOptionsBasedOnField(fieldOr.name)" multiple v-model="fieldOr.values" filled
                    label="valor" map-options emit-value>
                    <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-italic text-grey">
                          Sem opções
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                  <q-input
                    v-if="fieldOr.name && fieldOr.operator && !fieldOr.operator?.includes('empty') && !fieldOr.operator?.includes('notEmpty') && !getOptionsBasedOnField(fieldOr.name)?.length && (fieldOr.operator === 'equals' || fieldOr.operator === 'notEquals')"
                    v-model="fieldOr.value" filled @keyup.enter="function addTag() {
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
                    }" clearable>
                    <template v-slot:prepend>
                      <div class="q-gutter-xs row flex-wrap">
                        <q-chip v-for="(tag, indexTag) in fieldOr.values" :key="indexTag" removable @remove="() => (function removeTag(index: number) {
                          fieldOr.values.splice(index, 1)
                        })(indexTag)
                          ">
                          {{ tag }}
                        </q-chip>
                      </div>
                    </template>
                  </q-input>

                  <q-input
                    v-if="fieldOr.name && fieldOr.operator && !fieldOr.operator?.includes('empty') && !fieldOr.operator?.includes('notEmpty') && fieldOr.operator !== 'equals' && fieldOr.operator !== 'notEquals'"
                    v-model="fieldOr.value" filled />
                </div>
              </div>


            </div>
            <q-btn color="primary" label="Ou" no-caps class="q-mt-md"
              @click="elementStates.logicFields[index]?.or?.push({ name: '', operator: '', value: '', values: [], or: null })" />

          </div>
          <q-btn color="primary" label="E" class="q-mt-md"
            @click="elementStates.logicFields.push({ name: '', operator: '', value: '', values: [], or: [] })" />
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
</style>
