<template>
  <SettingsExpansionBaseWrapper>
    <template #properties>
      <SettingsSlotsPropertiesCard hasInputType hasPlaceholder hasDescription />
    </template>
    <template #layout>
      <SettingsSlotsLayoutCard showDense />
    </template>
    <template #validation>
      <SettingsSlotsValidationCard showLength />
    </template>
    <template #conditions>
      <SettingsSlotsConditionsCard />
    </template>
    <template #attributes>
      <SettingsSlotsAttributesCard showReadonly />
    </template>
  </SettingsExpansionBaseWrapper>
</template>
