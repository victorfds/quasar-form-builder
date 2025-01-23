<template>
  <SettingsExpansionBaseWrapper>
    <template #properties>
      <SettingsSlotsPropertiesCard hasInputType hasPlaceholder />
    </template>
    <template #layout>
      <SettingsSlotsLayoutCard showDense />
    </template>
    <template #conditions>
      <SettingsSlotsConditionsCard />
    </template>
    <template #validation>
      <SettingsSlotsValidationCard />
    </template>
  </SettingsExpansionBaseWrapper>
</template>
