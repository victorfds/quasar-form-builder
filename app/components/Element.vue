<script setup lang="ts">
import type { ElementType } from '~/types'

defineProps<{
  elem: ElementType
}>()
</script>

<template>
  <q-input v-if="elem.type === 'text' && !elem.inputType" outlined :label="elem.label" />
  <q-input v-if="elem.type === 'text' && elem.inputType === 'number'" type="number" outlined :label="elem.label" />
  <q-input v-if="elem.type === 'text' && elem.inputType === 'email'" type="email" outlined :label="elem.label" />
  <q-input v-if="elem.type === 'phone'" type="tel" outlined :label="elem.label" />
  <q-input v-if="elem.type === 'text' && elem.inputType === 'password'" type="password" outlined :label="elem.label" />
  <q-input v-if="elem.type === 'text' && elem.inputType === 'url'" type="url" outlined :label="elem.label" />
  <q-input v-if="elem.type === 'location'" outlined :label="elem.label" />
  <q-input v-if="elem.type === 'textarea'" type="textarea" outlined :label="elem.label" />
  <q-editor v-if="elem.type === 'editor'" :label="elem.label" />
  <q-checkbox v-if="elem.type === 'checkbox'" :label="elem.text" />
  <div v-if="elem.type === 'checkboxgroup'">
    <q-checkbox v-for="item in elem.items" :key="item.value" :label="item.label" />
  </div>
  <div v-if="elem.type === 'checkboxgroup' && elem.view === 'blocks'">
    <q-checkbox v-for="item in elem.items" :key="item.value" :label="item.label" :description="item.description" />
  </div>
  <div v-if="elem.type === 'checkboxgroup' && elem.view === 'tabs'">
    <q-checkbox v-for="item in elem.items" :key="item.value" :label="item.label" :description="item.description" />
  </div>
  <q-radio v-if="elem.type === 'radio'" :label="elem.text" />
  <div v-if="elem.type === 'radiogroup'">
    <q-radio v-for="item in elem.items" :key="item.value" :label="item.label" />
  </div>
  <div v-if="elem.type === 'radiogroup' && elem.view === 'blocks'">
    <q-radio v-for="item in elem.items" :key="item.value" :label="item.label" :description="item.description" />
  </div>
  <div v-if="elem.type === 'radiogroup' && elem.view === 'tabs'">
    <q-radio v-for="item in elem.items" :key="item.value" :label="item.label" :description="item.description" />
  </div>
  <q-toggle v-if="elem.type === 'toggle'" :label="elem.text" />
  <q-select v-if="elem.type === 'select'" :label="elem.label" :options="elem.items" :filterable="elem.search" />
  <q-select
    v-if="elem.type === 'multiselect'" :label="elem.label" :options="elem.items" multiple
    :filterable="elem.search"
  />
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
  <input v-if="elem.type === 'hidden'" type="hidden" :value="elem.default">
</template>
