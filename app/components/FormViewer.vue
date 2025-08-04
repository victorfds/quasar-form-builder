<script setup lang="ts">
import type { FormKitNode, FormKitSchemaDefinition } from "@formkit/core"
import { empty, eq } from "@formkit/utils"

const props = defineProps<{ formFields: FormKitSchemaDefinition[], resposta?: any, readonly?: boolean }>()
const emit = defineEmits(["submit", "on:update-values"])
const values = reactive(props.resposta || {})

const data = computed(() => ({ ...values, empty, eq, contains }))

function updateValues(newValues: any) {
  if (props.formFields) return
  Object.assign(values, newValues)
  emit("on:update-values", newValues)
}

function onSubmit(data: any, node: FormKitNode) {
  if (props.readonly) return
  emit("submit", data)
  // The node has a builtin function that can be used called node.submit()
}
</script>

<template>
  <article>
    <FormKit type="form" :model-value="values" @update:model-value="updateValues" :actions="false" @submit="onSubmit">
      <div class="form-canvas q-py-sm rounded-borders grid grid-cols-12 row-gap-y-gutter column-gap-x-gutter">
        <div v-for="field in formFields" :key="field.name" class="form-field" :class="[
          field.columns
            ? `span-${formStore.formSettings.columns === 'default' ? field.columns?.container || field.columns?.default?.container || 12 : field.columns?.[formStore.formSettings.columns]?.container || 12}`
            : 'span-12',
          (field.align &&
            {
              right: 'flex justify-end',
              center: 'flex justify-center',
              left: 'flex justify-start',
            }[field.align]) ||
          '',
        ]">
          <WithLabelAndDescription v-if="field.$el" :label="field.label" :info="field.info"
            :description="field.description">
            <FormKitSchema :schema="field" :data="data" />
          </WithLabelAndDescription>

          <FormKitSchema v-else :schema="field" :data="data" :readonly="readonly" />
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
  display: grid;
}

.grid-cols-12 {
  grid-template-columns: repeat(12, minmax(0, 1fr));
}

.row-gap-y-gutter {
  row-gap: 1rem;
}

.column-gap-x-gutter {
  column-gap: 1rem;
}

@for $i from 1 through 12 {
  .span-#{$i} {
    grid-column: span $i / span $i;
  }
}
</style>
