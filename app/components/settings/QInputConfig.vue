<script setup lang="ts">
const formStore = useFormStore()
const isHiddenInput = computed(() => formStore.activeField?.inputType === 'hidden')
</script>

<template>
  <SettingsExpansionBaseWrapper>
    <template #properties>
      <SettingsSlotsPropertiesCard
        v-if="!isHiddenInput"
        has-input-type
        has-placeholder
        has-description
      />
      <SettingsSlotsPropertiesCard v-else />
    </template>
    <template v-if="isHiddenInput" #data>
      <SettingsSlotsHiddenDataCard />
    </template>
    <template v-if="!isHiddenInput" #decorators>
      <SettingsSlotsFieldDesignCard />
    </template>
    <template v-if="!isHiddenInput" #options>
      <SettingsSlotsInputOptionsCard />
    </template>
    <template v-if="!isHiddenInput" #layout>
      <SettingsSlotsLayoutCard show-dense />
    </template>
    <template v-if="!isHiddenInput" #validation>
      <SettingsSlotsValidationCard show-length />
    </template>
    <template #conditions>
      <SettingsSlotsConditionsCard />
    </template>
    <template #attributes>
      <SettingsSlotsAttributesCard show-readonly />
    </template>
  </SettingsExpansionBaseWrapper>
</template>
