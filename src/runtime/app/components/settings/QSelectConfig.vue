<template>
  <SettingsExpansionBaseWrapper>
    <template #properties>
      <SettingsSlotsPropertiesCard has-description />
    </template>
    <template #decorators>
      <SettingsSlotsFieldDesignCard />
    </template>
    <template #data>
      <SettingsSlotsDataCard />
    </template>
    <template #options>
      <SettingsSlotsSelectOptionsCard />
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
      <SettingsSlotsAttributesCard />
    </template>
  </SettingsExpansionBaseWrapper>
</template>
