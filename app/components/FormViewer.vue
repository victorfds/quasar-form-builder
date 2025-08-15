<script setup lang="ts">
import type { FormKitNode, FormKitSchemaDefinition } from "@formkit/core"
import type { ColumnsType } from "../types"
import { useFormKitData } from "../composables/useFormKitData"
import { useFieldLayout } from "../composables/useFieldLayout"

type ViewerField = FormKitSchemaDefinition & {
  name?: string
  columns?: ColumnsType & Record<string, any>
  align?: 'left' | 'center' | 'right'
  $el?: string
  label?: string
  info?: string
  description?: string
}

const props = defineProps<{ formFields: FormKitSchemaDefinition[], resposta?: any, readonly?: boolean }>()
const emit = defineEmits<{
  (e: 'submit', data: any): void
  (e: 'on:update-values', data: any): void
  (e: 'onSaveDraft', values: any): void
}>()
const values = reactive(props.resposta || {})
const { data } = useFormKitData(values)

function updateValues(newValues: any) {
  if (props.readonly) return
  Object.assign(values, newValues)
  emit("on:update-values", values)
}

function onSubmit(data: any, node: FormKitNode) {
  if (props.readonly) return
  emit("submit", data)
  // The node has a builtin function that can be used called node.submit()
}

function saveDraft() {
  emit('onSaveDraft', values)
}

const renderFields = computed(() => (props.formFields || []) as unknown as ViewerField[])
const { getContainerSpan, getAlignClass } = useFieldLayout()

defineExpose({ saveDraft, values })
</script>

<template>
  <article>
    <FormKit type="form" :model-value="values" @update:model-value="updateValues" :actions="false" @submit="onSubmit">
      <div class="form-canvas q-py-sm rounded-borders grid grid-cols-12 row-gap-y-gutter column-gap-x-gutter">
        <div v-for="(field, index) in renderFields" :key="field.name || index" class="form-field" :class="[
          field.columns ? `span-${getContainerSpan(field)}` : 'span-12',
          getAlignClass(field)
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
