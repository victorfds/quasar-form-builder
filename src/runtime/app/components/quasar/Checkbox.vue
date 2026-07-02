<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QCheckboxProps } from 'quasar'
import { computed } from 'vue'
import { useValidationMessages } from '#qfb/composables/useValidationMessages'

const props = defineProps<{ context: FormKitFrameworkContext & { attrs: QCheckboxProps & { description?: string } } }>()

const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
const errorActive = computed(() =>
  hasError.value
  || (props.context?.state?.submitted && props.context?.state?.valid === false)
  || (props.context?.state?.touched && props.context?.state?.valid === false),
)
</script>

<template>
  <q-field
    borderless
    :model-value="context.value"
    :hint="context.attrs.description"
    :error-message="getMessages"
    :error="errorActive"
    hide-bottom-space
  >
    <template #control>
      <q-checkbox
        :model-value="context.value"
        :label="context.label"
        v-bind="context.attrs"
        @update:model-value="(val) => context?.node.input(val)"
        @blur="checkForErrorMessages"
      />
    </template>
  </q-field>
</template>
