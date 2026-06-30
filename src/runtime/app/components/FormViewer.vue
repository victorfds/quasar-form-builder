<script setup lang="ts">
import type { ColumnsType } from '#qfb/types'
import type { FormKitNode, FormKitSchemaDefinition } from '@formkit/core'
import { builderModeKey, schemaDataKey } from '#qfb/constants/injectionKeys'
import { empty, eq } from '@formkit/utils'

type ViewerField = FormKitSchemaDefinition & {
  name?: string
  columns?: ColumnsType & Record<string, any>
  align?: 'left' | 'center' | 'right'
  $el?: string
  label?: string
  info?: string
  description?: string
}

const props = defineProps<{ formFields: FormKitSchemaDefinition[], readonly?: boolean }>()
const emit = defineEmits<{
  (e: 'submit', data: any): void
}>()
const values = defineModel<any>({ default: () => ({}) })
const data = computed(() => ({
  ...values.value,
  empty,
  eq,
  contains,
  isToday,
  isTomorrow,
  isYesterday,
  isDayAfterTomorrow,
  isDayBeforeYesterday,
}))

provide(builderModeKey, false)
provide(schemaDataKey, data)

function onSubmit(data: any, _node: FormKitNode) {
  if (props.readonly) return
  emit('submit', data)
  // The node has a builtin function that can be used called node.submit()
}

function updateModelValues(newValues: any) {
  if (props.readonly) return
  values.value = newValues
}

function onSubmitInvalid(node: FormKitNode) {
  // Mark all inputs as touched so FormKit shows validation messages
  node.walk((n) => {
    // Only mark real input nodes (skip the form node itself)
    if (n.type !== 'input') return
    n.store.set({
      visible: true,
      type: 'error',
      key: 'required',
      blocking: true,
      meta: {
        touched: true,
      },
    })
  })
}

const renderFields = computed(() => withStructureChildrenListForRender((props.formFields || []) as unknown as ViewerField[]))
const { getGridColumnStyle, getAlignClass } = useFieldLayout()
</script>

<template>
  <article>
    <FormKit
      :model-value="values" type="form" :actions="false"
      validation-visibility="submit" @submit="onSubmit" @submit-invalid="onSubmitInvalid"
      @update:model-value="updateModelValues"
    >
      <FormCanvas>
        <div
          v-for="(field, index) in renderFields"
          :key="field.name || index"
          class="form-field form-field--responsive"
          :class="getAlignClass(field)"
          :style="getGridColumnStyle(field)"
        >
          <WithLabelAndDescription
            v-if="field.$el" :label="field.label" :info="field.info"
            :description="field.description"
          >
            <FormKitSchema :schema="field" :data="data" />
          </WithLabelAndDescription>

          <FormKitSchema v-else :schema="field" :data="data" :readonly="props.readonly" />
        </div>
      </FormCanvas>
    </FormKit>
  </article>
</template>

<style lang="scss">
/* When inputs are invalid (after being touched or submit), make the control more evident */
.formkit-outer[data-invalid="true"] .q-field__control {
  box-shadow: 0 0 0 1px #e53935 inset;
}

/* Show asterisk only when invalid is visible (blurred or after submit) */
.formkit-outer[data-invalid="true"] .q-field__label::after {
  content: ' *';
  color: #e53935;
}
</style>
