<template>
  <q-drawer class="no-scroll" show-if-above persistent v-model="model" side="right" bordered>
    <div>
      <q-list separator>
        <q-expansion-item
          :header-class="{ 'text-weight-semibold text-subtitle2': true, 'bg-grey-9 text-grey-11': dark.isActive, 'bg-blue-grey-1 text-blue-grey-10': !dark.isActive }"
          :expand-icon-class="dark.isActive ? 'text-grey-11' : 'text-grey-10'" label="Propriedades">
          <q-card>
            <q-card-section>
              <div>
                <div class="row align-center items-center justify-between">
                  <label for="form-name" @click="onClickLabelFormName">
                    <span class="text-body2">
                      Nome
                    </span>
                  </label>
                  <q-input id="form-name" ref="formNameInputRef" filled color="cyan-8" dense type="text"
                    v-model="formStore.formData.formName" />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </q-list>
    </div>
  </q-drawer>
</template>
<script setup lang="ts">

const model = defineModel()
const { dark } = useQuasar()
const formStore = useFormStore()

const formNameInputRef = ref<HTMLElement | null>(null)

const onClickLabelFormName = () => {
  formNameInputRef.value?.focus()
}
</script>
