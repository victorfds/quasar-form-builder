<template>
  <SettingsExpansionBaseWrapper :section-labels="{ options: 'Opções de botão' }">
    <template #properties>
      <SettingsPropertiesCard hasTooltip />
    </template>
    <template #options>
      <SettingsButtonOptionsCard />
    </template>
    <template #layout>
      <SettingsLayoutCard showFullWidth showAlignment showSize />
    </template>
    <template #conditions>
      <SettingsConditionsCard />
    </template>
  </SettingsExpansionBaseWrapper>
</template>
