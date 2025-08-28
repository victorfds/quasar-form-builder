<script setup lang="ts">

defineProps<{ label?: string, info?: string, description?: string }>()

const $q = useQuasar()
</script>

<template>
  <div>
    <div v-if="label" class="row q-mb-xs">
      <div>
        <span class="text-body2" :class="$q.dark.isActive ? 'text-grey-11' : 'text-blue-grey-10'">{{ label }}</span>
        <q-icon v-if="info" name="info" class="q-ml-xs cursor-pointer"
                :class="$q.dark.isActive ? 'text-grey-9 ' : 'text-blue-grey-4'">
          <q-tooltip class="bg-grey-10" anchor="center right" self="center left" :offset="[12, 12]">
            {{ info }}
          </q-tooltip>
        </q-icon>
      </div>
    </div>
    <slot/>
    <div v-if="description" class="q-mt-xs text-body2"
         :class="$q.dark.isActive ? 'text-grey-7 ' : 'text-blue-grey-7'">
      {{ description }}
    </div>
  </div>
</template>
