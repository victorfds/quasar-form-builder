<template>
  <SettingsExpansionBaseWrapper>
    <template #properties>
      <SettingsSlotsPropertiesCard hasPlaceholder hasDescription />
    </template>
    <template #layout>
      <SettingsSlotsLayoutCard showDense />
    </template>
    <template #validation>
      <SettingsSlotsValidationCard />
    </template>
    <template #data>
      <SettingsSlotsFileOptionsCard />
    </template>
    <template #conditions>
      <SettingsSlotsConditionsCard />
    </template>
    <template #attributes>
      <SettingsSlotsAttributesCard showReadonly />
    </template>
  </SettingsExpansionBaseWrapper>
</template>


