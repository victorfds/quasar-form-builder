<script setup lang="ts">
import type { FormKitSchemaDefinition, FormKitSchemaNode } from '@formkit/core'
import type { UnwrapRef } from "vue"

const model = defineModel<boolean>()
const { dark } = useQuasar()
const tools = ref<{
  name: string,
  icon: string,
  title: string,
  description: string,
  schema: FormKitSchemaDefinition
}[]>([
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
      inputType: 'text',
      validation: {
        if: '$empty($number)',
        then: 'required|number',
        else: 'number'
      },
      disable: { if: '!$empty($number)', then: true }
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
      inputType: 'number',
      validation: 'number',
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
      inputType: 'email',
      validation: 'email',
    },
  },
  {
    name: 'phone',
    icon: 'phone',
    title: 'Número de telefone',
    description: 'Número de telefone com máscara',
    schema:
    {
      '$formkit': 'q-input',
      'name': 'phone',
      'label': 'Telefone',
      'mask': '(##) #####-####',
      'unmasked-value': true,
      'inputType': 'text',
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
      inputType: 'textarea',
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
  },
])
const statics = ref<{
  name: string,
  icon: string,
  title: string,
  description: string,
  schema: FormKitSchemaDefinition
}[]>([
  {
    name: 'button',
    icon: 'check',
    title: 'Botão de submissão',
    description: 'Botão que conclui o formulário',
    schema:
    {
      $formkit: 'q-btn',
      name: 'submit',
      buttonLabel: 'Finalizar',
    },
  },
])

const tab = ref('elements')
const elementsTypes = ref('fields')

function onDragStart(ev: DragEvent, tool: UnwrapRef<FormKitSchemaDefinition>) {
  // Add this element's id to the drag payload so the drop handler will
  // know which element to add to its tree
  ev.dataTransfer?.setData('text', JSON.stringify(tool))
}
</script>

<template>
  <q-drawer v-model="model" class="no-scroll" show-if-above persistent side="left">
    <q-tabs v-model="tab" narrow-indicator :class="dark.isActive ? 'bg-transparent' : 'bg-blue-grey-1'" align="justify"
      indicator-color="transparent" :active-bg-color="dark.isActive ? 'grey-9' : 'white'">
      <q-tab name="elements" label="Elementos" no-caps />
      <q-tab name="tree" label="Árvore" no-caps />
    </q-tabs>
    <q-scroll-area class="fit" visible>
      <q-tab-panels v-model="tab" animated>
        <q-tab-panel name="elements">
          <q-tabs v-model="elementsTypes" narrow-indicator dense
            :class="dark.isActive ? 'bg-transparent' : 'bg-blue-grey-1'" align="justify" indicator-color="transparent"
            :active-bg-color="dark.isActive ? 'grey-9' : 'white'">
            <q-tab name="fields" label="Campos" no-caps />
            <q-tab name="statics" label="Estáticos" no-caps />
            <q-tab name="structures" label="Estruturas" no-caps />
          </q-tabs>

          <q-tab-panels v-model="elementsTypes" animated>
            <q-tab-panel name="fields" class="no-padding q-mt-lg">
              <div v-for="tool in tools" :key="tool.name" class="tool-item" draggable="true"
                @dragstart="event => onDragStart(event, tool.schema)">
                <div class="row items-start no-wrap q-mb-lg">
                  <q-avatar rounded size="md" font-size="1.3rem" :color="dark.isActive ? 'grey-9' : 'blue-grey-2'"
                    :text-color="dark.isActive ? 'grey-5' : 'blue-grey-8'" :icon="tool.icon" />
                  <div class="q-ml-sm">
                    <div class="tool-title text-weight-semibold text-subtitle2"
                      :class="dark.isActive ? 'text-grey-11' : 'text-blue-grey-10'">
                      {{ tool.title }}
                    </div>
                    <div class="tool-description text-caption"
                      :class="dark.isActive ? 'text-grey-7 ' : 'text-blue-grey-7'">
                      {{ tool.description }}
                    </div>
                  </div>
                </div>
              </div>
            </q-tab-panel>

            <q-tab-panel name="statics" class="no-padding q-mt-lg">
              <div v-for="tool in statics" :key="tool.name" class="tool-item" draggable="true"
                @dragstart="event => onDragStart(event, tool.schema)">
                <div class="row items-start no-wrap q-mb-lg">
                  <q-avatar rounded size="md" font-size="1.3rem" :color="dark.isActive ? 'grey-9' : 'blue-grey-2'"
                    :text-color="dark.isActive ? 'grey-5' : 'blue-grey-8'" :icon="tool.icon" />
                  <div class="q-ml-sm">
                    <div class="tool-title text-weight-semibold text-subtitle2"
                      :class="dark.isActive ? 'text-grey-11' : 'text-blue-grey-10'">
                      {{ tool.title }}
                    </div>
                    <div class="tool-description text-caption"
                      :class="dark.isActive ? 'text-grey-7 ' : 'text-blue-grey-7'">
                      {{ tool.description }}
                    </div>
                  </div>
                </div>
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-tab-panel>
      </q-tab-panels>
    </q-scroll-area>
  </q-drawer>
</template>

<style lang="scss">
.tool-item {
  cursor: grab;
}

.tool-title {
  line-height: 1rem;
}

.tool-description {
  line-height: 1rem;
}

.tool-item:active {
  cursor: grabbing;
  opacity: 0.4;
}
</style>
