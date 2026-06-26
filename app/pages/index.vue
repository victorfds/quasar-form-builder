<template>
  <ClientOnly>
    <FormBuilder />
    <template #fallback>
      <div class="builder-client-fallback" />
    </template>
  </ClientOnly>
</template>

<style scoped>
.builder-client-fallback {
  min-height: 100vh;
}
</style>
