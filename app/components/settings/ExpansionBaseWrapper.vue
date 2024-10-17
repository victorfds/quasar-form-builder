<script setup lang="ts">
const props = defineProps<{ label?: string }>()
defineOptions({
  inheritAttrs: false
});

const { dark, localStorage } = useQuasar()
const slots = useSlots()
const slotsKeys = Object.keys(slots)

// Retrieve and parse the localStorage item, and handle cases where it might be `null`
// This variable is initialized only once
const elementClosed: string[] = JSON.parse(localStorage.getItem('element-closed') || '[]')
const isDefaultOpened = !!slotsKeys.length && !elementClosed.includes(slotsKeys.at(0) ?? '')

// Define your sections
const sections: Record<string, string> = {
  properties: 'Propriedades',
  decorators: 'Decorações',
  layout: 'Disposição',
  conditions: 'Condições',
  attributes: 'Atributos',
  validation: 'Validação',
  data: 'Dados',
  options: 'Opções',
}

// Compute the default label based on the available slots and sections
const defaultLabel = computed(() => {
  if (props.label) return props.label
  const availableSlots = Object.keys(sections).filter((key) => slots[key])
  return availableSlots.length ? sections[availableSlots[0]!] : ''
})

function cachingDefaultClosed(isOpen: boolean) {
  const elementClosed: string[] = JSON.parse(localStorage.getItem('element-closed') || '[]');
  if (!slotsKeys.length || !Array.isArray(elementClosed)) return

  const slotKey = slotsKeys.at(0) ?? ''

  if (!isOpen && slotKey) {
    // Only push to `elementClosed` if it's not already present
    if (!elementClosed.includes(slotKey)) {
      elementClosed.push(slotKey)
      localStorage.setItem('element-closed', JSON.stringify(elementClosed))
    }
  } else if (isOpen && slotKey) {
    const indexOf = elementClosed.findIndex(el => el === slotKey)
    if (indexOf !== -1) {
      elementClosed.splice(indexOf, 1)
      localStorage.setItem('element-closed', JSON.stringify(elementClosed))
    }
  }
}
</script>

<template>
  <ClientOnly>
    <q-expansion-item
      :header-class="{ 'text-weight-semibold text-subtitle2': true, 'bg-grey-9 text-grey-11': dark.isActive, 'bg-blue-grey-1 text-blue-grey-10': !dark.isActive }"
      :expand-icon-class="dark.isActive ? 'text-grey-5' : 'text-blue-grey-8'" :label="defaultLabel" v-bind="$attrs"
      :default-opened="isDefaultOpened" @update:model-value="cachingDefaultClosed">
      <template #default>
        <slot name="properties" />
        <slot name="decorators" />
        <slot name="layout" />
        <slot name="conditions" />
        <slot name="attributes" />
        <slot name="validation" />
        <slot name="data" />
        <slot name="options" />
      </template>
    </q-expansion-item>
  </ClientOnly>
</template>
