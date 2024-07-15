<template>
  <q-drawer class="toolbox" show-if-above v-model="model" side="left" bordered>
    <div v-for="tool in tools" :key="tool.name" class="tool-item" draggable="true"
      @dragstart="event => onDragStart(event, tool)">
      {{ tool.label }}
    </div>
  </q-drawer>
</template>

<script setup lang="ts">
import type { FormKitSchemaNode } from '@formkit/core';

const model = defineModel()

const formStore = useFormStore()

const tools = formStore.tools

const onDragStart = (ev: DragEvent, tool: FormKitSchemaNode) => {
  // Add this element's id to the drag payload so the drop handler will
  // know which element to add to its tree
  ev.dataTransfer?.setData("text", JSON.stringify(tool));

  formStore.setDraggedTool(tool)
}
</script>
<style lang="scss">
.toolbox {
  min-height: 300px;
  border: 1px solid #ccc;
  padding: 10px;
}

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
