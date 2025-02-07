<script setup lang="ts">
import { empty, eq } from '@formkit/utils'
import type { FormKitNode, FormKitSchemaDefinition } from '@formkit/core'

defineProps<{ formFields: FormKitSchemaDefinition[] }>()
const emit = defineEmits(['submit'])
const values = reactive({})

const data = computed(() => ({ ...values, empty, eq, contains }))

function onSubmit(data: any, node: FormKitNode) {
  emit('submit', data)
  node.submit()
}
</script>

<template>
  <article>
    <FormKit type="form" v-model="values" :actions="false" @submit="onSubmit">
      <div class="form-canvas q-py-sm rounded-borders grid grid-cols-12 row-gap-y-gutter column-gap-x-gutter">

        <div v-for="field in formFields" :key="field.name" class="form-field" :class="[
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
  </article>
</template>
<style lang="scss">
.form-canvas {
  height: fit-content;
}

.form-field {
  position: relative;
  pointer-events: auto;
}

.grid {
  display: grid
}

.grid-cols-12 {
  grid-template-columns: repeat(12, minmax(0, 1fr))
}

.row-gap-y-gutter {
  row-gap: 1rem;
}

.column-gap-x-gutter {
  column-gap: 1rem;
}

.span-1 {
  grid-column: span 1;
}

.span-2 {
  grid-column: span 2;
}

.span-3 {
  grid-column: span 3;
}

.span-4 {
  grid-column: span 4;
}

.span-5 {
  grid-column: span 5;
}

.span-6 {
  grid-column: span 6;
}

.span-7 {
  grid-column: span 7;
}

.span-8 {
  grid-column: span 8;
}

.span-9 {
  grid-column: span 9;
}

.span-10 {
  grid-column: span 10;
}

.span-11 {
  grid-column: span 11;
}

.span-12 {
  grid-column: span 12;
}
</style>
