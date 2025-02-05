<template>
  <SettingsExpansionBaseWrapper :section-labels="{ options: 'Opções de botão' }">
    <template #properties>
      <SettingsSlotsPropertiesCard hasTooltip hasDescription />
    </template>
    <template #options>
      <SettingsSlotsButtonOptionsCard />
    </template>
    <template #layout>
      <SettingsSlotsLayoutCard showFullWidth showAlignment showSize />
    </template>
    <template #conditions>
      <SettingsSlotsConditionsCard />
    </template>
  </SettingsExpansionBaseWrapper>
</template>
