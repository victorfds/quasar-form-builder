<script setup lang="ts">
defineOptions({
  inheritAttrs: false
})
const { dark, localStorage } = useQuasar()
const slots = useSlots()

// ["properties","decorators","layout","conditions","attributes","validation","data","options"]
const elementClosed = localStorage.getItem('element-closed')
// ["properties","submission","validation","layout"]
const formClosed = localStorage.getItem('form-closed')

const sections: Record<string, string> = {
  properties: 'Propriedades',
  decorators: 'Decorações',
  layout: 'Disposição',
  conditions: 'Condições',
  attributes: 'Atributos',
  validation: 'Validação',
  data: 'Dados',
  options: 'Opções'
}

const label = computed(() => {
  const availableSlots = Object.keys(sections).filter((key) => slots[key])
  return availableSlots.length ? sections[availableSlots[0]!] : ''
})
</script>
<template>
  <ClientOnly>
    <q-expansion-item
      :header-class="{ 'text-weight-semibold text-subtitle2': true, 'bg-grey-9 text-grey-11': dark.isActive, 'bg-blue-grey-1 text-blue-grey-10': !dark.isActive }"
      :expand-icon-class="dark.isActive ? 'text-grey-5' : 'text-blue-grey-8'" v-bind="$attrs" :label="label"
      default-opened>
      <template #default>
        <slot name="properties" />
        <slot name="decorators" />
      </template>
    </q-expansion-item>
  </ClientOnly>
</template>
