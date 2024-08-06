<template>
  <q-drawer class="no-scroll" show-if-above persistent v-model="model" side="left" bordered>
    <q-tabs narrow-indicator class="bg-transparent" align="justify" indicator-color="transparent"
      active-bg-color="grey-9">
      <q-tab name="elements" label="Elementos" no-caps />
      <q-tab name="tree" label="Árvore" no-caps />
    </q-tabs>
    <q-scroll-area class="fit q-pa-md" visible>
      <div v-for="tool in tools" :key="tool.name" class="tool-item" draggable="true"
        @dragstart="event => onDragStart(event, tool.schema)">
        <div class="row items-center no-wrap q-mb-lg">
          <q-avatar rounded size="lg" font-size="1.4rem" color="grey-9" text-color="grey-5" :icon="tool.icon" />
          <div class="q-ml-sm">
            <div class="text-grey-11 text-weight-medium text-subtitle2">
              {{ tool.title }}
            </div>
            <div class="text-grey-7 text-caption">
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
const tools = ref<{ name: string, icon: string, title: string, description: string, schema: FormKitSchemaDefinition }>([
  {
    name: 'text',
    icon: 'text_format',
    title: 'Entrada de texto',
    description: 'Texto de uma única linha',
    schema:
    {
      $formkit: 'q-input',
      name: 'text',
      label: 'Texto',
    },
  },
  {
    name: 'number',
    icon: '123',
    title: 'Entrada numérica',
    description: 'Digite apenas de números',
    schema:
    {
      $formkit: 'q-input',
      name: 'number',
      label: 'Número',
      propType: 'number'
    },
  },
  {
    name: 'email',
    icon: 'alternate_email',
    title: 'Endereço de email',
    description: 'Entrada de texto que espera um email',
    schema:
    {
      $formkit: 'q-input',
      name: 'email',
      label: 'Email',
      propType: 'email'
    },
  },
  {
    name: 'phone',
    icon: 'phone',
    title: 'Número de telefone',
    description: 'Número de telefone com máscara',
    schema:
    {
      $formkit: 'q-input',
      name: 'phone',
      label: 'Número de telefone',
      mask: "(##) #####-####",
      'unmasked-value': true,
      propType: 'text'
    },
  },

  {
    name: 'textarea',
    icon: 'wrap_text',
    title: 'Área de texto',
    description: 'Única linha ou multilinhas',
    schema:
    {
      $formkit: 'q-input',
      name: 'textarea',
      label: 'Área de texto',
      validation: 'required',
      inputType: 'textarea'
    },
  },
  {
    name: 'select',
    icon: 'arrow_drop_down',
    title: 'Selecionar',
    description: 'Uma única escolha',
    schema: {
      $formkit: 'q-select',
      name: 'select',
      label: 'Selecione',
      options: [{ label: 'Opção 1', value: 'option1' }],
      validation: 'required',
    },
  }
])

const onDragStart = (ev: DragEvent, tool: FormKitSchemaNode) => {
  // Add this element's id to the drag payload so the drop handler will
  // know which element to add to its tree
  ev.dataTransfer?.setData("text", JSON.stringify(tool))
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
