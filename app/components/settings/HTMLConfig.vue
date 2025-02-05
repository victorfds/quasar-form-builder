<template>
  <SettingsExpansionBaseWrapper :section-labels="{ options: 'Conteúdo' }">
    <template #properties>
      <SettingsSlotsPropertiesCard hasTooltip hasDescription />
    </template>
    <template #options>
      <SettingsSlotsOptionsCard />
    </template>
    <template #layout>
      <SettingsSlotsLayoutCard showAlignment setAttrs />
    </template>
    <template #conditions>
      <SettingsSlotsConditionsCard />
    </template>
  </SettingsExpansionBaseWrapper>
</template>
