<template>
  <q-select @update:model-value="(val) => context?.node.input(val)" :model-value="context.value" :label="context.label"
    outlined v-bind="context.attrs" :hint="context.help" emit-value :error-message="getMessages" :error="hasError"
    @blur="checkForErrorMessages" />
</template>

<script setup lang="ts">
const props = defineProps({ context: Object })

const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
</script>
