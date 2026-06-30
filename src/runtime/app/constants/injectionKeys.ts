import type { ComputedRef, InjectionKey } from 'vue'

export const builderModeKey: InjectionKey<boolean> = Symbol('builderMode')
export const formBuilderDndKey: InjectionKey<Record<string, any> | null> = Symbol('formBuilderDnd')
export const schemaDataKey: InjectionKey<ComputedRef<Record<string, any>>> = Symbol('schemaData')
