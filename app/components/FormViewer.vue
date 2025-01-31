<script setup lang="ts">
import { empty, eq } from '@formkit/utils'
import type { FormKitNode, FormKitSchemaDefinition } from '@formkit/core'

defineProps<{ formFields: FormKitSchemaDefinition[] }>()
const emit = defineEmits(['submit'])
const values = reactive({})

const data = computed(() => ({ ...values, empty, eq, contains }))

function onSubmit(data: any, node: FormKitNode) {
  emit('submit', data)
}
</script>

<template>
  <FormKit type="form" v-model="values" :actions="true" @submit="onSubmit">
    <div class="form-canvas q-py-sm rounded-borders grid grid-cols-12 row-gap-y-gutter column-gap-x-gutter">

      <div v-for="(field, index) in formFields" :key="field.name" class="form-field" :class="[
        field.columns ? `span-${formStore.formSettings.columns === 'default' ? field.columns?.container || field.columns?.default?.container || 12 : field.columns?.[formStore.formSettings.columns]?.container || 12}` : 'span-12',
        field.align && {
          right: 'flex justify-end',
          center: 'flex justify-center',
          left: 'flex justify-start',
        }[field.align] || '',
      ]">

        <FormKitSchema :schema="field" :data="data" />
      </div>
    </div>
  </FormKit>

</template>
