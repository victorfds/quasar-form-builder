<template>
  <SettingsExpansionBaseWrapper>
    <template #properties>
      <SettingsSlotsPropertiesCard hasTooltip hasDescription />
    </template>
    <template #layout>
      <SettingsSlotsLayoutCard />
    </template>
    <template #conditions>
      <SettingsSlotsConditionsCard />
    </template>
  </SettingsExpansionBaseWrapper>
</template>
