<template>
  <SettingsExpansionBaseWrapper>
    <template #properties>
      <SettingsPropertiesCard hasInputType hasPlaceholder />
    </template>
    <template #layout>
      <SettingsLayoutCard showDense />
    </template>
    <template #conditions>
      <SettingsConditionsCard />
    </template>
  </SettingsExpansionBaseWrapper>
</template>
