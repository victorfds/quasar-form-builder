<template>
  <q-btn-toggle @update:model-value="(val) => context?.node.input(val)" :model-value="context.value"
    :label="context.label" unelevated v-bind="context.attrs" toggle-color="primary" emit-value
    :error-message="getMessages" :error="hasError" @blur="checkForErrorMessages" />
</template>

<script setup lang="ts">
const props = defineProps({ context: Object })

const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
</script>
