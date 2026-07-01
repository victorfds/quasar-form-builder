import type { FormSettingsType } from '#qfb/types'
import { computed, useState } from '#imports'
import { useThemeMode } from '#qfb/composables/useThemeMode'
import { useFormHistoryStore } from '#qfb/stores/formHistoryStore'
import { useFormStore } from '#qfb/stores/formStore'

export function useQfbBuilderControls() {
  const formStore = useFormStore()
  const formHistoryStore = useFormHistoryStore()
  const themeMode = useThemeMode()

  const isElementsDrawerOpened = useState<boolean>('qfb-elements-drawer', () => false)
  const isPropertiesDrawerOpened = useState<boolean>('form-settings-drawer', () => false)
  const offsetPage = useState<number>('offset', () => 168)

  const previewMode = computed(() => formStore.formSettings.previewMode)
  const formFields = computed(() => formStore.formFields)
  const activeField = computed(() => formStore.activeField)
  const activeStepConfig = computed(() => formStore.activeStepConfig)
  const activeTabConfig = computed(() => formStore.activeTabConfig)
  const canUndo = computed(() => !formHistoryStore.isBackDisabled())
  const canRedo = computed(() => !formHistoryStore.isForwardDisabled())

  function toggleLeftDrawer(force?: boolean) {
    isElementsDrawerOpened.value = typeof force === 'boolean' ? force : !isElementsDrawerOpened.value
  }

  function toggleRightDrawer(force?: boolean) {
    isPropertiesDrawerOpened.value = typeof force === 'boolean' ? force : !isPropertiesDrawerOpened.value
  }

  function setPageOffset(offset: number) {
    offsetPage.value = offset
  }

  function getPageStyle(offset: number) {
    setPageOffset(offset)
    return { minHeight: offset ? `calc(100vh - ${offset}px)` : '100vh' }
  }

  function updatePreviewMode(mode: string | null) {
    if (mode !== 'editing' && mode !== 'previewing') return
    formStore.changePreviewMode(mode as FormSettingsType['previewMode'])
  }

  function undo() {
    const lastHistory = formHistoryStore.goBack()
    if (lastHistory) {
      formStore.setFormFields(JSON.parse(lastHistory))
    }
  }

  function redo() {
    const forwardHistory = formHistoryStore.goForward()
    if (forwardHistory) {
      formStore.setFormFields(JSON.parse(forwardHistory))
    }
  }

  function clearForm() {
    formStore.setFormFields([])
    formStore.setActiveField(null)
    formStore.setActiveStepConfig(null)
    formStore.setActiveTabConfig(null)
  }

  return {
    formStore,
    formHistoryStore,
    formFields,
    activeField,
    activeStepConfig,
    activeTabConfig,
    previewMode,
    canUndo,
    canRedo,
    offsetPage,
    isElementsDrawerOpened,
    isPropertiesDrawerOpened,
    ...themeMode,
    toggleLeftDrawer,
    toggleRightDrawer,
    setPageOffset,
    getPageStyle,
    updatePreviewMode,
    undo,
    redo,
    clearForm,
  }
}
