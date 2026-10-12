<template>
  <SettingsExpansionBaseWrapper>
    <template #properties>
      <SettingsSlotsPropertiesCard has-description />
    </template>
    <template #data>
      <SettingsSlotsAudioOptionsCard /><SettingsSlotsFileOptionsCard />
    </template>
    <template #validation>
      <SettingsSlotsValidationCard />
    </template>
    <template #attributes>
      <SettingsSlotsAttributesCard show-readonly />
    </template>
    <template #conditions>
      <SettingsSlotsConditionsCard />
    </template>
    <template #layout>
      <SettingsSlotsLayoutCard />
    </template>
  </SettingsExpansionBaseWrapper>
</template>
