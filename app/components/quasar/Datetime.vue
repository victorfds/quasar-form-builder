<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QInputProps } from 'quasar'

const props = defineProps<{ context: FormKitFrameworkContext & { attrs: QInputProps } }>()

const defaultDate = `${new Date().toLocaleDateString()}`

const { dark } = useQuasar()
const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
</script>

<template>
  <q-input
    filled :model-value="context.value || defaultDate" v-bind="context.attrs" :error-message="getMessages" color="cyan-8"
    :error="hasError" :hint="context.help" inputmode="none" @update:model-value="(val) => context?.node.input(val)"
    @blur="checkForErrorMessages"
    @keydown.stop.prevent @keypress.stop.prevent @beforeinput.stop.prevent @paste.stop.prevent @drop.stop.prevent @cut.stop.prevent
  >
    <template #prepend>
      <q-icon name="event" class="cursor-pointer" :color="dark.isActive ? 'grey-5' : 'blue-grey-5'">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-date
            :model-value="context.value || defaultDate" mask="YYYY-MM-DD HH:mm" today-btn
            @update:model-value="(val) => context?.node.input(val)"
          >
            <div class="row items-center justify-end">
              <q-btn v-close-popup label="Close" color="primary" flat />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-icon>
    </template>

    <template #append>
      <q-icon name="access_time" class="cursor-pointer" :color="dark.isActive ? 'grey-5' : 'blue-grey-5'">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-time
            :model-value="context.value || defaultDate" mask="YYYY-MM-DD HH:mm" format24h
            @update:model-value="(val) => context?.node.input(val)"
          >
            <div class="row items-center justify-end">
              <q-btn v-close-popup label="Close" color="primary" flat />
            </div>
          </q-time>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>
