<script setup>
const { dark, localStorage } = useQuasar()

dark.set(false)

if (import.meta.client) {
  const cachedTheme = localStorage.getItem('theme')
  if (String(cachedTheme)?.includes('dark')) {
    // INFO: It is needed timeout here to avoid mismatch hydration between server and client
    setTimeout(() => {
      dark.set(true)
    }, 400)
  }
}
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
