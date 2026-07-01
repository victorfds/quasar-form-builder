<template>
  <SettingsExpansionBaseWrapper>
    <template #properties>
      <SettingsSlotsPropertiesCard has-description />
    </template>
    <template #data>
      <SettingsSlotsDataCard />
    </template>
    <template #options>
      <SettingsSlotsChoiceDisplayOptionsCard />
    </template>
    <template #layout>
      <SettingsSlotsLayoutCard show-dense show-alignment />
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
