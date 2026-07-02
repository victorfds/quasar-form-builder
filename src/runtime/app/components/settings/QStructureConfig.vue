<script setup lang="ts">
import { useFormStore } from '#qfb/stores/formStore'

const formStore = useFormStore()
</script>

<template>
  <SettingsExpansionBaseWrapper :section-labels="{ data: formStore.activeField?.$formkit === 'q-table-structure' ? 'Linhas e colunas' : 'Estrutura' }">
    <template #properties>
      <SettingsSlotsPropertiesCard has-description />
    </template>
    <template #data>
      <SettingsSlotsMatrixOptionsCard v-if="formStore.activeField?.$formkit === 'q-table-structure'" />
      <SettingsSlotsStructureOptionsCard v-else />
    </template>
    <template #layout>
      <SettingsSlotsLayoutCard />
    </template>
    <template #conditions>
      <SettingsSlotsConditionsCard />
    </template>
  </SettingsExpansionBaseWrapper>
</template>
