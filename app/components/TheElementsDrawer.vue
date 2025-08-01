<script setup lang="ts">
import type { FormKitSchemaDefinition } from "@formkit/core"
import type { UnwrapRef } from "vue"

const model = defineModel<boolean>()
const { dark } = useQuasar()
const tools = ref<
  {
    name: string
    icon: string
    title: string
    description: string
    schema: FormKitSchemaDefinition
  }[]
>([
  {
    name: "text",
    icon: "text_format",
    title: "Entrada de texto",
    description: "Texto de uma única linha",
    schema: {
      $formkit: "q-input",
      name: "text",
      label: "Texto",
      inputType: "text",
    },
  },
  {
    name: "number",
    icon: "123",
    title: "Entrada numérica",
    description: "Digite apenas de números",
    schema: {
      $formkit: "q-input",
      name: "number",
      label: "Número",
      inputType: "number",
      validation: "number",
    },
  },
  {
    name: "email",
    icon: "alternate_email",
    title: "Endereço de email",
    description: "Entrada de texto que espera um email",
    schema: {
      $formkit: "q-input",
      name: "email",
      label: "Email",
      inputType: "email",
      validation: "email",
    },
  },
  {
    name: "phone",
    icon: "phone",
    title: "Número de telefone",
    description: "Número de telefone com máscara",
    schema: {
      $formkit: "q-input",
      name: "phone",
      label: "Telefone",
      mask: "(##) #####-####",
      "unmasked-value": true,
      inputType: "text",
    },
  },
  {
    name: "textarea",
    icon: "wrap_text",
    title: "Área de texto",
    description: "Única linha ou multilinhas",
    schema: {
      $formkit: "q-input",
      name: "textarea",
      label: "Área de texto",
      inputType: "textarea",
    },
  },
  {
    name: "checkbox",
    icon: "check_box",
    title: "Caixa de seleção",
    description: "Entrada de simples marcação",
    schema: {
      $formkit: "q-checkbox",
      name: "checkbox",
      label: "Caixa de seleção",
    },
  },
  {
    name: "select",
    icon: "arrow_drop_down",
    title: "Selecionar",
    description: "Uma única escolha",
    schema: {
      $formkit: "q-select",
      name: "select",
      label: "Selecione",
    },
  },
  {
    name: "date",
    icon: "event",
    title: "Data",
    description: "Entrada para seleção de data",
    schema: {
      $formkit: "q-date",
      name: "date",
      label: "Data",
    },
  },
  {
    name: "file_upload",
    icon: "insert_drive_file",
    title: "Enviar arquivo",
    description: "Entrada para envio de arquivo",
    schema: {
      $formkit: "q-input",
      name: "file",
      label: "",
      inputType: "file",
    },
  },
  {
    name: "multifile_upload",
    icon: "file_copy",
    title: "Enviar arquivos",
    description: "Entrada para envio de arquivos",
    schema: {
      $formkit: "q-input",
      name: "multifile",
      multiple: true,
      label: "",
      inputType: "file",
    },
  },
])
const statics = ref<
  {
    name: string
    icon: string
    title: string
    description: string
    schema: FormKitSchemaDefinition
  }[]
>([
  {
    name: "button",
    icon: "check",
    title: "Botão de submissão",
    description: "Botão que conclui o formulário",
    schema: {
      $formkit: "q-btn",
      name: "submit",
      buttonLabel: "Finalizar",
      bind: "$submitAttrs",
      ignore: true,
      type: "submit",
      disabled: "$disabled",
    },
  },
  {
    name: "button",
    icon: "star",
    title: "Botão primário",
    description: "Botão de cor primária",
    schema: {
      $formkit: "q-btn",
      name: "primaryButton",
      buttonLabel: "Botão",
      color: "primary",
      ignore: true,
      type: "submit",
      disabled: "$disabled",
    },
  },
  {
    name: "button",
    icon: "add",
    title: "Botão secundário",
    description: "Botão de cor secundária",
    schema: {
      $formkit: "q-btn",
      name: "secondaryButton",
      buttonLabel: "Botão",
      color: "secondary",
      ignore: true,
      type: "submit",
      disabled: "$disabled",
    },
  },
  {
    name: "button",
    icon: "warning",
    title: "Botão risco",
    description: "Botão de cor negativa",
    schema: {
      $formkit: "q-btn",
      name: "dangerButton",
      buttonLabel: "Botão",
      color: "negative",
      ignore: true,
      type: "submit",
      disabled: "$disabled",
    },
  },
  {
    name: "separator",
    icon: "horizontal_rule",
    title: "Separador",
    description: "Linha horizontal divisória",
    schema: {
      $el: "hr",
      name: "separator",
      attrs: {
        class: "q-my-sm",
        style:
          "border: none height: 1px color: #aaa background-color: #aaa",
      },
    },
  },
  {
    name: "h1",
    icon: "sym_o_format_h1",
    title: "Cabeçalho H1",
    description: "Elemento HTML <H1>",
    schema: {
      $el: "h1",
      name: "h1",
      children: "Lorem ipsum dolor",
      attrs: { class: "no-margin" },
    },
  },
  {
    name: "h2",
    icon: "sym_o_format_h2",
    title: "Cabeçalho H2",
    description: "Elemento HTML <H2>",
    schema: {
      $el: "h2",
      name: "h2",
      children: "Lorem ipsum dolor",
      attrs: { class: "no-margin" },
    },
  },
  {
    name: "h3",
    icon: "sym_o_format_h3",
    title: "Cabeçalho H3",
    description: "Elemento HTML <H3>",
    schema: {
      $el: "h3",
      name: "h3",
      children: "Lorem ipsum dolor",
      attrs: { class: "no-margin" },
    },
  },
  {
    name: "h4",
    icon: "sym_o_format_h4",
    title: "Cabeçalho H4",
    description: "Elemento HTML <H4>",
    schema: {
      $el: "h4",
      name: "h4",
      children: "Lorem ipsum dolor",
      attrs: { class: "no-margin" },
    },
  },
  {
    name: "paragraph",
    icon: "sym_o_format_paragraph",
    title: "Parágrafo",
    description: "Elemento HTML <p>",
    schema: {
      $el: "p",
      name: "p",
      children: "Lorem ipsum dolor",
      attrs: { class: "no-margin" },
    },
  },
  {
    name: "blockquote",
    icon: "format_quote",
    title: "Citação em bloco",
    description: "Elemento HTML <quote>",
    schema: {
      $el: "blockquote",
      name: "blockquote",
      children: "Lorem ipsum dolor",
      attrs: { class: "text-grey" },
    },
  },
])

const tab = ref("elements")
const elementsTypes = ref("fields")

function onDragStart(ev: DragEvent, tool: UnwrapRef<FormKitSchemaDefinition>) {
  // Add this element's id to the drag payload so the drop handler will
  // know which element to add to its tree
  ev.dataTransfer?.setData("text", JSON.stringify(tool))
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
                @dragstart="(event) => onDragStart(event, tool.schema)">
                <div class="row items-start no-wrap q-mb-lg">
                  <q-avatar rounded size="md" font-size="1.3rem" :color="dark.isActive ? 'grey-9' : 'blue-grey-2'"
                    :text-color="dark.isActive ? 'grey-5' : 'blue-grey-8'" :icon="tool.icon" />
                  <div class="q-ml-sm">
                    <div class="tool-title text-weight-semibold text-subtitle2" :class="dark.isActive ? 'text-grey-11' : 'text-blue-grey-10'
                      ">
                      {{ tool.title }}
                    </div>
                    <div class="tool-description text-caption" :class="dark.isActive ? 'text-grey-7 ' : 'text-blue-grey-7'
                      ">
                      {{ tool.description }}
                    </div>
                  </div>
                </div>
              </div>
            </q-tab-panel>

            <q-tab-panel name="statics" class="no-padding q-mt-lg">
              <div v-for="tool in statics" :key="tool.name" class="tool-item" draggable="true"
                @dragstart="(event) => onDragStart(event, tool.schema)">
                <div class="row items-start no-wrap q-mb-lg">
                  <q-avatar rounded size="md" font-size="1.3rem" :color="dark.isActive ? 'grey-9' : 'blue-grey-2'"
                    :text-color="dark.isActive ? 'grey-5' : 'blue-grey-8'" :icon="tool.icon" />
                  <div class="q-ml-sm">
                    <div class="tool-title text-weight-semibold text-subtitle2" :class="dark.isActive ? 'text-grey-11' : 'text-blue-grey-10'
                      ">
                      {{ tool.title }}
                    </div>
                    <div class="tool-description text-caption" :class="dark.isActive ? 'text-grey-7 ' : 'text-blue-grey-7'
                      ">
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
