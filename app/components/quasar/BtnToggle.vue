<script setup lang="ts">
const props = defineProps({ context: Object })

const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
</script>

<template>
  <q-btn-toggle
    :model-value="context.value" :label="context.label"
    unelevated v-bind="context.attrs" toggle-color="primary" emit-value :error-message="getMessages"
    :error="hasError" @update:model-value="(val) => context?.node.input(val)" @blur="checkForErrorMessages"
  />
</template>
