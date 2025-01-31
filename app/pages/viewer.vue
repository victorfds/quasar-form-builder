<script setup lang="ts">
const formFields = [{
  "$el": "h4",
  "name": "h4",
  "children": "Digite aqui um texto"
},
{
  "$formkit": "q-input",
  "name": "text",
  "label": "Texto",
  "inputType": "text"
},
{
  "$formkit": "q-separator",
  "name": "separator"
},
{
  "$el": "p",
  "name": "p",
  "children": "Lorem ipsum dolor2"
},
{
  "$formkit": "q-input",
  "name": "number",
  "label": "Número",
  "inputType": "number",
  "validation": "number",
  "if": "$empty($text)"
},
]

function onSubmit(data: any) {
  data
}
</script>

<template>
  <FormViewer :formFields="formFields" :data="data" @submit="onSubmit" />
</template>
