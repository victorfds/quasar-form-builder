<template>
  <SettingsExpansionBaseWrapper :section-labels="{ data: 'Opções do slider' }">
    <template #properties>
      <SettingsSlotsPropertiesCard has-description />
    </template>
    <template #data>
      <SettingsSlotsSliderOptionsCard />
    </template>
    <template #layout>
      <SettingsSlotsLayoutCard show-dense />
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
