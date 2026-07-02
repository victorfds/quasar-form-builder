import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useMemory } from '#qfb/composables/useMemory'
import { getBrowserStorageItem } from '#qfb/utils/browserStorage'
import { getFormBuilderStorageConfig } from '#qfb/utils/storageConfig'

export const useFormHistoryStore = defineStore('formHistoryStore', () => {
  const pointer = ref(0)
  const { formFieldsKey } = getFormBuilderStorageConfig()

  const memory = useMemory()

  function addToMemory(value: any) {
    const size = memory.getSize()

    if (size === 0) {
      const cachedFormFields = getBrowserStorageItem(formFieldsKey)

      memory.setItem(size, cachedFormFields || JSON.stringify([]))
      memory.setItem(size + 1, JSON.stringify(value))
      pointer.value = size + 1
      return
    }

    memory.setItem(size, JSON.stringify(value))
    pointer.value = size
  }

  function goBack() {
    if (pointer.value > 0) {
      pointer.value -= 1
    }

    if (memory.hasItem(pointer.value)) {
      return memory.getItem(pointer.value)
    }

    return null
  }

  function goForward() {
    const size = memory.getSize()
    if (pointer.value < size) {
      pointer.value += 1
      return memory.getItem(pointer.value)
    }

    return null
  }

  function isBackDisabled() {
    return pointer.value < 1
  }

  function isForwardDisabled() {
    const size = memory.getSize()
    return pointer.value >= size - 1
  }

  return {
    addToMemory,
    goBack,
    goForward,
    isBackDisabled,
    isForwardDisabled,
  }
})
