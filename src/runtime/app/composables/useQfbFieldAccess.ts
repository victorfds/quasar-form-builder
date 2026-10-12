import type { FormKitFrameworkContext } from '@formkit/core'
import { computed, inject } from 'vue'
import { qfbViewerReadonlyKey } from '../media/injection'
import { getFormKitContextAttrs } from '../utils/quasarFieldDesign'

export function useQfbFieldAccess(context: FormKitFrameworkContext) {
  const viewerReadonly = inject(qfbViewerReadonlyKey, computed(() => false))
  const state = computed(() => {
    const attrs = getFormKitContextAttrs(context, ['readonly', 'disable', 'disabled'])
    return { readonly: Boolean(viewerReadonly.value || attrs.readonly), disabled: Boolean(context.disabled || attrs.disable || attrs.disabled) }
  })
  return { state, locked: computed(() => state.value.readonly || state.value.disabled) }
}
