import { empty, eq } from '@formkit/utils'

export function useFormKitData(source: Record<string, any>) {
  const data = computed(() => ({ ...source, empty, eq, contains }))
  return { data }
}


