import type { ComputedRef, InjectionKey, Ref } from 'vue'
import type { QfbMediaController, QfbMediaErrorDescription } from '../../types/media'

export const builderModeKey: InjectionKey<boolean> = Symbol('builderMode')
export const formBuilderDndKey: InjectionKey<Record<string, any> | null> = Symbol('formBuilderDnd')
export const schemaDataKey: InjectionKey<ComputedRef<Record<string, any>>> = Symbol('schemaData')

export const qfbMediaControllerKey: InjectionKey<Readonly<Ref<QfbMediaController | undefined>>>
  = Symbol('qfb-media-controller')
export const qfbViewerReadonlyKey: InjectionKey<Readonly<Ref<boolean>>> = Symbol('qfb-viewer-readonly')
export const qfbMediaErrorKey: InjectionKey<(error: QfbMediaErrorDescription) => void> = Symbol('qfb-media-error')
