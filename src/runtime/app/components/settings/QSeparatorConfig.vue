<template>
  <SettingsExpansionBaseWrapper :section-labels="{ options: 'Opções do separador' }">
    <template #properties>
      <SettingsSlotsPropertiesCard has-tooltip has-description />
    </template>
    <template #options>
      <SettingsSlotsSeparatorOptionsCard />
    </template>
    <template #layout>
      <SettingsSlotsLayoutCard />
    </template>
    <template #conditions>
      <SettingsSlotsConditionsCard />
    </template>
  </SettingsExpansionBaseWrapper>
</template>
