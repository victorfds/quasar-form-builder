<template>
  <q-input v-if="elem.type === 'text' && !elem.inputType" :label="elem.label" />
  <q-input v-if="elem.type === 'text' && elem.inputType === 'number'" type="number" :label="elem.label" />
  <q-input v-if="elem.type === 'text' && elem.inputType === 'email'" type="email" :label="elem.label" />
  <q-input v-if="elem.type === 'phone'" type="tel" :label="elem.label" />
  <q-input v-if="elem.type === 'text' && elem.inputType === 'password'" type="password" :label="elem.label" />
  <q-input v-if="elem.type === 'text' && elem.inputType === 'url'" type="url" :label="elem.label" />
  <q-input v-if="elem.type === 'location'" :label="elem.label" />
  <q-input v-if="elem.type === 'textarea'" type="textarea" :label="elem.label" />
  <q-editor v-if="elem.type === 'editor'" :label="elem.label" />
  <q-checkbox v-if="elem.type === 'checkbox'" :label="elem.text" />
  <q-checkbox v-if="elem.type === 'checkboxgroup'" v-for="item in elem.items" :key="item.value" :label="item.label" />
  <q-checkbox v-if="elem.type === 'checkboxgroup' && elem.view === 'blocks'" v-for="item in elem.items"
    :key="item.value" :label="item.label" :description="item.description" />
  <q-checkbox v-if="elem.type === 'checkboxgroup' && elem.view === 'tabs'" v-for="item in elem.items" :key="item.value"
    :label="item.label" :description="item.description" />
  <q-radio v-if="elem.type === 'radio'" :label="elem.text" />
  <q-radio v-if="elem.type === 'radiogroup'" v-for="item in elem.items" :key="item.value" :label="item.label" />
  <q-radio v-if="elem.type === 'radiogroup' && elem.view === 'blocks'" v-for="item in elem.items" :key="item.value"
    :label="item.label" :description="item.description" />
  <q-radio v-if="elem.type === 'radiogroup' && elem.view === 'tabs'" v-for="item in elem.items" :key="item.value"
    :label="item.label" :description="item.description" />
  <q-toggle v-if="elem.type === 'toggle'" :label="elem.text" />
  <q-select v-if="elem.type === 'select'" :label="elem.label" :options="elem.items" :filterable="elem.search" />
  <q-select v-if="elem.type === 'multiselect'" :label="elem.label" :options="elem.items" multiple
    :filterable="elem.search" />
  <q-chip v-if="elem.type === 'tags'" :label="elem.label" :options="elem.items" />
  <q-date v-if="elem.type === 'date'" :label="elem.label" />
  <q-date v-if="elem.type === 'datetime'" :label="elem.label" />
  <q-time v-if="elem.type === 'time'" :label="elem.label" />
  <q-date v-if="elem.type === 'dates'" :label="elem.label" range />
  <q-slider v-if="elem.type === 'slider'" :label="elem.label" :value="30" />
  <q-range v-if="elem.type === 'rangeSlider'" :label="elem.label" :min="30" :max="70" />
  <q-slider v-if="elem.type === 'verticalSlider'" vertical />
  <q-file v-if="elem.type === 'file'" :label="elem.label" />
  <q-file v-if="elem.type === 'multifile'" multiple :label="elem.label" />
  <q-img v-if="elem.type === 'image'" :label="elem.label" accept="image/*" />
  <q-img v-if="elem.type === 'multiImage'" multiple :label="elem.label" accept="image/*" />
  <q-img v-if="elem.type === 'gallery'" multiple :label="elem.label" accept="image/*" />
  <input v-if="elem.type === 'hidden'" type="hidden" :value="elem.default" />
</template>
<script setup lang="ts">
import type { ElementType } from "~/types";

defineProps<{
  elem: ElementType
}>()

</script>
