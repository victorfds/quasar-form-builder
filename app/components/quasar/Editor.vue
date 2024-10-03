<script setup lang="ts">
const props = defineProps({ context: Object })

const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
</script>

<template>
  <q-editor
    :model-value="context.value || 'Digite seu texto aqui'"
    :label="context.label" flat :type="context.inputType" :hint="context.help"
    v-bind="context.attrs" :error-message="getMessages" :error="hasError" @update:model-value="(val) => context?.node.input(val)"
    @blur="checkForErrorMessages"
  />
</template>
