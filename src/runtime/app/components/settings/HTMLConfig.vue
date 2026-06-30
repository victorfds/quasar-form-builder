<template>
  <SettingsExpansionBaseWrapper :section-labels="{ options: 'Conteúdo' }">
    <template #properties>
      <SettingsSlotsPropertiesCard has-tooltip has-description />
    </template>
    <template #options>
      <SettingsSlotsOptionsCard />
    </template>
    <template #layout>
      <SettingsSlotsLayoutCard show-alignment set-attrs />
    </template>
    <template #conditions>
      <SettingsSlotsConditionsCard />
    </template>
  </SettingsExpansionBaseWrapper>
</template>
