<template>
  <q-drawer class="q-px-md q-py-md" show-if-above v-model="model" side="left" bordered>
    <q-scroll-area class="fit" visible>
      <div v-for="tool in tools" :key="tool.name" class="tool-item" draggable="true"
        @dragstart="event => onDragStart(event, tool)">
        {{ tool.label }}
      </div>
    </q-scroll-area>
  </q-drawer>
</template>

<script setup lang="ts">
import type { FormKitSchemaDefinition, FormKitSchemaNode } from '@formkit/core';

const model = defineModel()
const formStore = useFormStore()
const tools = ref<Record<{name: string, icon: string, description: string}, FormKitSchemaDefinition>>([
    {
      $formkit: 'q-input',
      name: 'input',
      label: 'Entrada de texto',
      validation: 'required',
    },
    {
      $formkit: 'q-select',
      name: 'select',
      label: 'Selecione as opções',
      options: [{ label: 'Opção 1', value: 'option1' }],
      validation: 'required',
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
  padding: 10px;
  margin: 5px 0;
  border: 1px solid #ccc;
  background-color: #976525;
  cursor: grab;
}

.tool-item:active {
  cursor: grabbing;
  opacity: 0.4;
}
</style>
