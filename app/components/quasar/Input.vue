<script setup lang="ts">
const props = defineProps({ context: Object })

const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
</script>

<template>
  <q-input :model-value="context?.value" :label="context?.label" filled :type="context?.inputType || 'text'"
    :hint="context?.help" hide-bottom-space v-bind="context?.attrs" :error-message="getMessages" :error="hasError"
    @update:model-value="(val) => context?.node.input(val)" @blur="checkForErrorMessages" />
</template>
