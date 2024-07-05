<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
<script setup>
const { dark } = useQuasar();

dark.set(true)
</script>
