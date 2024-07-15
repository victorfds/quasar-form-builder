<template>
  <q-input filled @update:model-value="(val) => context?.node.input(val)" :model-value="context.value || defaultDate"
    v-bind="context.attrs" :error-message="getMessages" :error="hasError" :hint="context.help"
    @blur="checkForErrorMessages" readonly>
    <template v-slot:prepend>
      <q-icon name="event" class="cursor-pointer">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-date @update:model-value="(val) => context?.node.input(val)" :model-value="context.value || defaultDate"
            mask="YYYY-MM-DD" today-btn>
            <div class="row items-center justify-end">
              <q-btn v-close-popup label="Close" color="primary" flat />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<script setup lang="ts">
const props = defineProps({ context: Object })

const defaultDate = new Date().toLocaleDateString()

const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
</script>
