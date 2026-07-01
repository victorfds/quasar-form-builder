<template>
  <SettingsExpansionBaseWrapper :section-labels="{ data: 'Opções de data' }">
    <template #properties>
      <SettingsSlotsPropertiesCard has-placeholder has-description />
    </template>
    <template #layout>
      <SettingsSlotsLayoutCard show-dense />
    </template>
    <template #data>
      <SettingsSlotsDateOptionsCard />
    </template>
    <template #validation>
      <SettingsSlotsValidationCard />
    </template>
    <template #conditions>
      <SettingsSlotsConditionsCard />
    </template>
    <template #attributes>
      <SettingsSlotsAttributesCard show-readonly />
    </template>
  </SettingsExpansionBaseWrapper>
</template>
