<template>
  <SettingsExpansionBaseWrapper>
    <template #properties>
      <SettingsSlotsPropertiesCard has-placeholder has-description />
    </template>
    <template #layout>
      <SettingsSlotsLayoutCard show-dense />
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
      <SettingsSlotsAttributesCard show-readonly />
    </template>
  </SettingsExpansionBaseWrapper>
</template>
