<template>
  <SettingsExpansionBaseWrapper :section-labels="{ options: 'Opções da caixa de seleção' }">
    <template #properties>
      <SettingsSlotsPropertiesCard />
    </template>
    <template #options>
      <SettingsSlotsCheckboxOptionsCard />
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
    <template #attributes>
      <SettingsSlotsAttributesCard />
    </template>
  </SettingsExpansionBaseWrapper>
</template>
