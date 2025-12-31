<script setup lang="ts">
const formFields = [
  {
    "$el": "h4",
    "name": "h4",
    "children": "Lorem ipsum dolor",
    "attrs": { "class": "no-margin" }
  },
  {
    "$el": "h4",
    "name": "h4",
    "children": "It's not good at thing",
    "attrs": {
      "class": "no-margin"
    },
    "label": "um texto",
    "info": "texto auxiliar",
    "description": "minha pergunta composta"
  },
  {
    "$el": "hr",
    "name": "separator",
    "attrs": {
      "class": "q-my-sm",
      "style": "border: none; height: 1px; color: #aaa; background-color: #aaa;"
    }
  },
  {
    "$formkit": "q-input",
    "name": "text",
    "label": "Texto",
    "inputType": "text"
  },
  {
    "$formkit": "q-input",
    "name": "number",
    "label": "Número",
    "inputType": "number",
    "validation": "number"
  },
  {
    "$formkit": "q-input",
    "name": "phone",
    "label": "Telefone",
    "mask": "(##) #####-####",
    "unmasked-value": true,
    "inputType": "text"
  },
  {
    "$el": "p",
    "name": "p",
    "children": "Lorem ipsum dolor",
    "attrs": { "class": "no-margin" }
  },
  {
    "$formkit": "q-select",
    "name": "select",
    "label": "Selecione",
    "options": [
      { "label": "Valor 1", "value": "1" },
      { "label": "Valor 2", "value": "2" }
    ]
  },
  { "$formkit": "q-checkbox", "name": "checkbox", "label": "Caixa de seleção" },
  {
    "$formkit": "q-btn",
    "name": "dangerButton",
    "buttonLabel": "Botão",
    "color": "negative",
    "ignore": true,
    "type": "reset",
    "disabled": "$disabled",
    "align": "right"
  },
  {
    "$formkit": "q-btn",
    "name": "submit",
    "buttonLabel": "Finalizar",
    "bind": "$submitAttrs",
    "ignore": true,
    "type": "submit",
    "disabled": "$disabled"
  }
]

const formValues = ref({})

watch(formValues, (data) => {
  onUpdateValues(data)
}, { deep: true })

function onUpdateValues(data: any) {
  console.log(data)
}

function onSubmit(data: any) {
  console.log(data)
}
</script>

<template>
  <FormViewer v-model="formValues" :formFields="formFields" @submit="onSubmit" />
</template>
