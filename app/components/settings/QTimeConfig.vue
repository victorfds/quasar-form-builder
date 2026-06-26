<template>
  <SettingsExpansionBaseWrapper :section-labels="{ data: 'Opções de hora' }">
    <template #properties>
      <SettingsSlotsPropertiesCard has-placeholder has-description />
    </template>
    <template #layout>
      <SettingsSlotsLayoutCard show-dense />
    </template>
    <template #data>
      <SettingsSlotsTimeOptionsCard />
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
