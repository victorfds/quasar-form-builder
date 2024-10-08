<script setup lang="ts">
const model = defineModel<boolean>()
const { dark } = useQuasar()
const formStore = useFormStore()
const { addField, setActiveField, copyField, removeField } = formStore

const elementStates = ref<{ name?: string, nameError?: string }>({ name: formStore.activeField?.name })
const formNameInputRef = ref<HTMLElement | null>(null)

watch(() => formStore.activeField, (newVal) => {
  elementStates.value.name = newVal?.name
  elementStates.value.nameError = ''
}, { deep: true })

function onClickLabelFormName() {
  formNameInputRef.value?.focus()
}

function onBlurName(_: Event) {
  elementStates.value.nameError = ''
  if (elementStates.value.name === formStore.activeField?.name)
    return

  const response = formStore.updateNameField(formStore.activeField.name, elementStates.value.name)

  if (response?.message === 'name cannot be empty') {
    elementStates.value.nameError = 'Nome não pode ser vazio'
    return
  }

  if (response?.message === 'name already exists') {
    elementStates.value.nameError = 'Este nome já existe'
    return
  }

}
</script>

<template>
  <q-drawer v-model="model" class="no-scroll" show-if-above persistent side="right" :width="340" bordered>
    <q-scroll-area class="fit" visible>
      <div v-if="formStore.activeField">
        <q-list separator>
          <q-item
            :class="{ 'bg-grey-9 text-grey-11': dark.isActive, 'bg-blue-grey-1 text-blue-grey-10': !dark.isActive }">
            <q-item-section avatar>
              <q-btn size="sm" flat dense round icon="close" @click="setActiveField(null)"
                :color="dark.isActive ? 'grey-5' : 'blue-grey-8'" />
            </q-item-section>

            <q-item-section>
              <q-item-label>
                <h6 class="text-h6 no-margin">
                  {{ formStore.activeField?.name }}
                </h6>
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="q-gutter-xs">

                <q-btn size="sm" flat dense round icon="o_content_copy"
                  :color="dark.isActive ? 'grey-5' : 'blue-grey-8'" @click="copyField(formStore.activeField)" />
                <q-btn size="sm" flat dense round icon="o_delete" :color="dark.isActive ? 'grey-5' : 'blue-grey-8'"
                  @click="removeField(formStore.activeField)" />
                <q-btn size="sm" flat dense round icon="o_expand" :color="dark.isActive ? 'grey-5' : 'blue-grey-8'" />
              </div>
            </q-item-section>
          </q-item>
          <q-expansion-item
            :header-class="{ 'text-weight-semibold text-subtitle2': true, 'bg-grey-9 text-grey-11': dark.isActive, 'bg-blue-grey-1 text-blue-grey-10': !dark.isActive }"
            :expand-icon-class="dark.isActive ? 'text-grey-5' : 'text-blue-grey-8'" label="Propriedades" default-opened>
            <q-card>
              <q-card-section>
                <div>
                  <div class="row align-center items-center justify-between">
                    <label for="form-name" @click="onClickLabelFormName">
                      <span class="text-body2">
                        Nome
                      </span>
                    </label>
                    <q-input id="form-name" ref="formNameInputRef" v-model.trim="elementStates.name"
                      :error="Boolean(elementStates.nameError)" :error-message="elementStates.nameError"
                      hide-bottom-space filled color="cyan-8" dense type="text" @blur="onBlurName" />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </q-list>
      </div>
      <div v-else>
        <q-list separator>
          <q-expansion-item
            :header-class="{ 'text-weight-semibold text-subtitle2': true, 'bg-grey-9 text-grey-11': dark.isActive, 'bg-blue-grey-1 text-blue-grey-10': !dark.isActive }"
            :expand-icon-class="dark.isActive ? 'text-grey-11' : 'text-grey-10'" label="Propriedades" default-opened>
            <q-card>
              <q-card-section>
                <div>
                  <div class="row align-center items-center justify-between">
                    <label for="form-name" @click="onClickLabelFormName">
                      <span class="text-body2">
                        Nome
                      </span>
                    </label>
                    <q-input id="form-name" ref="formNameInputRef" v-model.trim="formStore.formData.formName" filled
                      color="cyan-8" dense type="text" />
                  </div>

                  <div class="row align-center items-center justify-between q-mt-sm">
                    <q-checkbox left-label v-model="formStore.formData.preview.isFullWidth"
                      label="Pré-visualizar largura" class="text-body2" />
                    <q-input v-if="!formStore.formData.preview.isFullWidth"
                      v-model.lazy="formStore.formData.preview.width" suffix="px" filled color="cyan-8" dense
                      type="number" style="max-width: 130px;" />
                  </div>

                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </q-list>
      </div>
    </q-scroll-area>
  </q-drawer>
</template>
