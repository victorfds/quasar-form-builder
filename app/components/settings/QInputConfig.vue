<template>
  <SettingsExpansionBaseWrapper :section-labels="{ options: 'Opções de botão' }">
    <template #properties>
      <SettingsPropertiesCard hasInputType/>
    </template>
    <template #options>
      <SettingsButtonOptionsCard/>
    </template>
    <template #layout>
      <SettingsLayoutCard showFullWidth/>
    </template>
    <template #conditions>
      <SettingsConditionsCard/>
    </template>
  </SettingsExpansionBaseWrapper>
</template>
<script setup lang="ts">
</script>