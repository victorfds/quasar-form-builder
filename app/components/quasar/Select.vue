<script setup lang="ts">
const props = defineProps({ context: Object })

const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
</script>

<template>
  <q-select
    :model-value="context.value" :label="context.label" filled
    hide-bottom-space v-bind="context.attrs" :hint="context.help" emit-value :error-message="getMessages" :error="hasError" @update:model-value="(val) => context?.node.input(val)"
    @blur="checkForErrorMessages"
  />
</template>
