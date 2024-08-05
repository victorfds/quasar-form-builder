<template>
  <q-drawer class="q-px-md q-py-md" show-if-above v-model="model" side="left" bordered>
    <q-scroll-area class="fit" visible>
      <div v-for="tool in tools" :key="tool.name" class="tool-item" draggable="true"
        @dragstart="event => onDragStart(event, tool.schema)">
        <div class="row items-center q-mb-md">
          <q-avatar color="grey-10" :icon="tool.icon" />
          <div class="q-ml-sm">
            <div class="text-grey-11 text-weight-medium ">
              {{ tool.title }}
            </div>
            <div class="text-grey-7">
              {{ tool.description }}
            </div>
          </div>
        </div>
      </div>
    </q-scroll-area>
  </q-drawer>
</template>

<script setup lang="ts">
import type { FormKitSchemaDefinition, FormKitSchemaNode } from '@formkit/core';

const model = defineModel()
const formStore = useFormStore()
const tools = ref<{ name: string, icon: string, title: string, description: string, schema: FormKitSchemaDefinition }>([
  {
    name: 'input', icon: 'text_format', title: 'Texto curto', description: 'Entrada de uma única linha',
    schema:
    {
      $formkit: 'q-input',
      name: 'input',
      label: 'Entrada de texto',
      validation: 'required',
    },
  },
  {
    name: 'select', icon: 'arrow_drop_down', title: 'Selecionar', description: 'Uma escolha',
    schema: {
      $formkit: 'q-select',
      name: 'select',
      label: 'Selecione as opções',
      options: [{ label: 'Opção 1', value: 'option1' }],
      validation: 'required',
    }
  }
])

const onDragStart = (ev: DragEvent, tool: FormKitSchemaNode) => {
  // Add this element's id to the drag payload so the drop handler will
  // know which element to add to its tree
  ev.dataTransfer?.setData("text", JSON.stringify(tool));

  formStore.setDraggedTool(tool)
}
</script>
<style lang="scss">
.tool-item {
  cursor: grab;
}

.tool-item:active {
  cursor: grabbing;
  opacity: 0.4;
}
</style>
