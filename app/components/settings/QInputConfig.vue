<template>
  <SettingsExpansionBaseWrapper>
    <template #properties>
      <SettingsSlotsPropertiesCard hasInputType hasPlaceholder />
    </template>
    <template #layout>
      <SettingsSlotsLayoutCard showDense />
    </template>
    <template #validation>
      <SettingsSlotsValidationCard />
    </template>
    <template #conditions>
      <SettingsSlotsConditionsCard />
    </template>
  </SettingsExpansionBaseWrapper>
</template>
