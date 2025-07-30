<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QInputProps } from 'quasar'

const props = defineProps<{ context: FormKitFrameworkContext & { attrs: QInputProps } }>()

const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
</script>

<template>
  <q-input filled :model-value="context.value" v-bind="context.attrs" :error-message="getMessages" :error="hasError"
    :label="context.label" :hint="context.attrs.description" @update:model-value="(val) => context?.node.input(val)"
    @blur="checkForErrorMessages" mask="##/##/####" :rules="[(val, rule) => !rule.date(val) || 'Data inválida']"
    hide-bottom-space>
    <template #append>
      <q-icon name="event" class="cursor-pointer">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-date :model-value="context.value" mask="DD/MM/YYYY" today-btn
            @update:model-value="(val) => context?.node.input(val)" :readonly="context.attrs.readonly">
            <div class="row items-center justify-end">
              <q-btn v-close-popup label="Fechar" color="primary" flat />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>
