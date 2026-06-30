<template>
  <SettingsExpansionBaseWrapper :section-labels="{ options: 'Opções de botão' }">
    <template #properties>
      <SettingsSlotsPropertiesCard has-tooltip has-description />
    </template>
    <template #options>
      <SettingsSlotsButtonOptionsCard />
    </template>
    <template #layout>
      <SettingsSlotsLayoutCard show-full-width show-alignment show-size />
    </template>
    <template #conditions>
      <SettingsSlotsConditionsCard />
    </template>
  </SettingsExpansionBaseWrapper>
</template>
