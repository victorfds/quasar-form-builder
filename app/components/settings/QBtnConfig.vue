<script setup lang="ts">
</script>

<template>
  <SettingsExpansionBaseWrapper :section-labels="{ options: 'Opções de botão' }">
    <template #properties>
      <SettingsPropertiesCard/>
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
