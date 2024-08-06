<template>
  <q-input @update:model-value="(val) => context?.node.input(val)" :model-value="context.value" :label="context.label"
    filled :type="context.inputType || 'text'" :hint="context.help" v-bind="context.attrs" :error-message="getMessages"
    :error="hasError" @blur="checkForErrorMessages" />
</template>

<script setup lang="ts">
const props = defineProps({ context: Object })

const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
</script>
