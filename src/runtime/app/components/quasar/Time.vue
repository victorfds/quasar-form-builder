<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QInputProps, QTimeProps } from 'quasar'

const props = defineProps<{ context: FormKitFrameworkContext & { attrs: QInputProps & QTimeProps } }>()

const { dark } = useQuasar()
const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
const errorActive = computed(() => hasError.value || (props.context?.state?.submitted && props.context?.state?.valid === false) || (props.context?.state?.touched && props.context?.state?.valid === false))
const timeAttrs = computed(() => ({
  format24h: true,
  ...props.context.attrs,
}))
</script>

<template>
  <q-input
    filled
    :model-value="context.value"
    :error-message="getMessages"
    color="cyan-8"
    :error="errorActive"
    :label="context.label"
    :hint="context.attrs.description"
    :dense="context.attrs.dense"
    inputmode="none"
    hide-bottom-space
    :placeholder="context.attrs.placeholder"
    @blur="checkForErrorMessages"
  >
    <template #append>
      <q-icon name="access_time" class="cursor-pointer" :color="dark.isActive ? 'grey-5' : 'blue-grey-5'">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-time
            :model-value="context.value as string"
            v-bind="timeAttrs"
            @update:model-value="(val) => context?.node.input(val)"
          >
            <div class="row items-center justify-end">
              <q-btn v-close-popup label="Fechar" color="primary" flat />
            </div>
          </q-time>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>
