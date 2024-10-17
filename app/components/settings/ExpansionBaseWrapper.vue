<script setup lang="ts">
const slots = defineSlots<{
  properties: string;
  decorators: string;
  layout: string;
  conditions: string;
  attributes: string;
  validation: string;
  data: string;
  options: string;
}>()

const { dark, localStorage } = useQuasar()
const formStore = useFormStore()
const { setActiveField, copyField, removeField } = formStore

const elementsClosed = localStorage.getItem('elements-closed')

// const slots = useSlots()
const slotsKeys = Object.keys(slots)

// Retrieve and parse the localStorage item, and handle cases where it might be `null`
// This variable is initialized only once
const elementClosed: string[] = JSON.parse(localStorage.getItem('element-closed') || '[]')

// Allowed options 
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

const label = ref('')
const allExpanded = ref(!elementClosed.length || false)
const expansionState = ref<Record<string, boolean>>({})

// Compute the default label based on the available slots and sections
const defaultLabel = computed(() => {
  if (label.value) return label.value
  const availableSlots = Object.keys(sections).filter((key) => slots[key])
  return availableSlots.length ? sections[availableSlots[0]!] : ''
})

// Dynamically get the available slots
const availableSlots = computed(() => Object.keys(slots) as (keyof typeof slots)[])

availableSlots.value.forEach(slotKey => {
  expansionState.value[slotKey] = !elementClosed.includes(slotKey)
})

function cachingDefaultClosed(slotKey: keyof typeof slots, isOpen: boolean) {
  const elementClosed: string[] = JSON.parse(localStorage.getItem('element-closed') || '[]');
  if (!slotKey || !Array.isArray(elementClosed)) return

  if (!isOpen) {
    allExpanded.value = false
    // Only push to `elementClosed` if it's not already present
    if (!elementClosed.includes(slotKey)) {
      elementClosed.push(slotKey)
      localStorage.setItem('element-closed', JSON.stringify(elementClosed))
    }
  } else if (isOpen) {
    const indexOf = elementClosed.findIndex(el => el === slotKey)
    if (indexOf !== -1) {
      elementClosed.splice(indexOf, 1)
      localStorage.setItem('element-closed', JSON.stringify(elementClosed))
    }
  }

  expansionState.value[slotKey] = isOpen
  if (Object.values(expansionState.value).every(Boolean)) {
    allExpanded.value = true
  }

}

function toggleExpandAll() {
  allExpanded.value = !allExpanded.value

  let elementClosed = JSON.parse(localStorage.getItem('element-closed') || '[]')

  if (allExpanded.value) {
    // Expand all
    expansionState.value = availableSlots.value.reduce((acc, slotKey) => {
      acc[slotKey] = true
      return acc
    }, {} as Record<string, boolean>)
    elementClosed = []
  } else {
    // Collapse all
    expansionState.value = availableSlots.value.reduce((acc, slotKey) => {
      acc[slotKey] = false
      return acc
    }, {} as Record<string, boolean>)
    elementClosed = availableSlots.value
  }

  localStorage.setItem('element-closed', JSON.stringify(elementClosed))
}
</script>

<template>
  <q-list separator>
    <q-item :class="{ 'bg-grey-9 text-grey-11': dark.isActive, 'bg-blue-grey-1 text-blue-grey-10': !dark.isActive }">
      <q-item-section avatar>
        <q-btn size="sm" flat dense round icon="close" :color="dark.isActive ? 'grey-5' : 'blue-grey-8'"
          @click="setActiveField(null)" />
      </q-item-section>

      <q-item-section>
        <q-item-label>
          <h6 class="text-h6 no-margin">
            {{ formStore.activeField?.name }}
          </h6>
        </q-item-label>
      </q-item-section>

      <q-item-section side>
        <div class="q-gutter-xs">
          <q-btn size="sm" flat dense round icon="o_content_copy" :color="dark.isActive ? 'grey-5' : 'blue-grey-8'"
            @click="copyField(formStore.activeField)" />
          <q-btn size="sm" flat dense round icon="o_delete" :color="dark.isActive ? 'grey-5' : 'blue-grey-8'"
            @click="removeField(formStore.activeField)" />
          <q-btn size="sm" flat dense round :icon="allExpanded ? 'minimize' : 'o_expand'"
            :color="dark.isActive ? 'grey-5' : 'blue-grey-8'" @click="toggleExpandAll" />
        </div>
      </q-item-section>
    </q-item>
    <ClientOnly>
      <q-expansion-item :model-value="expansionState[slotKey]"
        :header-class="{ 'text-weight-semibold text-subtitle2': true, 'bg-grey-9 text-grey-11': dark.isActive, 'bg-blue-grey-1 text-blue-grey-10': !dark.isActive }"
        :expand-icon-class="dark.isActive ? 'text-grey-5' : 'text-blue-grey-8'" :label="label || sections[slotKey]"
        :default-opened="allExpanded ? true : !elementClosed.includes(slotKey)"
        @update:model-value="val => cachingDefaultClosed(slotKey, val)" v-for="slotKey in availableSlots"
        :key="slotKey">
        <slot :name="slotKey" :foo="(newLabel: string) => { label = newLabel }" />
      </q-expansion-item>
    </ClientOnly>
  </q-list>
</template>
