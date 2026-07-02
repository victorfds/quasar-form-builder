<script setup lang="ts">
import type { FormBuilderAppConfig, FormBuilderShellUiConfig } from '#qfb/types'
import { computed } from 'vue'
import { useAppConfig } from '#imports'
import { useQfbBuilderControls } from '#qfb/composables/useQfbBuilderControls'

interface BuilderShellProps {
  title?: string
  showHeader?: boolean
  showThemeToggle?: boolean
  showFloatingControls?: boolean
  showLeftDrawer?: boolean
  showRightDrawer?: boolean
  ui?: FormBuilderShellUiConfig
}

const props = withDefaults(defineProps<BuilderShellProps>(), {
  title: undefined,
  showHeader: undefined,
  showThemeToggle: undefined,
  showFloatingControls: undefined,
  showLeftDrawer: undefined,
  showRightDrawer: undefined,
  ui: undefined,
})

const appConfig = useAppConfig() as { formBuilder?: FormBuilderAppConfig }
const controls = useQfbBuilderControls()
const formStore = controls.formStore
const formHistoryStore = controls.formHistoryStore
const isDark = controls.isDark

const builderConfig = computed<FormBuilderAppConfig>(() => appConfig.formBuilder || {})

const defaultLabels = {
  edit: 'Editar',
  preview: 'Pré-visualizar',
  undo: 'Retroceder',
  redo: 'Avançar',
  openLeftDrawer: 'Abrir painel lateral',
  closeLeftDrawer: 'Fechar painel lateral',
  openRightDrawer: 'Abrir painel lateral',
  closeRightDrawer: 'Fechar painel lateral',
  clearForm: 'Limpar formulário',
}

function resolveBoolean(propValue: boolean | undefined, configValue: boolean | undefined, defaultValue: boolean) {
  return propValue ?? configValue ?? defaultValue
}

function getUiClass(key: keyof FormBuilderShellUiConfig) {
  return props.ui?.[key] ?? builderConfig.value.ui?.[key]
}

function getLabel(key: keyof typeof defaultLabels) {
  return builderConfig.value.labels?.[key] || defaultLabels[key]
}

const shellTitle = computed(() => props.title || builderConfig.value.title || 'Construtor de Formulários')
const isHeaderVisible = computed(() => resolveBoolean(props.showHeader, builderConfig.value.layout?.showHeader, true))
const isThemeToggleVisible = computed(() => resolveBoolean(props.showThemeToggle, builderConfig.value.layout?.showThemeToggle, true))
const areFloatingControlsVisible = computed(() => resolveBoolean(props.showFloatingControls, builderConfig.value.layout?.showFloatingControls, true))
const isLeftDrawerVisible = computed(() => resolveBoolean(props.showLeftDrawer, builderConfig.value.layout?.showLeftDrawer, true))
const isRightDrawerVisible = computed(() => resolveBoolean(props.showRightDrawer, builderConfig.value.layout?.showRightDrawer, true))

const slotProps = computed(() => ({
  controls,
  formStore,
  formHistoryStore,
  formFields: formStore.formFields,
  isDark: isDark.value,
  previewMode: formStore.formSettings.previewMode,
}))

function getMergedSlotProps(extraProps: Record<string, unknown>) {
  return {
    ...slotProps.value,
    ...extraProps,
  }
}
</script>

<template>
  <q-layout view="hHh lpR fFf" :class="getUiClass('layout')">
    <template v-if="isHeaderVisible">
      <slot name="header" v-bind="slotProps">
        <q-header
          bordered
          class="text-white"
          height-hint="98"
          :class="[isDark ? 'bg-grey-10' : 'bg-white', getUiClass('header')]"
        >
          <q-toolbar>
            <slot name="header-before" v-bind="slotProps" />
            <slot name="header-title" v-bind="slotProps">
              <q-toolbar-title :class="[isDark ? 'text-grey-11' : 'text-blue-grey-10', getUiClass('headerTitle')]">
                {{ shellTitle }}
              </q-toolbar-title>
            </slot>
            <slot name="header-after" v-bind="slotProps">
              <ClientOnly v-if="isThemeToggleVisible">
                <q-toggle
                  :model-value="isDark"
                  checked-icon="dark_mode"
                  unchecked-icon="light_mode"
                  size="xl"
                  color="primary"
                  keep-color
                  @update:model-value="controls.toggleTheme"
                />
              </ClientOnly>
            </slot>
          </q-toolbar>
        </q-header>
      </slot>
    </template>

    <TheElementsDrawer v-if="isLeftDrawerVisible" v-model="controls.isElementsDrawerOpened.value">
      <template #before="drawerSlotProps">
        <slot name="left-drawer-before" v-bind="getMergedSlotProps(drawerSlotProps)" />
      </template>
      <template #after="drawerSlotProps">
        <slot name="left-drawer-after" v-bind="getMergedSlotProps(drawerSlotProps)" />
      </template>
      <template v-if="$slots['left-drawer-empty']" #empty="drawerSlotProps">
        <slot name="left-drawer-empty" v-bind="getMergedSlotProps(drawerSlotProps)" />
      </template>
    </TheElementsDrawer>

    <TheFormSettingsDrawer v-if="isRightDrawerVisible" v-model="controls.isPropertiesDrawerOpened.value">
      <template #before="drawerSlotProps">
        <slot name="right-drawer-before" v-bind="getMergedSlotProps(drawerSlotProps)" />
      </template>
      <template #after="drawerSlotProps">
        <slot name="right-drawer-after" v-bind="getMergedSlotProps(drawerSlotProps)" />
      </template>
    </TheFormSettingsDrawer>

    <q-page-container>
      <q-page :style-fn="controls.getPageStyle" :class="getUiClass('page')">
        <slot name="center" v-bind="slotProps">
          <slot v-bind="slotProps">
            <ClientOnly>
              <FormBuilder />
              <template #fallback>
                <div class="builder-client-fallback" />
              </template>
            </ClientOnly>
          </slot>
        </slot>
        <slot v-if="areFloatingControlsVisible" name="floating-controls" v-bind="slotProps">
          <div :class="getUiClass('floatingControls')">
            <q-page-sticky position="top-left" :offset="[12, 12]" data-keep-active>
              <q-tabs
                :model-value="formStore.formSettings.previewMode" vertical dense shrink class="rounded-borders"
                :class="isDark ? 'bg-dark text-white' : 'bg-white text-blue-grey-10'" indicator-color="transparent"
                active-bg-color="primary" active-color="blue-grey-1" style="max-height: 4.5rem;"
                @update:model-value="controls.updatePreviewMode"
              >
                <q-tab name="editing">
                  <template #default>
                    <q-icon name="edit" size="xs">
                      <q-tooltip class="bg-grey-10" anchor="center right" self="center left" :offset="[12, 12]">
                        {{ getLabel('edit') }}
                      </q-tooltip>
                    </q-icon>
                  </template>
                </q-tab>
                <q-tab name="previewing">
                  <template #default>
                    <q-icon name="visibility" size="xs">
                      <q-tooltip class="bg-grey-10" anchor="center right" self="center left" :offset="[12, 12]">
                        {{ getLabel('preview') }}
                      </q-tooltip>
                    </q-icon>
                  </template>
                </q-tab>
              </q-tabs>
            </q-page-sticky>

            <q-page-sticky position="top-right" :offset="[12, 12]" data-keep-active>
              <q-tabs
                vertical dense shrink class="rounded-borders"
                :class="isDark ? 'bg-dark text-grey-11' : 'bg-white text-blue-grey-10'" indicator-color="transparent"
                style="max-height: 4.5rem;"
              >
                <q-tab name="undo" :disable="!controls.canUndo.value" @click="controls.undo">
                  <template #default>
                    <q-icon name="undo" size="xs">
                      <q-tooltip class="bg-grey-10" anchor="center left" self="center right" :offset="[12, 12]">
                        {{ getLabel('undo') }}
                      </q-tooltip>
                    </q-icon>
                  </template>
                </q-tab>
                <q-tab name="redo" :disable="!controls.canRedo.value" @click="controls.redo">
                  <template #default>
                    <q-icon name="redo" size="xs">
                      <q-tooltip class="bg-grey-10" anchor="center left" self="center right" :offset="[12, 12]">
                        {{ getLabel('redo') }}
                      </q-tooltip>
                    </q-icon>
                  </template>
                </q-tab>
              </q-tabs>
            </q-page-sticky>

            <q-page-sticky position="bottom-left" :offset="[12, 12]" data-keep-active>
              <q-tabs
                v-if="isLeftDrawerVisible"
                vertical dense shrink class="rounded-borders q-mb-sm"
                :class="isDark ? 'bg-dark text-grey-11' : 'bg-white text-blue-grey-10'" indicator-color="transparent"
                style="max-height: 4.5rem;"
              >
                <q-tab name="close-left-panel" @click="controls.toggleLeftDrawer()">
                  <template #default>
                    <q-icon :name="controls.isElementsDrawerOpened.value ? 'arrow_back' : 'arrow_forward'" size="xs">
                      <q-tooltip class="bg-grey-10" anchor="center right" self="center left" :offset="[12, 12]">
                        {{ controls.isElementsDrawerOpened.value ? getLabel('closeLeftDrawer') : getLabel('openLeftDrawer') }}
                      </q-tooltip>
                    </q-icon>
                  </template>
                </q-tab>
              </q-tabs>
              <q-tabs
                vertical dense shrink class="rounded-borders"
                :class="isDark ? 'bg-dark text-grey-11' : 'bg-white text-blue-grey-10'" indicator-color="transparent"
                style="max-height: 4.5rem;"
              >
                <q-tab name="empty-form-fields" @click="controls.clearForm">
                  <template #default>
                    <q-icon name="o_delete_forever" size="xs">
                      <q-tooltip class="bg-grey-10" anchor="center right" self="center left" :offset="[12, 12]">
                        {{ getLabel('clearForm') }}
                      </q-tooltip>
                    </q-icon>
                  </template>
                </q-tab>
              </q-tabs>
            </q-page-sticky>

            <q-page-sticky position="bottom-right" :offset="[12, 12]">
              <q-tabs
                v-if="isRightDrawerVisible"
                vertical dense shrink class="rounded-borders q-mb-sm"
                :class="isDark ? 'bg-dark text-grey-11' : 'bg-white text-blue-grey-10'" indicator-color="transparent"
                style="max-height: 4.5rem;"
              >
                <q-tab name="close-right-panel" @click="controls.toggleRightDrawer()">
                  <template #default>
                    <q-icon :name="controls.isPropertiesDrawerOpened.value ? 'arrow_forward' : 'arrow_back'" size="xs">
                      <q-tooltip class="bg-grey-10" anchor="center left" self="center right" :offset="[12, 12]">
                        {{ controls.isPropertiesDrawerOpened.value ? getLabel('closeRightDrawer') : getLabel('openRightDrawer') }}
                      </q-tooltip>
                    </q-icon>
                  </template>
                </q-tab>
              </q-tabs>
              <q-tabs
                vertical dense shrink class="rounded-borders"
                :class="isDark ? 'bg-dark text-grey-11' : 'bg-white text-blue-grey-10'" indicator-color="transparent"
                style="max-height: 4.5rem;"
              >
                <q-tab name="is-safe">
                  <template #default>
                    <q-icon name="gpp_good" size="xs" />
                  </template>
                </q-tab>
              </q-tabs>
            </q-page-sticky>
          </div>
        </slot>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<style scoped>
.builder-client-fallback {
  min-height: 100vh;
}
</style>
