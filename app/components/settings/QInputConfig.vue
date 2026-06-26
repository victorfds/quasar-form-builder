<template>
  <SettingsExpansionBaseWrapper>
    <template #properties>
      <SettingsSlotsPropertiesCard has-input-type has-placeholder has-description />
    </template>
    <template #decorators>
      <SettingsSlotsFieldDesignCard />
    </template>
    <template #options>
      <SettingsSlotsInputOptionsCard />
    </template>
    <template #layout>
      <SettingsSlotsLayoutCard show-dense />
    </template>
    <template #validation>
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
