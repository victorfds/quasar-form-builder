<template>
  <SettingsExpansionBaseWrapper :section-labels="{ data: 'Linhas e colunas' }">
    <template #properties>
      <SettingsSlotsPropertiesCard has-description />
    </template>
    <template #data>
      <SettingsSlotsMatrixOptionsCard />
    </template>
    <template #layout>
      <SettingsSlotsLayoutCard />
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
