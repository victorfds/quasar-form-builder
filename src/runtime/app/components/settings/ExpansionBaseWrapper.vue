<script setup lang="ts">
import { useQuasar } from 'quasar'
import { computed, onMounted, ref, useSlots } from 'vue'
import { useFormStore } from '#qfb/stores/formStore'
import { getBrowserJsonItem, setBrowserStorageItem } from '#qfb/utils/browserStorage'

type SectionKey = 'properties' | 'decorators' | 'layout' | 'conditions' | 'attributes' | 'validation' | 'data' | 'options'

defineProps<{
  sectionLabels?: Partial<Record<SectionKey, string>>
}>()

const { dark } = useQuasar()
const formStore = useFormStore()
const { setActiveField, copyField, removeField } = formStore
const slots = useSlots()

const elementClosedStorageKey = 'element-closed'

// Allowed options
const sections: Record<SectionKey, string> = {
  properties: 'Propriedades',
  decorators: 'Decorações',
  layout: 'Disposição',
  conditions: 'Condições',
  attributes: 'Atributos',
  validation: 'Validação',
  data: 'Dados',
  options: 'Opções',
}

const sectionOrder: SectionKey[] = ['properties', 'decorators', 'data', 'options', 'layout', 'validation', 'conditions', 'attributes']

const label = ref('')
const closedElements = ref<string[]>([])
const allExpanded = ref(true)
const expansionState = ref<Record<string, boolean>>({})

// Dynamically get the available slots
const availableSlots = computed(() => sectionOrder.filter(slotKey => Boolean(slots[slotKey])))

availableSlots.value.forEach((slotKey) => {
  expansionState.value[slotKey] = !closedElements.value.includes(slotKey)
})

function readClosedElements() {
  return getBrowserJsonItem<string[]>(elementClosedStorageKey, []).filter(Boolean)
}

function writeClosedElements(value: string[]) {
  closedElements.value = value
  setBrowserStorageItem(elementClosedStorageKey, JSON.stringify(value))
}

function syncExpansionState() {
  closedElements.value = readClosedElements()
  allExpanded.value = !closedElements.value.length
  expansionState.value = availableSlots.value.reduce((acc, slotKey) => {
    acc[slotKey] = !closedElements.value.includes(slotKey)
    return acc
  }, {} as Record<string, boolean>)
}

function cachingDefaultClosed(slotKey: keyof typeof slots, isOpen: boolean) {
  const elementClosed = readClosedElements()
  if (!slotKey || !Array.isArray(elementClosed))
    return

  if (!isOpen) {
    allExpanded.value = false
    // Only push to `elementClosed` if it's not already present
    if (!elementClosed.includes(slotKey)) {
      elementClosed.push(slotKey)
      writeClosedElements(elementClosed)
    }
  }
  else if (isOpen) {
    const indexOf = elementClosed.findIndex(el => el === slotKey)
    if (indexOf !== -1) {
      elementClosed.splice(indexOf, 1)
      writeClosedElements(elementClosed)
    }
  }

  expansionState.value[slotKey] = isOpen
  if (Object.values(expansionState.value).every(Boolean)) {
    allExpanded.value = true
  }
}

function toggleExpandAll() {
  allExpanded.value = !allExpanded.value

  let elementClosed = readClosedElements()

  if (allExpanded.value) {
    // Expand all
    expansionState.value = availableSlots.value.reduce((acc, slotKey) => {
      acc[slotKey] = true
      return acc
    }, {} as Record<string, boolean>)
    elementClosed = []
  }
  else {
    // Collapse all
    expansionState.value = availableSlots.value.reduce((acc, slotKey) => {
      acc[slotKey] = false
      return acc
    }, {} as Record<string, boolean>)
    elementClosed = availableSlots.value
  }

  writeClosedElements(elementClosed)
}

onMounted(syncExpansionState)
</script>

<template>
  <q-list separator style="max-width: 340px;">
    <q-item :class="{ 'bg-grey-9 text-grey-11': dark.isActive, 'bg-blue-grey-1 text-blue-grey-10': !dark.isActive }">
      <q-item-section avatar>
        <q-btn
          size="sm" flat dense round icon="close" :color="dark.isActive ? 'grey-5' : 'blue-grey-8'"
          @click="setActiveField(null)"
        />
      </q-item-section>

      <q-item-section>
        <q-item-label>
          <h6 class="break-all text-h6 no-margin">
            {{ formStore.activeField?.name }}
          </h6>
        </q-item-label>
      </q-item-section>

      <q-item-section side>
        <div class="q-gutter-xs">
          <q-btn
            size="sm" flat dense round icon="o_content_copy" :color="dark.isActive ? 'grey-5' : 'blue-grey-8'"
            @click="copyField(null, formStore.activeField)"
          />
          <q-btn
            size="sm" flat dense round icon="o_delete" :color="dark.isActive ? 'grey-5' : 'blue-grey-8'"
            @click="removeField(formStore.activeField)"
          />
          <q-btn
            size="sm" flat dense round :icon="allExpanded ? 'minimize' : 'o_expand'"
            :color="dark.isActive ? 'grey-5' : 'blue-grey-8'" @click="toggleExpandAll"
          />
        </div>
      </q-item-section>
    </q-item>
    <ClientOnly>
      <q-expansion-item
        v-for="slotKey in availableSlots" :key="slotKey" :model-value="expansionState[slotKey]"
        :header-class="{ 'text-weight-semibold text-subtitle2': true, 'bg-grey-9 text-grey-11': dark.isActive, 'bg-blue-grey-1 text-blue-grey-10': !dark.isActive }"
        :expand-icon-class="dark.isActive ? 'text-grey-5' : 'text-blue-grey-8'"
        :label="sectionLabels?.[slotKey] || sections[slotKey]"
        :default-opened="allExpanded ? true : !closedElements.includes(slotKey)"
        @update:model-value="val => cachingDefaultClosed(slotKey, val)"
      >
        <slot :name="slotKey" :foo="(newLabel: string) => { label = newLabel }" />
      </q-expansion-item>
    </ClientOnly>
  </q-list>
</template>
