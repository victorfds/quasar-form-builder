<script setup lang="ts">
const { dark, localStorage } = useQuasar()
const formStore = useFormStore()
const { setActiveField, copyField, removeField } = formStore

const elementsClosed = localStorage.getItem('elements-closed')

const elementStates = ref<{ name?: string, nameError?: string, label?: string }>({ name: formStore.activeField?.name })
const propNameInputRef = ref<HTMLElement | null>(null)
const propLabelInputRef = ref<HTMLElement | null>(null)

watch(() => formStore.activeField, (newVal) => {
  elementStates.value.name = newVal?.name
  elementStates.value.nameError = ''
}, { deep: true })

function onClickLabel(refElement: HTMLElement | null) {
  refElement?.focus()
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

function onEnteredProp(propName: string, propValue?: string) {
  if (!propName || !propValue) return
  console.log(propName, propValue)
}
</script>
<template>
  <q-list separator>
    <q-item :class="{ 'bg-grey-9 text-grey-11': dark.isActive, 'bg-blue-grey-1 text-blue-grey-10': !dark.isActive }">
      <q-item-section avatar>
        <q-btn size="sm" flat dense round icon="close" :color="dark.isActive ? 'grey-5' : 'blue-grey-8'"
          @click="setActiveField(null)" />
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
          <q-btn size="sm" flat dense round icon="o_content_copy" :color="dark.isActive ? 'grey-5' : 'blue-grey-8'"
            @click="copyField(formStore.activeField)" />
          <q-btn size="sm" flat dense round icon="o_delete" :color="dark.isActive ? 'grey-5' : 'blue-grey-8'"
            @click="removeField(formStore.activeField)" />
          <q-btn size="sm" flat dense round icon="o_expand" :color="dark.isActive ? 'grey-5' : 'blue-grey-8'" />
        </div>
      </q-item-section>
    </q-item>
    <SettingsExpansionBaseWrapper>
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
                  filled color="cyan-8" dense type="text" @blur="onBlurName" />
              </div>
            </div>
          </q-card-section>
          <q-separator :color="dark.isActive ? 'grey-9' : 'blue-grey-1'"/>
          <q-card-section>
            <div>
              <div class="row align-center items-center justify-between">
                <label for="form-label" @click="onClickLabel(propLabelInputRef)">
                  <span class="text-body2">
                    Rótulo
                  </span>
                </label>
                <q-input id="form-label" ref="propLabelInputRef" v-model.trim="elementStates.label" hide-bottom-space
                  filled color="cyan-8" dense type="text" @blur="onEnteredProp('label', elementStates.label)" />
              </div>
            </div>
          </q-card-section>

        </q-card>
      </template>
    </SettingsExpansionBaseWrapper>
    <SettingsExpansionBaseWrapper label="Opções de botão">
      <template #options>
        <q-card flat>
          <q-card-section>
            <div>
            </div>
          </q-card-section>
        </q-card>
      </template>
    </SettingsExpansionBaseWrapper>
    <SettingsExpansionBaseWrapper>
      <template #layout>
        <q-card flat>
          <q-card-section>
            <div>
            </div>
          </q-card-section>
        </q-card>
      </template>
    </SettingsExpansionBaseWrapper>

    <pre>{{ formStore.activeField }}</pre>
  </q-list>

</template>
